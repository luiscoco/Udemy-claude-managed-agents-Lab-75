"""Offline safety checks for the CloudShell driver; never contact AWS."""
import argparse
import importlib.util
import json
from pathlib import Path
import shutil
import uuid
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('cloudshell', ROOT / 'aws/cloudshell-deploy.py')
driver = importlib.util.module_from_spec(spec)
spec.loader.exec_module(driver)


class DeploymentChecks(unittest.TestCase):
    def setUp(self):
        self.tmp = ROOT / 'artifacts/aws-deployment' / ('test-' + uuid.uuid4().hex)
        self.tmp.mkdir(parents=True)
        assert self.tmp.resolve().is_relative_to((ROOT / 'artifacts/aws-deployment').resolve())
        self.addCleanup(shutil.rmtree, self.tmp)
        self.state = patch.object(driver, 'STATE', self.tmp / 'state')
        self.state.start(); self.addCleanup(self.state.stop)
        self.config = patch.object(driver, 'CONFIG', self.tmp / 'deployment-config.json')
        self.config.start(); self.addCleanup(self.config.stop)
        self.account = patch.object(driver, 'ACCOUNT', '123456789012')
        self.account.start(); self.addCleanup(self.account.stop)

    def test_own_account_configuration_is_pinned_without_creating_resources(self):
        with patch.object(driver, 'aws', return_value={'Account': '123456789012'}) as aws:
            result = driver.configure(argparse.Namespace(account_id='123456789012'))
            self.assertFalse(result['awsResourcesCreated'])
            self.assertEqual(json.loads(driver.CONFIG.read_text())['accountId'], '123456789012')
            self.assertEqual([c.args[:2] for c in aws.call_args_list], [('sts', 'get-caller-identity')])

    def test_configure_rejects_an_account_other_than_the_cloudshell_session(self):
        with patch.object(driver, 'aws', return_value={'Account': '123456789012'}):
            with self.assertRaisesRegex(RuntimeError, 'does not match'):
                driver.configure(argparse.Namespace(account_id='111122223333'))
            self.assertFalse(driver.CONFIG.exists())

    def test_cannot_repoint_existing_state_to_another_account(self):
        driver.CONFIG.write_text(json.dumps({'accountId': '111122223333', 'region': driver.REGION}))
        driver.save('build.json', {'buildId': 'previous-account-build'})
        with patch.object(driver, 'aws', return_value={'Account': '123456789012'}):
            with self.assertRaisesRegex(RuntimeError, 'original account'):
                driver.configure(argparse.Namespace(account_id='123456789012'))
            self.assertEqual(json.loads(driver.CONFIG.read_text())['accountId'], '111122223333')

    def test_no_configuration_fails_before_aws_calls(self):
        with patch.object(driver, 'ACCOUNT', None), patch.object(driver, 'aws') as aws:
            with self.assertRaisesRegex(RuntimeError, 'Configure your own account'):
                driver.identity()
            aws.assert_not_called()

    def test_configuration_rejects_an_unsupported_region(self):
        driver.CONFIG.write_text(json.dumps({'accountId': '123456789012', 'region': 'us-east-1'}))
        with self.assertRaisesRegex(RuntimeError, 'Stockholm'):
            driver.load_configuration()

    def test_wrong_account_stops_before_destructive_calls(self):
        with patch.object(driver, 'aws', return_value={'Account': '000000000000'}) as aws:
            with self.assertRaisesRegex(RuntimeError, 'Wrong AWS account'):
                driver.cleanup(argparse.Namespace(confirm_delete_account=driver.ACCOUNT, video_verified=True))
            self.assertEqual([call.args[:2] for call in aws.call_args_list], [('sts', 'get-caller-identity')])

    def test_existing_unrelated_stack_is_never_reused(self):
        with patch.object(driver, 'aws', return_value={'Stacks': [{'Tags': [{'Key': 'purpose', 'Value': 'unrelated'}]}]}) as aws:
            with self.assertRaisesRegex(RuntimeError, 'unrelated stack'):
                driver.create_stack(driver.APP_STACK, 'app.template.json')
            self.assertEqual(aws.call_count, 1)

    def test_access_denied_is_not_mistaken_for_a_missing_stack(self):
        denied = driver.AwsError('cloudformation', 'describe-stacks', 'AccessDenied: not authorized')
        with patch.object(driver, 'aws', side_effect=denied):
            with self.assertRaises(driver.AwsError): driver.get_stack(driver.APP_STACK)

    def test_build_poll_cannot_accidentally_start_another_build(self):
        source = self.tmp / 'source.zip'; source.write_bytes(b'test source')
        driver.save('build.json', {'buildId': 'existing-build'})
        with patch.object(driver, 'aws') as aws:
            with self.assertRaisesRegex(RuntimeError, 'already started'):
                driver.build(argparse.Namespace(approved_budget_eur=15, source_zip=str(source)))
            aws.assert_not_called()

    def test_nonfinite_or_missing_budget_cannot_provision(self):
        with patch.object(driver, 'aws') as aws:
            for value in [float('nan'), float('inf'), -1, 0]:
                with self.assertRaises(RuntimeError): driver.budget(value)
            aws.assert_not_called()

    def test_cleanup_requires_account_and_video_confirmation(self):
        with patch.object(driver, 'aws') as aws:
            for account, verified in [(driver.ACCOUNT, False), ('wrong', True)]:
                with self.assertRaises(RuntimeError):
                    driver.cleanup(argparse.Namespace(confirm_delete_account=account, video_verified=verified))
            aws.assert_not_called()

    def test_cleanup_preserves_unexpected_source_bucket_objects(self):
        def fake(service, action, *args):
            if action == 'get-bucket-tagging': return {'TagSet': [{'Key': 'purpose', 'Value': driver.PURPOSE}]}
            if action == 'list-objects-v2': return {'Contents': [{'Key': 'unrelated-data.csv'}]}
            raise AssertionError('Unexpected mutation: ' + action)
        stacks = [None, {'StackStatus': 'CREATE_COMPLETE', 'Outputs': [{'OutputKey': 'SourceBucket', 'OutputValue': 'dedicated-bucket'}]}]
        with patch.object(driver, 'identity'), patch.object(driver, 'get_stack', side_effect=stacks), patch.object(driver, 'aws', side_effect=fake):
            with self.assertRaisesRegex(RuntimeError, 'Unexpected objects'):
                driver.cleanup(argparse.Namespace(confirm_delete_account=driver.ACCOUNT, video_verified=True))

    def test_private_values_are_redacted_from_cli_errors(self):
        driver.save('recording-access.json', {'password': 'private-test-password', 'originToken': 'private-test-header'})
        result = argparse.Namespace(returncode=1, stderr='failure private-test-password private-test-header')
        with patch.object(driver.subprocess, 'run', return_value=result):
            with self.assertRaises(driver.AwsError) as caught: driver.aws('cloudformation', 'create-stack')
            self.assertNotIn('private-test-password', str(caught.exception))
            self.assertNotIn('private-test-header', str(caught.exception))

    def test_missing_public_route_stops_deployment_without_changing_network(self):
        def fake(service, action, *args):
            if action == 'describe-vpcs': return {'Vpcs': [{'VpcId': 'vpc-test'}]}
            if action == 'describe-subnets': return {'Subnets': [
                {'SubnetId': 'subnet-a', 'AvailabilityZone': 'a', 'State': 'available', 'AvailableIpAddressCount': 100},
                {'SubnetId': 'subnet-b', 'AvailabilityZone': 'b', 'State': 'available', 'AvailableIpAddressCount': 100}]}
            if action == 'describe-route-tables': return {'RouteTables': [{'Associations': [{'Main': True}], 'Routes': []}]}
            raise AssertionError('Unexpected network call: ' + action)
        with patch.object(driver, 'aws', side_effect=fake):
            with self.assertRaisesRegex(RuntimeError, 'internet-gateway route'): driver.network()


if __name__ == '__main__': unittest.main(verbosity=2)
