"""CloudShell deployment driver. No local SDK, Docker or access keys required."""
import argparse
import base64
import hashlib
import json
import math
import os
import re
from pathlib import Path
import secrets
import subprocess
import sys
from urllib.request import Request, build_opener, HTTPRedirectHandler
from urllib.error import HTTPError
from urllib.parse import urlsplit
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT / 'aws-state'
PURPOSE = 'claude-learning-aws-video'
BUILD_STACK = PURPOSE + '-build'
APP_STACK = PURPOSE + '-app'
CONFIG = ROOT / 'aws/deployment-config.json'
ACCOUNT = None
REGION = 'eu-north-1'
SUCCESS = {'CREATE_COMPLETE', 'UPDATE_COMPLETE'}


def now(): return datetime.now(timezone.utc).isoformat()


def load_configuration():
    global ACCOUNT
    if not CONFIG.is_file():
        raise RuntimeError('Configure your own account first: python3 aws/cloudshell-deploy.py configure --account-id YOUR_12_DIGIT_ACCOUNT_ID')
    config = json.loads(CONFIG.read_text())
    if not re.fullmatch(r'[0-9]{12}', str(config.get('accountId', ''))):
        raise RuntimeError('Invalid account ID in aws/deployment-config.json.')
    if config.get('region') != REGION:
        raise RuntimeError('This lesson kit supports Stockholm (eu-north-1). Use matching templates for another region.')
    ACCOUNT = config['accountId']


def configure(args):
    global ACCOUNT
    if not re.fullmatch(r'[0-9]{12}', args.account_id):
        raise RuntimeError('Supply your own 12-digit AWS account ID; do not use the instructor account.')
    caller = aws('sts', 'get-caller-identity')
    if caller.get('Account') != args.account_id:
        raise RuntimeError('The supplied account does not match your CloudShell session. Configuration was not changed.')
    existing = json.loads(CONFIG.read_text()) if CONFIG.exists() else None
    has_state = STATE.exists() and any(STATE.iterdir())
    if has_state and (existing is None or existing.get('accountId') != args.account_id or existing.get('region') != REGION):
        raise RuntimeError('Existing deployment state must keep its original account configuration. Nothing was changed.')
    config = {'accountId': args.account_id, 'region': REGION}
    descriptor = os.open(CONFIG, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(descriptor, 'w') as handle:
        json.dump(config, handle, indent=2); handle.write('\n')
    CONFIG.chmod(0o600)
    ACCOUNT = args.account_id
    return {**config, 'configurationFile': 'aws/deployment-config.json', 'awsResourcesCreated': False}


class AwsError(RuntimeError):
    def __init__(self, service, action, error):
        self.error = error
        super().__init__(f'AWS {service} {action} failed. {error}')


def aws(service, action, *arguments):
    # Pass an argv vector; never evaluate shell text or print sensitive arguments.
    env = {**os.environ, 'AWS_PAGER': '', 'AWS_CLI_AUTO_PROMPT': 'off'}
    result = subprocess.run(['aws', service, action, *map(str, arguments),
                             '--region', REGION, '--output', 'json', '--no-cli-pager'],
                            env=env, capture_output=True, text=True)
    if result.returncode:
        # CLI exceptions can repeat request parameters. Redact known private values.
        error = result.stderr.strip()
        private = read_state('recording-access.json', {})
        for key in ['password', 'originToken']:
            if private.get(key): error = error.replace(private[key], '[withheld]')
        raise AwsError(service, action, error)
    return json.loads(result.stdout) if result.stdout.strip() else {}


def read_state(name, default=None):
    path = STATE / name
    return json.loads(path.read_text()) if path.exists() else default


def save(name, data):
    STATE.mkdir(exist_ok=True, mode=0o700 if os.name != 'nt' else 0o777)
    path = STATE / name
    # Private by construction, including on the first write.
    descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(descriptor, 'w') as handle:
        json.dump(data, handle, indent=2)
        handle.write('\n')
    path.chmod(0o600)


def identity():
    if ACCOUNT is None:
        load_configuration()
    result = aws('sts', 'get-caller-identity')
    if result.get('Account') != ACCOUNT:
        raise RuntimeError('Wrong AWS account. No resource changes were made.')
    return {k: result[k] for k in ['Account', 'Arn']}


def get_stack(name):
    if name not in {BUILD_STACK, APP_STACK}: raise RuntimeError('Unexpected stack name.')
    try:
        result = aws('cloudformation', 'describe-stacks', '--stack-name', name)['Stacks'][0]
    except AwsError as error:
        if 'ValidationError' in error.error and 'does not exist' in error.error: return None
        raise
    tags = {tag['Key']: tag['Value'] for tag in result.get('Tags', [])}
    if tags.get('purpose') != PURPOSE:
        raise RuntimeError(f'Refusing unrelated stack {name}: missing purpose tag.')
    return result


def outputs(stack):
    return {row['OutputKey']: row['OutputValue'] for row in stack.get('Outputs', [])}


def create_stack(name, template, parameters=None):
    if get_stack(name):
        raise RuntimeError('Stack already exists. Run status; do not create or overwrite it again.')
    args = ['--stack-name', name, '--template-body', 'file://' + str(ROOT / 'aws' / template),
            '--capabilities', 'CAPABILITY_IAM', '--tags', 'Key=purpose,Value=' + PURPOSE]
    if parameters:
        path = STATE / 'private-parameters.json'
        save(path.name, [{'ParameterKey': k, 'ParameterValue': v} for k, v in parameters.items()])
        args += ['--parameters', 'file://' + str(path)]
    try:
        return aws('cloudformation', 'create-stack', *args)
    finally:
        if parameters: path.unlink(missing_ok=True)


def network():
    vpcs = aws('ec2', 'describe-vpcs', '--filters', 'Name=is-default,Values=true')['Vpcs']
    if len(vpcs) != 1: raise RuntimeError('Expected one default VPC. Review networking before proceeding.')
    vpc = vpcs[0]['VpcId']
    subnets = aws('ec2', 'describe-subnets', '--filters', 'Name=vpc-id,Values=' + vpc,
                  'Name=default-for-az,Values=true')['Subnets']
    candidates = sorted((s for s in subnets if s['State'] == 'available' and s['AvailableIpAddressCount'] >= 16),
                        key=lambda s: s['AvailabilityZone'])
    selected = []
    zones = set()
    for subnet in candidates:
        if subnet['AvailabilityZone'] not in zones:
            selected.append(subnet); zones.add(subnet['AvailabilityZone'])
    if len(selected) < 2: raise RuntimeError('Need at least two available default subnets in different zones.')
    tables = aws('ec2', 'describe-route-tables', '--filters', 'Name=vpc-id,Values=' + vpc)['RouteTables']
    for subnet in selected:
        explicit = [t for t in tables if any(a.get('SubnetId') == subnet['SubnetId'] for a in t['Associations'])]
        matches = explicit or [t for t in tables if any(a.get('Main') for a in t['Associations'])]
        if len(matches) != 1 or not any(route.get('DestinationCidrBlock') == '0.0.0.0/0'
                and route.get('GatewayId', '').startswith('igw-') and route.get('State') == 'active'
                for route in matches[0]['Routes']):
            raise RuntimeError('A selected subnet lacks an active internet-gateway route. No network was modified.')
    prefixes = aws('ec2', 'describe-managed-prefix-lists', '--filters',
                   'Name=prefix-list-name,Values=com.amazonaws.global.cloudfront.origin-facing')['PrefixLists']
    if len(prefixes) != 1: raise RuntimeError('CloudFront origin prefix list unavailable in selected region.')
    return {'vpcId': vpc, 'subnetIds': [s['SubnetId'] for s in selected],
            'zones': sorted(zones), 'cloudFrontPrefixListId': prefixes[0]['PrefixListId']}


def preflight():
    caller = identity()
    net = network()
    quota = aws('service-quotas', 'get-service-quota', '--service-code', 'fargate',
                '--quota-code', 'L-3032A538')['Quota']['Value']
    if quota < 1: raise RuntimeError('Fargate On-Demand vCPU quota must allow at least 1 vCPU.')
    for template in ['build.template.json', 'app.template.json']:
        aws('cloudformation', 'validate-template', '--template-body', 'file://' + str(ROOT / 'aws' / template))
    result = {'checkedAt': now(), 'identity': caller, 'region': REGION, 'network': net,
              'fargateOnDemandVcpuQuota': quota, 'templateValidation': 'passed',
              'creationPermissionsVerified': False}
    save('preflight.json', result)
    return result


def budget(value):
    if not math.isfinite(value) or value <= 0: raise RuntimeError('Provide the agreed positive budget estimate.')
    return {'estimatedBudgetEuros': value, 'isHardSpendingCap': False, 'recordedAt': now()}


def digest_file(path):
    digest = hashlib.sha256()
    with path.open('rb') as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b''): digest.update(chunk)
    return digest.hexdigest()


def build(args):
    approved = budget(args.approved_budget_eur)
    path = Path(args.source_zip).expanduser().resolve()
    if not path.is_file(): raise RuntimeError('Source ZIP not found.')
    sha = digest_file(path)
    state = read_state('build.json', {})
    if state.get('buildId'):
        raise RuntimeError('A build was already started. Run status; no additional build was created.')
    preflight()
    save('budget.json', approved)
    stack = get_stack(BUILD_STACK)
    if stack is None:
        created = create_stack(BUILD_STACK, 'build.template.json')
        return {'buildStack': created['StackId'], 'next': 'Run status until CREATE_COMPLETE, then repeat this build command to upload and start the image build.'}
    if stack['StackStatus'] not in SUCCESS:
        raise RuntimeError('Build stack is not ready. Run status and inspect failures before proceeding.')
    out = outputs(stack)
    source_key = 'source/' + sha + '.zip'
    aws('s3api', 'put-object', '--bucket', out['SourceBucket'], '--key', source_key,
        '--body', path, '--server-side-encryption', 'AES256')
    state = {'sourceSha256': sha, 'imageTag': 'source-' + sha, 'sourceKey': source_key, 'startedAt': now(),
             **out}
    save('build.json', state)
    result = aws('codebuild', 'start-build', '--project-name', out['BuildProject'],
        '--source-location-override', out['SourceBucket'] + '/' + source_key,
        '--environment-variables-override',
        json.dumps([{'name': 'IMAGE_TAG', 'value': state['imageTag'], 'type': 'PLAINTEXT'},
                    {'name': 'SOURCE_SHA256', 'value': sha, 'type': 'PLAINTEXT'}]),
        '--idempotency-token', sha[:64])['build']
    state['buildId'] = result['id']; save('build.json', state)
    return {'buildId': state['buildId'], 'next': 'Run status to poll. Do not repeat build.'}


def deploy(args):
    approved = budget(args.approved_budget_eur)
    identity()
    if get_stack(APP_STACK): raise RuntimeError('App stack already exists. Run status; no duplicate deployment created.')
    state = read_state('build.json', {})
    if not state.get('buildId'): raise RuntimeError('Start and complete the image build first.')
    build_stack = get_stack(BUILD_STACK)
    if not build_stack or build_stack['StackStatus'] not in SUCCESS:
        raise RuntimeError('The matching build stack must be ready.')
    current = outputs(build_stack)
    if any(current.get(key) != state.get(key) for key in ['RepositoryArn', 'RepositoryUri', 'SourceBucket', 'BuildProject']):
        raise RuntimeError('Saved build does not match the current dedicated stack.')
    result = aws('codebuild', 'batch-get-builds', '--ids', state['buildId'])['builds']
    if len(result) != 1 or result[0]['buildStatus'] != 'SUCCEEDED':
        raise RuntimeError('The recorded CodeBuild build has not succeeded. Run status.')
    image = aws('ecr', 'describe-images', '--repository-name', state['RepositoryName'],
                '--image-ids', 'imageTag=' + state['imageTag'])['imageDetails'][0]
    image_uri = state['RepositoryUri'] + '@' + image['imageDigest']
    net = network()
    access = read_state('recording-access.json')
    if access is None:
        access = {'username': 'instructor', 'password': secrets.token_urlsafe(32), 'originToken': secrets.token_hex(32)}
        save('recording-access.json', access)
    credential_digest = hashlib.sha256((access['username'] + ':' + access['password']).encode()).hexdigest()
    created = create_stack(APP_STACK, 'app.template.json', {
        'VpcId': net['vpcId'], 'SubnetIds': ','.join(net['subnetIds']),
        'CloudFrontPrefixListId': net['cloudFrontPrefixListId'], 'ImageUri': image_uri,
        'RepositoryArn': state['RepositoryArn'], 'CredentialDigest': credential_digest,
        'OriginToken': access['originToken'],
    })
    save('deployment.json', {'stackId': created['StackId'], 'image': image_uri,
         'sourceSha256': state['sourceSha256'], 'requestedAt': now(), 'region': REGION,
         'serverStorage': 'ephemeral', 'providerCallsEnabled': False, **approved})
    return {'appStack': created['StackId'], 'next': 'Run status until CREATE_COMPLETE, then access privately.'}


def status():
    caller = identity()
    report = {'recordedAt': now(), 'identity': caller, 'region': REGION, 'stacks': {},
              'browserVerificationComplete': False, 'serverStorage': 'ephemeral'}
    for name in [BUILD_STACK, APP_STACK]:
        stack = get_stack(name)
        report['stacks'][name] = {'status': stack['StackStatus'] if stack else 'ABSENT'}
        if stack:
            report['stacks'][name]['outputs'] = outputs(stack)
            if 'FAILED' in stack['StackStatus'] or 'ROLLBACK' in stack['StackStatus']:
                events = aws('cloudformation', 'describe-stack-events', '--stack-name', name)['StackEvents']
                # Reasons may repeat sensitive parameters; report identifiers/status only.
                report['stacks'][name]['failedResources'] = [
                    {k: e[k] for k in ['LogicalResourceId', 'ResourceType', 'ResourceStatus']}
                    for e in events if 'FAILED' in e['ResourceStatus']][:10]
    state = read_state('build.json', {})
    if state.get('buildId') and report['stacks'][BUILD_STACK]['status'] != 'ABSENT':
        rows = aws('codebuild', 'batch-get-builds', '--ids', state['buildId'])['builds']
        if rows:
            b = rows[0]
            report['imageBuild'] = {k: b[k] for k in ['id', 'buildStatus', 'currentPhase']}
            report['imageBuild']['sourceSha256'] = state['sourceSha256']
            report['imageBuild']['logs'] = {k: b.get('logs', {}).get(k) for k in ['groupName', 'streamName', 'deepLink']}
    app = report['stacks'][APP_STACK]
    if app['status'] in SUCCESS:
        out = app['outputs']
        result = aws('ecs', 'describe-services', '--cluster', out['ClusterArn'], '--services', out['ServiceName'])
        if result.get('failures') or len(result.get('services', [])) != 1: raise RuntimeError('App service lookup failed.')
        service = result['services'][0]
        report['service'] = {k: service[k] for k in ['status', 'desiredCount', 'runningCount', 'pendingCount', 'taskDefinition']}
        report['targets'] = [{'state': row['TargetHealth']['State']} for row in
            aws('elbv2', 'describe-target-health', '--target-group-arn', out['TargetGroupArn'])['TargetHealthDescriptions']]
        report['cloudProvisioningComplete'] = (service['runningCount'] == 1 and service['pendingCount'] == 0
            and bool(report['targets']) and all(t['state'] == 'healthy' for t in report['targets']))
        access = read_state('recording-access.json')
        if access:
            access['origin'] = out['Origin']; save('recording-access.json', access)
    save('evidence.json', report)
    return report


def show_access():
    identity()
    app = get_stack(APP_STACK)
    if not app or app['StackStatus'] not in SUCCESS: raise RuntimeError('App stack is not ready.')
    access = read_state('recording-access.json')
    if not access: raise RuntimeError('Private local recording access file missing. Do not create a second password.')
    access['origin'] = outputs(app)['Origin']; save('recording-access.json', access)
    # Origin header is never displayed, even in this intentionally private view.
    return {k: access[k] for k in ['origin', 'username', 'password']}


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def verify():
    report = status()
    if not report.get('cloudProvisioningComplete'):
        raise RuntimeError('Wait until ECS and the load-balancer targets are healthy.')
    access = read_state('recording-access.json')
    origin = report['stacks'][APP_STACK]['outputs']['Origin']
    parsed = urlsplit(origin)
    if parsed.scheme != 'https' or not parsed.hostname or not parsed.hostname.endswith('.cloudfront.net'):
        raise RuntimeError('Unexpected recording HTTPS hostname.')
    if not access or access.get('origin') != origin:
        raise RuntimeError('Private access file does not match the deployed origin.')
    opener = build_opener(NoRedirect())
    def request(path, authorized=False, extra_headers=None):
        headers = extra_headers or {}
        if authorized:
            token = base64.b64encode((access['username'] + ':' + access['password']).encode()).decode()
            headers = {**headers, 'Authorization': 'Basic ' + token}
        try:
            with opener.open(Request(origin + path, headers=headers), timeout=30) as response:
                return response.status, response.read(4 * 1024 * 1024)
        except HTTPError as error:
            return error.code, b''
    checks = []
    for name, path, auth, headers, expected in [
        ('anonymous-app-denied', '/', False, None, 401),
        ('health-ready', '/api/health', False, None, 200),
        ('authenticated-home', '/', True, None, 200),
        ('foreign-origin-denied', '/api/ai-tutor/status', True, {'Origin': 'https://foreign.example'}, 403),
        ('tutor-status', '/api/ai-tutor/status', True, None, 200),
    ]:
        code, body = request(path, auth, headers)
        if code != expected: raise RuntimeError(f'HTTP verification failed: {name}; expected {expected}, received {code}.')
        if name == 'health-ready' and json.loads(body).get('readiness') != 'ready':
            raise RuntimeError('Backend readiness check failed.')
        if name == 'tutor-status' and json.loads(body).get('liveAvailable') is not False:
            raise RuntimeError('Live tutor must remain disabled for this recording.')
        checks.append({'check': name, 'status': 'passed', 'httpStatus': code})
    report['httpVerification'] = {'checkedAt': now(), 'checks': checks, 'complete': True}
    # Browser workflows are a separate recording step, never inferred from HTTP checks.
    save('evidence.json', report)
    return report


def cleanup(args):
    if args.confirm_delete_account != ACCOUNT or not args.video_verified:
        raise RuntimeError('Cleanup requires the exact account and --lesson-complete (or --video-verified).')
    identity()
    app = get_stack(APP_STACK)
    if app:
        if app['StackStatus'] == 'DELETE_IN_PROGRESS': return {'next': 'Wait for app deletion; poll status.'}
        aws('cloudformation', 'delete-stack', '--stack-name', APP_STACK)
        return {'requested': 'App stack deletion, including service, load balancer and CloudFront.',
                'next': 'Poll status until app is ABSENT; repeat cleanup to remove build resources.'}
    stack = get_stack(BUILD_STACK)
    if not stack: return {'dedicatedStacks': 'ABSENT', 'existingVpcAndSubnets': 'preserved'}
    if stack['StackStatus'] == 'DELETE_IN_PROGRESS': return {'next': 'Wait for build stack deletion; poll status.'}
    out = outputs(stack)
    if 'SourceBucket' in out:
        bucket = out['SourceBucket']
        tags = aws('s3api', 'get-bucket-tagging', '--bucket', bucket)['TagSet']
        if not any(t['Key'] == 'purpose' and t['Value'] == PURPOSE for t in tags):
            raise RuntimeError('Source bucket purpose mismatch. Nothing deleted.')
        objects = aws('s3api', 'list-objects-v2', '--bucket', bucket).get('Contents', [])
        if any(not obj['Key'].startswith('source/') for obj in objects):
            raise RuntimeError('Unexpected objects in source bucket. Review before deleting.')
        for start in range(0, len(objects), 1000):
            result = aws('s3api', 'delete-objects', '--bucket', bucket, '--delete',
                json.dumps({'Objects': [{'Key': obj['Key']} for obj in objects[start:start+1000]], 'Quiet': True}))
            if result.get('Errors'): raise RuntimeError('Some source objects were not deleted. Review bucket permissions.')
    aws('cloudformation', 'delete-stack', '--stack-name', BUILD_STACK)
    return {'requested': 'Dedicated build stack deletion, including private ECR images, source bucket and build logs.',
            'next': 'Poll status until both stacks are ABSENT.'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='command', required=True)
    cmd = commands.add_parser('configure', help='Pin this deployment to your own signed-in AWS account.')
    cmd.add_argument('--account-id', required=True)
    for name in ['preflight', 'status', 'access', 'verify']: commands.add_parser(name)
    for name in ['build', 'deploy']:
        cmd = commands.add_parser(name)
        cmd.add_argument('--approved-budget-eur', required=True, type=float)
        if name == 'build': cmd.add_argument('--source-zip', required=True)
    cmd = commands.add_parser('cleanup')
    cmd.add_argument('--confirm-delete-account', required=True)
    cmd.add_argument('--video-verified', '--lesson-complete', dest='video_verified', action='store_true')
    args = parser.parse_args()
    try:
        if args.command == 'configure':
            print(json.dumps(configure(args), indent=2))
            return
        load_configuration()
        result = {'preflight': preflight, 'status': status, 'access': show_access, 'verify': verify}.get(args.command)
        if result: result = result()
        else: result = {'build': build, 'deploy': deploy, 'cleanup': cleanup}[args.command](args)
        print(json.dumps(result, indent=2))
    except (RuntimeError, OSError, KeyError, ValueError) as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__': main()
