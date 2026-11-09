"""Cloud Shell workflow for a protected, temporary Cloud Run recording."""
import argparse
import base64
from datetime import datetime, timezone
import hashlib
import json
import math
import os
from pathlib import Path
import re
import secrets
import subprocess
import sys
from urllib.error import HTTPError
from urllib.request import Request, build_opener, HTTPRedirectHandler
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT / 'gcp-state'
CONFIG = ROOT / 'gcp/deployment-config.json'
PURPOSE = 'claude-learning-gcp-video'
APIS = ['run.googleapis.com', 'cloudbuild.googleapis.com', 'artifactregistry.googleapis.com',
        'secretmanager.googleapis.com', 'iam.googleapis.com', 'storage.googleapis.com']
PROJECT = None
REGION = None


def now(): return datetime.now(timezone.utc).isoformat()


def read(name, default=None):
    path = STATE / name
    return json.loads(path.read_text()) if path.is_file() else default


def private_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True, mode=0o700 if os.name != 'nt' else 0o777)
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, 'w') as handle: json.dump(value, handle, indent=2)
    path.chmod(0o600)


def save(name, value): private_json(STATE / name, value)


class GcloudError(RuntimeError):
    pass


def gc(*args, data=None, json_output=True):
    command = ['gcloud', *map(str, args), '--project=' + PROJECT, '--quiet', '--format=json']
    process = subprocess.run(command, input=data, capture_output=True, text=True,
        env={**os.environ, 'CLOUDSDK_CORE_DISABLE_PROMPTS': '1', 'CLOUDSDK_CORE_DISABLE_COLOR': '1'})
    if process.returncode:
        error = process.stderr.strip()
        access = read('recording-access.json', {})
        for key in ['password']:
            if access.get(key): error = error.replace(access[key], '[withheld]')
        raise GcloudError(error)
    if not json_output: return None
    return json.loads(process.stdout) if process.stdout.strip() else {}


def maybe(*args):
    try: return gc(*args)
    except GcloudError as error:
        message = str(error)
        if ('NOT_FOUND' in message or 'NotFoundException' in message or 'HTTPError 404' in message or 'not found: 404' in message or 'ERROR: (gcloud.run.services.describe) Cannot find service [' in message) and 'PERMISSION_DENIED' not in message:
            return None
        raise


def load_config():
    global PROJECT, REGION
    if not CONFIG.is_file(): raise RuntimeError('Run configure with your own project first.')
    config = json.loads(CONFIG.read_text())
    PROJECT, REGION = config.get('projectId'), config.get('region')
    validate_config(PROJECT, REGION)
    manifest = read('manifest.json')
    if not manifest or manifest.get('projectId') != PROJECT or manifest.get('region') != REGION:
        raise RuntimeError('Configuration and deployment manifest must match. Do not change project or region after setup.')


def validate_config(project, region):
    if not isinstance(project, str) or not re.fullmatch(r'[a-z][a-z0-9-]{4,28}[a-z0-9]', project):
        raise RuntimeError('Supply a valid Google Cloud project ID.')
    if region not in {'europe-west1', 'europe-southwest1'}:
        raise RuntimeError('This recording helper supports europe-west1 or europe-southwest1.')


def names():
    suffix = hashlib.sha256((PROJECT + ':' + REGION).encode()).hexdigest()[:8]
    return {'deployment': suffix, 'bucket': PROJECT + '-cma-video-' + suffix,
        'repository': 'cma-learning-video-' + suffix, 'service': 'cma-learning-video-' + suffix,
        'secret': 'cma-recording-digest-' + suffix,
        'buildAccount': 'cma-video-build-' + suffix + '@' + PROJECT + '.iam.gserviceaccount.com',
        'runtimeAccount': 'cma-video-run-' + suffix + '@' + PROJECT + '.iam.gserviceaccount.com'}


def labels(): return {'purpose': PURPOSE, 'deployment': names()['deployment']}


def label_flag(): return ','.join(k + '=' + v for k, v in labels().items())


def project_info():
    project = gc('projects', 'describe', PROJECT)
    if project.get('projectId') != PROJECT or project.get('lifecycleState') != 'ACTIVE':
        raise RuntimeError('A matching active project is required.')
    return project


def configure(args):
    global PROJECT, REGION
    validate_config(args.project_id, args.region)
    previous = json.loads(CONFIG.read_text()) if CONFIG.is_file() else None
    if STATE.exists() and any(STATE.iterdir()) and previous != {'projectId': args.project_id, 'region': args.region}:
        raise RuntimeError('Existing state must keep its original project and region.')
    PROJECT, REGION = args.project_id, args.region
    project = project_info()
    config = {'projectId': PROJECT, 'region': REGION}
    private_json(CONFIG, config)
    if read('manifest.json') is None:
        save('manifest.json', {**config, 'projectNumber': str(project['projectNumber']),
            'purpose': PURPOSE, 'resources': names(), 'configuredAt': now()})
    return {**config, 'projectNumber': str(project['projectNumber']), 'cloudResourcesCreated': False}


def preflight():
    project = project_info()
    billing = gc('billing', 'projects', 'describe', PROJECT)
    if billing.get('billingEnabled') is not True:
        raise RuntimeError('This project needs an active linked billing account before deployment.')
    services = gc('services', 'list', '--enabled')
    enabled = {row['config']['name'] for row in services}
    result = {'recordedAt': now(), 'projectId': PROJECT, 'projectNumber': str(project['projectNumber']),
        'region': REGION, 'billingEnabled': True, 'requiredApis': APIS,
        'missingApis': [api for api in APIS if api not in enabled],
        'creationPermissionsVerified': False, 'cloudResourcesCreated': False}
    save('preflight.json', result)
    return result


def owned(value, kind):
    if value is None: return
    actual = value.get('metadata', {}).get('labels', {}) if kind == 'service' else value.get('labels', {})
    if kind in {'buildAccount', 'runtimeAccount'}:
        if value.get('description') != PURPOSE + ':' + names()['deployment']:
            raise RuntimeError('Refusing unrelated service account: ' + kind)
    elif any(actual.get(k) != v for k, v in labels().items()):
        raise RuntimeError('Refusing unrelated resource: ' + kind)


def resource_get(kind):
    n = names()
    args = {
        'bucket': ('storage', 'buckets', 'describe', 'gs://' + n['bucket']),
        'repository': ('artifacts', 'repositories', 'describe', n['repository'], '--location=' + REGION),
        'service': ('run', 'services', 'describe', n['service'], '--region=' + REGION),
        'secret': ('secrets', 'describe', n['secret']),
        'buildAccount': ('iam', 'service-accounts', 'describe', n['buildAccount']),
        'runtimeAccount': ('iam', 'service-accounts', 'describe', n['runtimeAccount']),
    }[kind]
    value = maybe(*args)
    owned(value, kind)
    return value


def budget(value):
    if not math.isfinite(value) or value <= 0: raise RuntimeError('Supply your agreed positive recording budget estimate.')
    save('budget.json', {'estimatedBudgetEuros': value, 'hardSpendingCap': False, 'recordedAt': now()})


def prepare(args):
    budget(args.approved_budget_eur)
    preflight()
    # APIs are project settings. Cleanup will not disable them or remove the project.
    gc('services', 'enable', *APIS, json_output=False)
    n = names()
    existing = {kind: resource_get(kind) for kind in ['bucket', 'repository', 'secret', 'buildAccount', 'runtimeAccount']}
    if existing['secret'] and read('recording-access.json') is None:
        raise RuntimeError('Restore the private access file for this existing recording secret; do not silently replace its password.')
    if not existing['bucket']:
        gc('storage', 'buckets', 'create', 'gs://' + n['bucket'], '--location=' + REGION,
            '--uniform-bucket-level-access', '--public-access-prevention', '--soft-delete-duration=0',
            '--labels=' + label_flag(), json_output=False)
    if not existing['repository']:
        gc('artifacts', 'repositories', 'create', n['repository'], '--location=' + REGION,
            '--repository-format=docker', '--immutable-tags', '--labels=' + label_flag())
    for kind in ['buildAccount', 'runtimeAccount']:
        if not existing[kind]:
            gc('iam', 'service-accounts', 'create', n[kind].split('@')[0],
                '--description=' + PURPOSE + ':' + n['deployment'], '--display-name=Learning platform video ' + kind)
    member = 'serviceAccount:' + n['buildAccount']
    gc('storage', 'buckets', 'add-iam-policy-binding', 'gs://' + n['bucket'],
        '--member=' + member, '--role=roles/storage.admin')
    gc('artifacts', 'repositories', 'add-iam-policy-binding', n['repository'], '--location=' + REGION,
        '--member=' + member, '--role=roles/artifactregistry.writer')
    access = read('recording-access.json')
    if not access:
        access = {'username': 'instructor', 'password': secrets.token_urlsafe(32)}
        save('recording-access.json', access)
    if not existing['secret']:
        gc('secrets', 'create', n['secret'], '--replication-policy=automatic', '--labels=' + label_flag())
    if not read('digest-version.json'):
        digest = hashlib.sha256((access['username'] + ':' + access['password']).encode()).hexdigest()
        version = gc('secrets', 'versions', 'add', n['secret'], '--data-file=-', data=digest)
        save('digest-version.json', {'version': version['name'].split('/')[-1]})
    gc('secrets', 'add-iam-policy-binding', n['secret'],
        '--member=serviceAccount:' + n['runtimeAccount'], '--role=roles/secretmanager.secretAccessor')
    result = {'preparedAt': now(), 'projectId': PROJECT, 'region': REGION, 'resources': n,
        'sourceBucketSoftDelete': 'disabled for temporary tutorial source/logs',
        'roles': {'builder': 'storage.admin on this bucket; artifactregistry.writer on this repository',
                  'runtime': 'secretAccessor on this credential digest only'}}
    save('prepared.json', result)
    return result


def build(args):
    project_info()
    if not read('prepared.json') or not read('budget.json'): raise RuntimeError('Run prepare first.')
    if read('build.json', {}).get('id'): raise RuntimeError('A build has already started. Use status; do not start a duplicate.')
    source = Path(args.source_zip).expanduser().resolve()
    if not source.is_file(): raise RuntimeError('Source ZIP not found.')
    with source.open('rb') as handle: sha = hashlib.file_digest(handle, 'sha256').hexdigest()
    for kind in ['bucket', 'repository', 'buildAccount']:
        if resource_get(kind) is None: raise RuntimeError('Required prepared resource is missing: ' + kind)
    n = names()
    location = 'gs://' + n['bucket'] + '/source/' + sha + '.zip'
    image = REGION + '-docker.pkg.dev/' + PROJECT + '/' + n['repository'] + '/platform:source-' + sha[:20]
    gc('storage', 'cp', source, location, json_output=False)
    result = gc('builds', 'submit', location, '--config=' + str(ROOT / 'gcp/cloudbuild.json'),
        '--region=' + REGION, '--async', '--service-account=projects/' + PROJECT + '/serviceAccounts/' + n['buildAccount'],
        '--gcs-source-staging-dir=gs://' + n['bucket'] + '/build-source',
        '--gcs-log-dir=gs://' + n['bucket'] + '/build-logs', '--substitutions=_IMAGE_URI=' + image)
    result = result[0] if isinstance(result, list) else result
    state = {'id': result['id'], 'sourceSha256': sha, 'imageTag': image, 'requestedAt': now()}
    save('build.json', state)
    return {**state, 'next': 'Use status until the build is SUCCESS. Do not repeat build.'}


def build_status():
    state = read('build.json')
    return gc('builds', 'describe', state['id'], '--region=' + REGION) if state else None


def deploy(args):
    budget(args.approved_budget_eur)
    project_info()
    build = build_status()
    state = read('build.json', {})
    if not build or build.get('status') != 'SUCCESS': raise RuntimeError('The recorded Cloud Build build must be SUCCESS first.')
    images = build.get('results', {}).get('images', [])
    if len(images) != 1 or images[0].get('name') != state.get('imageTag') or not re.fullmatch(r'sha256:[a-f0-9]{64}', images[0].get('digest', '')):
        raise RuntimeError('Successful build did not return the expected image digest.')
    image = state['imageTag'].rsplit(':', 1)[0] + '@' + images[0]['digest']
    n = names()
    existing = resource_get('service')
    if existing:
        containers = existing.get('spec', {}).get('template', {}).get('spec', {}).get('containers', [])
        if len(containers) != 1 or containers[0].get('image') != image:
            raise RuntimeError('Existing tutorial service uses a different image; inspect it before resuming deployment.')
    access = read('recording-access.json')
    version = read('digest-version.json')
    if not access or not version: raise RuntimeError('Restore the original private recording access files.')
    env = {'LEARNING_RECORDING_GATEWAY': 'true', 'LEARNING_PUBLIC_ORIGIN': 'https://deployment-pending.invalid',
        'ANTHROPIC_API_KEY': '', 'AI_TUTOR_LIVE_ENABLED': 'false', 'MANAGED_LIVE_ENABLED': 'false',
        'MILESTONE_LIVE_ENABLED': 'false', 'INWORLD_NARRATION_ENABLED': '0'}
    if not existing:
        path = STATE / 'runtime-env.yaml'
        # JSON is a YAML subset accepted by --env-vars-file. Contains no clear password.
        private_json(path, env)
        try:
            gc('run', 'deploy', n['service'], '--region=' + REGION, '--platform=managed', '--image=' + image,
                '--service-account=' + n['runtimeAccount'], '--port=8080', '--cpu=1', '--memory=2Gi',
                '--concurrency=8', '--min-instances=0', '--max-instances=1', '--timeout=120s', '--ingress=all',
                '--no-allow-unauthenticated', '--command=node', '--args=azure/recording-gateway.mjs',
                '--env-vars-file=' + str(path), '--set-secrets=LEARNING_ACCESS_SHA256=' + n['secret'] + ':' + version['version'],
                '--startup-probe=httpGet.path=/api/health,httpGet.port=8080,periodSeconds=5,timeoutSeconds=5,failureThreshold=48',
                '--labels=' + label_flag())
        finally: path.unlink(missing_ok=True)
    service = resource_get('service')
    origin = service.get('status', {}).get('url')
    if not origin or urlsplit(origin).scheme != 'https' or not urlsplit(origin).hostname.endswith('.run.app'):
        raise RuntimeError('Expected the deployed Cloud Run HTTPS URL.')
    # Set the observed exact origin while the service is still private at Cloud Run IAM.
    gc('run', 'services', 'update', n['service'], '--region=' + REGION,
        '--update-env-vars=LEARNING_PUBLIC_ORIGIN=' + origin)
    # The gateway enforces a private app password. Public transport is needed for the browser recording.
    gc('run', 'services', 'add-iam-policy-binding', n['service'], '--region=' + REGION,
        '--member=allUsers', '--role=roles/run.invoker')
    access['origin'] = origin; save('recording-access.json', access)
    result = {'requestedAt': now(), 'projectId': PROJECT, 'region': REGION, 'origin': origin,
        'image': image, 'serverStorage': 'ephemeral', 'paidModelsEnabled': False,
        'browserVerificationComplete': False, 'recordingGateway': 'password protected over Cloud Run HTTPS'}
    save('deployment.json', result)
    return result


def status():
    project_info()
    resources = {kind: resource_get(kind) for kind in ['service', 'repository', 'bucket', 'secret', 'buildAccount', 'runtimeAccount']}
    result = {'recordedAt': now(), 'projectId': PROJECT, 'region': REGION,
        'resources': {kind: {'name': names()[kind], 'status': 'PRESENT' if value else 'ABSENT'} for kind, value in resources.items()},
        'serverStorage': 'ephemeral', 'browserVerificationComplete': False, 'cloudProvisioningComplete': False}
    b = build_status()
    if b:
        result['imageBuild'] = {key: b.get(key) for key in ['id', 'status', 'createTime', 'finishTime', 'logUrl']}
        result['imageBuild']['sourceSha256'] = read('build.json')['sourceSha256']
    service = resources['service']
    if service:
        state = service.get('status', {})
        ready = any(row.get('type') == 'Ready' and row.get('status') == 'True' for row in state.get('conditions', []))
        policy = gc('run', 'services', 'get-iam-policy', names()['service'], '--region=' + REGION)
        public = any(row.get('role') == 'roles/run.invoker' and 'allUsers' in row.get('members', []) for row in policy.get('bindings', []))
        result['service'] = {'origin': state.get('url'), 'ready': ready, 'latestReadyRevision': state.get('latestReadyRevisionName'),
            'latestCreatedRevision': state.get('latestCreatedRevisionName'), 'publicTransport': public,
            'scalingAnnotations': service.get('spec', {}).get('template', {}).get('metadata', {}).get('annotations', {})}
        result['cloudProvisioningComplete'] = ready and public and state.get('latestReadyRevisionName') == state.get('latestCreatedRevisionName') and read('deployment.json') is not None
    save('evidence.json', result)
    return result


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl): return None


def verify():
    result = status()
    if not result['cloudProvisioningComplete']: raise RuntimeError('Wait for a ready deployed service first.')
    access = read('recording-access.json', {})
    origin = result['service']['origin']
    if access.get('origin') != origin: raise RuntimeError('Private recording credentials must match the deployed origin.')
    opener = build_opener(NoRedirect())
    checks = []
    for name, path, authorized, foreign, expected in [
        ('anonymous-app-denied', '/', False, False, 401), ('health-ready', '/api/health', False, False, 200),
        ('authenticated-home', '/', True, False, 200), ('foreign-origin-denied', '/api/ai-tutor/status', True, True, 403),
        ('tutor-status', '/api/ai-tutor/status', True, False, 200)]:
        headers = {'Origin': 'https://foreign.example'} if foreign else {}
        if authorized: headers['Authorization'] = 'Basic ' + base64.b64encode((access['username'] + ':' + access['password']).encode()).decode()
        try:
            with opener.open(Request(origin + path, headers=headers), timeout=90) as response:
                code, body = response.status, response.read(4 * 1024 * 1024)
        except HTTPError as error: code, body = error.code, b''
        if code != expected: raise RuntimeError(f'HTTPS check {name} expected {expected}, received {code}.')
        if name == 'health-ready' and json.loads(body).get('readiness') != 'ready': raise RuntimeError('Backend readiness check failed.')
        if name == 'tutor-status' and json.loads(body).get('liveAvailable') is not False: raise RuntimeError('Live tutor must stay disabled.')
        checks.append({'check': name, 'httpStatus': code, 'status': 'passed'})
    result['httpVerification'] = {'checkedAt': now(), 'complete': True, 'checks': checks}
    save('evidence.json', result)
    return result


def access():
    project_info()
    value = read('recording-access.json')
    service = resource_get('service')
    if not value or not service or service.get('status', {}).get('url') != value.get('origin'):
        raise RuntimeError('The private access file must match the deployed service.')
    return {key: value[key] for key in ['origin', 'username', 'password']}


def cleanup(args):
    if args.confirm_delete_project != PROJECT or not args.video_verified:
        raise RuntimeError('Cleanup requires the exact project and --video-verified.')
    project_info()
    # Validate all ownership BEFORE any delete. A mismatch stops the entire cleanup.
    resources = {kind: resource_get(kind) for kind in ['service', 'repository', 'bucket', 'secret', 'buildAccount', 'runtimeAccount']}
    b = build_status()
    if b and b.get('status') in {'QUEUED', 'PENDING', 'WORKING'}:
        gc('builds', 'cancel', b['id'], '--region=' + REGION)
        if build_status().get('status') in {'QUEUED', 'PENDING', 'WORKING'}:
            raise RuntimeError('Wait for the build to stop before cleanup.')
    n = names()
    if resources['service']: gc('run', 'services', 'delete', n['service'], '--region=' + REGION)
    if resources['repository']: gc('artifacts', 'repositories', 'delete', n['repository'], '--location=' + REGION)
    if resources['bucket']:
        # This dedicated labelled bucket contains tutorial source and its GCS build logs only.
        gc('storage', 'rm', '--recursive', 'gs://' + n['bucket'], json_output=False)
    if resources['secret']: gc('secrets', 'delete', n['secret'])
    for kind in ['buildAccount', 'runtimeAccount']:
        if resources[kind]: gc('iam', 'service-accounts', 'delete', n[kind])
    result = status()
    result['cleanupComplete'] = all(row['status'] == 'ABSENT' for row in result['resources'].values())
    result['projectBillingAndExistingServices'] = 'preserved'
    result['sharedLoggingAndBuildHistory'] = 'subject to existing project/provider retention; no shared log bucket deleted'
    save('cleanup-evidence.json', result)
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='command', required=True)
    command = commands.add_parser('configure')
    command.add_argument('--project-id', required=True)
    command.add_argument('--region', default='europe-west1')
    for name in ['preflight', 'status', 'verify', 'access']: commands.add_parser(name)
    for name in ['prepare', 'deploy']:
        command = commands.add_parser(name); command.add_argument('--approved-budget-eur', type=float, required=True)
    command = commands.add_parser('build'); command.add_argument('--source-zip', required=True)
    command = commands.add_parser('cleanup')
    command.add_argument('--confirm-delete-project', required=True)
    command.add_argument('--video-verified', action='store_true')
    args = parser.parse_args()
    try:
        if args.command == 'configure': result = configure(args)
        else:
            load_config()
            no_args = {'preflight': preflight, 'status': status, 'verify': verify, 'access': access}
            result = no_args[args.command]() if args.command in no_args else {'prepare': prepare, 'build': build, 'deploy': deploy, 'cleanup': cleanup}[args.command](args)
        print(json.dumps(result, indent=2))
    except (RuntimeError, OSError, ValueError, KeyError) as error:
        print(str(error), file=sys.stderr); sys.exit(1)


if __name__ == '__main__': main()
