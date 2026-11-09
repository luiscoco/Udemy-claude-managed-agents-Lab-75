"""Offline safety tests; never calls gcloud or creates cloud resources."""
import argparse
import importlib.util
import json
from pathlib import Path
import shutil
import unittest
from unittest.mock import patch
import uuid

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('gcp_deploy', ROOT / 'gcp/cloudshell-deploy.py')
deploy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(deploy)


class DeploymentSafety(unittest.TestCase):
    def setUp(self):
        self.work = ROOT / 'artifacts/gcp-deployment' / ('test-' + uuid.uuid4().hex)
        self.work.mkdir(parents=True)
        self.patches = [patch.object(deploy, 'STATE', self.work / 'state'),
                        patch.object(deploy, 'CONFIG', self.work / 'config.json'),
                        patch.object(deploy, 'PROJECT', 'example-course-project'),
                        patch.object(deploy, 'REGION', 'europe-west1')]
        for item in self.patches: item.start()

    def tearDown(self):
        for item in reversed(self.patches): item.stop()
        assert self.work.resolve().is_relative_to((ROOT / 'artifacts/gcp-deployment').resolve())
        shutil.rmtree(self.work)

    def test_mismatched_manifest_refused(self):
        deploy.private_json(deploy.CONFIG, {'projectId': deploy.PROJECT, 'region': deploy.REGION})
        deploy.save('manifest.json', {'projectId': 'other-project', 'region': deploy.REGION})
        with self.assertRaisesRegex(RuntimeError, 'must match'): deploy.load_config()

    def test_existing_state_cannot_switch_project(self):
        deploy.save('manifest.json', {'projectId': deploy.PROJECT})
        with self.assertRaisesRegex(RuntimeError, 'original project'):
            deploy.configure(argparse.Namespace(project_id='another-project', region=deploy.REGION))

    def test_permission_error_is_not_absence(self):
        with patch.object(deploy, 'gc', side_effect=deploy.GcloudError('PERMISSION_DENIED NOT_FOUND')):
            with self.assertRaises(deploy.GcloudError): deploy.maybe('describe')
        with patch.object(deploy, 'gc', side_effect=deploy.GcloudError('NOT_FOUND')):
            self.assertIsNone(deploy.maybe('describe'))

    def test_storage_bucket_missing_response_is_absence(self):
        message = 'ERROR: (gcloud.storage.buckets.describe) gs://example-course-project-cma-video-12345678 not found: 404.'
        with patch.object(deploy, 'gc', side_effect=deploy.GcloudError(message)):
            self.assertIsNone(deploy.maybe('storage', 'buckets', 'describe', 'gs://example-bucket'))
        with patch.object(deploy, 'gc', side_effect=deploy.GcloudError('PERMISSION_DENIED ' + message)):
            with self.assertRaises(deploy.GcloudError):
                deploy.maybe('storage', 'buckets', 'describe', 'gs://example-bucket')

    def test_cleanup_wrong_project_stops_before_cloud_calls(self):
        with patch.object(deploy, 'gc') as cloud:
            with self.assertRaises(RuntimeError):
                deploy.cleanup(argparse.Namespace(confirm_delete_project='other-project', video_verified=True))
            cloud.assert_not_called()

    def test_cloud_run_service_missing_response_is_absence(self):
        message = 'ERROR: (gcloud.run.services.describe) Cannot find service [example-service]'
        with patch.object(deploy, 'gc', side_effect=deploy.GcloudError(message)):
            self.assertIsNone(deploy.maybe('run', 'services', 'describe', 'example-service'))
        with patch.object(deploy, 'gc', side_effect=deploy.GcloudError('PERMISSION_DENIED ' + message)):
            with self.assertRaises(deploy.GcloudError):
                deploy.maybe('run', 'services', 'describe', 'example-service')

    def test_build_stages_source_in_dedicated_bucket(self):
        deploy.save('prepared.json', {'ok': True})
        deploy.save('budget.json', {'ok': True})
        source = self.work / 'source.zip'
        source.write_bytes(b'test archive for mocked submission')
        def cloud(*args, **kwargs):
            if args[:2] == ('builds', 'submit'):
                self.assertIn('--gcs-source-staging-dir=gs://' + deploy.names()['bucket'] + '/build-source', args)
                self.assertIn('--gcs-log-dir=gs://' + deploy.names()['bucket'] + '/build-logs', args)
                return {'id': 'test-build'}
            return {}
        with patch.object(deploy, 'project_info'), patch.object(deploy, 'resource_get', return_value={}), patch.object(deploy, 'gc', side_effect=cloud):
            result = deploy.build(argparse.Namespace(source_zip=str(source)))
        self.assertEqual(result['id'], 'test-build')
        self.assertEqual(deploy.read('build.json')['id'], 'test-build')

    def test_cleanup_checks_all_ownership_before_deletion(self):
        def cloud(*args, **kwargs):
            if args[:2] == ('projects', 'describe'):
                return {'projectId': deploy.PROJECT, 'lifecycleState': 'ACTIVE'}
            if 'describe' in args:
                if args[0] == 'artifacts': return {'labels': {'purpose': 'someone-else'}}
                return {'metadata': {'labels': deploy.labels()}}
            self.fail('Unexpected mutation: ' + str(args))
        with patch.object(deploy, 'gc', side_effect=cloud):
            with self.assertRaisesRegex(RuntimeError, 'unrelated resource'):
                deploy.cleanup(argparse.Namespace(confirm_delete_project=deploy.PROJECT, video_verified=True))

    def test_invalid_budget_cannot_create_state(self):
        for value in [float('nan'), float('inf'), -1, 0]:
            with self.assertRaises(RuntimeError): deploy.budget(value)
        self.assertIsNone(deploy.read('budget.json'))

    def test_duplicate_build_is_refused(self):
        deploy.save('prepared.json', {'ok': True})
        deploy.save('budget.json', {'ok': True})
        deploy.save('build.json', {'id': 'existing-build'})
        with patch.object(deploy, 'project_info'), patch.object(deploy, 'gc') as cloud:
            with self.assertRaisesRegex(RuntimeError, 'already started'):
                deploy.build(argparse.Namespace(source_zip='unused.zip'))
            cloud.assert_not_called()

    def test_unexpected_build_image_stops_deployment(self):
        deploy.save('build.json', {'imageTag': 'expected'})
        with patch.object(deploy, 'project_info'), patch.object(deploy, 'build_status', return_value={
            'status': 'SUCCESS', 'results': {'images': [{'name': 'different', 'digest': 'sha256:' + 'a' * 64}]}
        }), patch.object(deploy, 'gc') as cloud:
            with self.assertRaisesRegex(RuntimeError, 'expected image digest'):
                deploy.deploy(argparse.Namespace(approved_budget_eur=10))
            cloud.assert_not_called()


if __name__ == '__main__': unittest.main()
