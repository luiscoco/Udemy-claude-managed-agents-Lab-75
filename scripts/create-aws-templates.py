"""Generate the reviewable CloudFormation templates used by CloudShell."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'aws'
def ref(name): return {'Ref': name}
def att(name, key): return {'Fn::GetAtt': [name, key]}
def sub(value): return {'Fn::Sub': value}
def resource(kind, **props): return {'Type': 'AWS::' + kind, 'Properties': props}
def statement(actions, resources):
    return {'Effect': 'Allow', 'Action': actions, 'Resource': resources}
def policy(statements): return {'Version': '2012-10-17', 'Statement': statements}
def trust(service):
    return policy([{'Effect': 'Allow', 'Principal': {'Service': service}, 'Action': 'sts:AssumeRole'}])
def param(kind='String', **props): return {'Type': kind, **props}
def output(value): return {'Value': value}
TAGS = [{'Key': 'purpose', 'Value': 'claude-learning-aws-video'}]

buildspec = '''version: 0.2
phases:
  pre_build:
    commands:
      - python3 aws/verify-source.py
      - aws ecr get-login-password --region "$AWS_DEFAULT_REGION" | docker login --username AWS --password-stdin "${REPOSITORY_URI%%/*}"
  build:
    commands:
      - docker build --label "org.opencontainers.image.revision=$SOURCE_SHA256" -t "$REPOSITORY_URI:$IMAGE_TAG" .
  post_build:
    commands:
      - test "$CODEBUILD_BUILD_SUCCEEDING" = 1
      - docker push "$REPOSITORY_URI:$IMAGE_TAG"
'''
build = {
    'AWSTemplateFormatVersion': '2010-09-09',
    'Description': 'Dedicated private source, ECR and cloud image build for the AWS course recording.',
    'Resources': {
        'SourceBucket': resource('S3::Bucket',
            BucketEncryption={'ServerSideEncryptionConfiguration': [{'ServerSideEncryptionByDefault': {'SSEAlgorithm': 'AES256'}}]},
            PublicAccessBlockConfiguration={k: True for k in ['BlockPublicAcls', 'BlockPublicPolicy', 'IgnorePublicAcls', 'RestrictPublicBuckets']},
            OwnershipControls={'Rules': [{'ObjectOwnership': 'BucketOwnerEnforced'}]}, Tags=TAGS),
        'SourceBucketPolicy': resource('S3::BucketPolicy', Bucket=ref('SourceBucket'),
            PolicyDocument=policy([{'Effect': 'Deny', 'Principal': '*', 'Action': 's3:*',
                'Resource': [att('SourceBucket', 'Arn'), sub('${SourceBucket.Arn}/*')],
                'Condition': {'Bool': {'aws:SecureTransport': 'false'}}}])),
        'Repository': resource('ECR::Repository', ImageTagMutability='IMMUTABLE',
            EmptyOnDelete=True, EncryptionConfiguration={'EncryptionType': 'AES256'}, Tags=TAGS),
        'BuildLogs': resource('Logs::LogGroup', RetentionInDays=3, Tags=TAGS),
        'BuildRole': resource('IAM::Role', AssumeRolePolicyDocument=trust('codebuild.amazonaws.com'),
            Policies=[{'PolicyName': 'reviewed-source-and-one-registry', 'PolicyDocument': policy([
                statement(['s3:GetObject', 's3:GetObjectVersion'], [sub('${SourceBucket.Arn}/source/*')]),
                statement(['s3:GetBucketLocation'], [att('SourceBucket', 'Arn')]),
                statement(['ecr:GetAuthorizationToken'], '*'),
                statement(['ecr:BatchCheckLayerAvailability', 'ecr:GetDownloadUrlForLayer', 'ecr:BatchGetImage',
                    'ecr:InitiateLayerUpload', 'ecr:UploadLayerPart', 'ecr:CompleteLayerUpload', 'ecr:PutImage'], [att('Repository', 'Arn')]),
                statement(['logs:CreateLogStream', 'logs:PutLogEvents'], [att('BuildLogs', 'Arn')]),
            ])}], Tags=TAGS),
        'ImageBuild': resource('CodeBuild::Project', ServiceRole=att('BuildRole', 'Arn'),
            Artifacts={'Type': 'NO_ARTIFACTS'},
            Source={'Type': 'S3', 'Location': sub('${SourceBucket}/source/pending.zip'), 'BuildSpec': buildspec},
            Environment={'Type': 'LINUX_CONTAINER', 'ComputeType': 'BUILD_GENERAL1_SMALL',
                'Image': 'aws/codebuild/standard:7.0', 'PrivilegedMode': True,
                'EnvironmentVariables': [{'Name': 'REPOSITORY_URI', 'Value': att('Repository', 'RepositoryUri')}]},
            TimeoutInMinutes=30, QueuedTimeoutInMinutes=15, ConcurrentBuildLimit=1,
            LogsConfig={'CloudWatchLogs': {'Status': 'ENABLED', 'GroupName': ref('BuildLogs'), 'StreamName': 'image'}}, Tags=TAGS),
    },
    'Outputs': {
        'SourceBucket': output(ref('SourceBucket')), 'RepositoryUri': output(att('Repository', 'RepositoryUri')),
        'RepositoryArn': output(att('Repository', 'Arn')), 'RepositoryName': output(ref('Repository')),
        'BuildProject': output(ref('ImageBuild')), 'BuildLogGroup': output(ref('BuildLogs')),
    },
}
app = {
    'AWSTemplateFormatVersion': '2010-09-09',
    'Description': 'Temporary protected HTTPS course recording: CloudFront, ALB, one ECS Fargate task. Ephemeral data, no provider keys.',
    'Parameters': {
        'VpcId': param('AWS::EC2::VPC::Id'),
        'SubnetIds': param('List<AWS::EC2::Subnet::Id>'),
        'CloudFrontPrefixListId': param(AllowedPattern='pl-[a-f0-9]+'),
        'ImageUri': param(AllowedPattern=r'[0-9]{12}\.dkr\.ecr\.eu-north-1\.amazonaws\.com/[^\s]+@sha256:[a-f0-9]{64}'),
        'RepositoryArn': param(AllowedPattern=r'arn:aws:ecr:eu-north-1:[0-9]{12}:repository/.+'),
        'CredentialDigest': param(NoEcho=True, AllowedPattern='[a-f0-9]{64}'),
        'OriginToken': param(NoEcho=True, AllowedPattern='[a-f0-9]{64}'),
    },
    'Resources': {},
}
r = app['Resources']
r['Cluster'] = resource('ECS::Cluster', ClusterSettings=[{'Name': 'containerInsights', 'Value': 'disabled'}], Tags=TAGS)
r['AppLogs'] = resource('Logs::LogGroup', RetentionInDays=3, Tags=TAGS)
r['LoadBalancerSecurityGroup'] = resource('EC2::SecurityGroup', GroupDescription='Only CloudFront origin-facing addresses reach the recording load balancer',
    VpcId=ref('VpcId'), SecurityGroupIngress=[{'IpProtocol': 'tcp', 'FromPort': 80, 'ToPort': 80,
        'SourcePrefixListId': ref('CloudFrontPrefixListId')}], Tags=TAGS)
r['TaskSecurityGroup'] = resource('EC2::SecurityGroup', GroupDescription='Only the recording load balancer reaches the app port',
    VpcId=ref('VpcId'), SecurityGroupIngress=[{'IpProtocol': 'tcp', 'FromPort': 8080, 'ToPort': 8080,
        'SourceSecurityGroupId': ref('LoadBalancerSecurityGroup')}], Tags=TAGS)
r['LoadBalancer'] = resource('ElasticLoadBalancingV2::LoadBalancer', Scheme='internet-facing', Type='application',
    Subnets=ref('SubnetIds'), SecurityGroups=[ref('LoadBalancerSecurityGroup')],
    LoadBalancerAttributes=[{'Key': 'idle_timeout.timeout_seconds', 'Value': '120'}], Tags=TAGS)
r['TargetGroup'] = resource('ElasticLoadBalancingV2::TargetGroup', VpcId=ref('VpcId'), TargetType='ip',
    Protocol='HTTP', Port=8080, HealthCheckPath='/api/health', HealthCheckIntervalSeconds=15,
    HealthyThresholdCount=2, Matcher={'HttpCode': '200'},
    TargetGroupAttributes=[{'Key': 'deregistration_delay.timeout_seconds', 'Value': '15'}], Tags=TAGS)
r['Listener'] = resource('ElasticLoadBalancingV2::Listener', LoadBalancerArn=ref('LoadBalancer'), Port=80, Protocol='HTTP',
    DefaultActions=[{'Type': 'fixed-response', 'FixedResponseConfig': {'StatusCode': '403', 'ContentType': 'text/plain', 'MessageBody': 'Use the recording HTTPS address.'}}])
r['OriginRule'] = resource('ElasticLoadBalancingV2::ListenerRule', ListenerArn=ref('Listener'), Priority=1,
    Conditions=[{'Field': 'http-header', 'HttpHeaderConfig': {'HttpHeaderName': 'X-Learning-Origin', 'Values': [ref('OriginToken')]}}],
    Actions=[{'Type': 'forward', 'TargetGroupArn': ref('TargetGroup')}])
r['Distribution'] = resource('CloudFront::Distribution', DistributionConfig={
    'Enabled': True, 'Comment': 'Temporary Claude learning AWS recording', 'HttpVersion': 'http2', 'IPV6Enabled': True,
    'PriceClass': 'PriceClass_100',
    'Origins': [{'Id': 'recording-alb', 'DomainName': att('LoadBalancer', 'DNSName'),
        'OriginCustomHeaders': [{'HeaderName': 'X-Learning-Origin', 'HeaderValue': ref('OriginToken')}],
        'CustomOriginConfig': {'HTTPPort': 80, 'OriginProtocolPolicy': 'http-only', 'OriginReadTimeout': 60}}],
    'DefaultCacheBehavior': {'TargetOriginId': 'recording-alb', 'ViewerProtocolPolicy': 'redirect-to-https',
        'AllowedMethods': ['GET', 'HEAD', 'OPTIONS', 'PUT', 'POST', 'PATCH', 'DELETE'], 'CachedMethods': ['GET', 'HEAD'],
        'CachePolicyId': '4135ea2d-6df8-44a3-9df3-4b5a84be39ad',
        'OriginRequestPolicyId': 'b689b0a8-53d0-40ab-baf2-68738e2966ac', 'Compress': True},
    'ViewerCertificate': {'CloudFrontDefaultCertificate': True},
    'CustomErrorResponses': [{'ErrorCode': code, 'ErrorCachingMinTTL': 0} for code in [403, 404, 500, 502, 503, 504]],
}, Tags=TAGS)
r['TaskRole'] = resource('IAM::Role', AssumeRolePolicyDocument=trust('ecs-tasks.amazonaws.com'), Tags=TAGS)
r['ExecutionRole'] = resource('IAM::Role', AssumeRolePolicyDocument=trust('ecs-tasks.amazonaws.com'), Tags=TAGS,
    Policies=[{'PolicyName': 'pull-one-image-and-write-app-logs', 'PolicyDocument': policy([
        statement(['ecr:GetAuthorizationToken'], '*'),
        statement(['ecr:BatchCheckLayerAvailability', 'ecr:GetDownloadUrlForLayer', 'ecr:BatchGetImage'], [ref('RepositoryArn')]),
        statement(['logs:CreateLogStream', 'logs:PutLogEvents'], [att('AppLogs', 'Arn')]),
    ])}])
env = {'LEARNING_RECORDING_GATEWAY': 'true', 'LEARNING_ACCESS_SHA256': ref('CredentialDigest'),
    'LEARNING_PUBLIC_ORIGIN': sub('https://${Distribution.DomainName}'),
    'ANTHROPIC_API_KEY': '', 'AI_TUTOR_LIVE_ENABLED': 'false', 'MANAGED_LIVE_ENABLED': 'false',
    'MILESTONE_LIVE_ENABLED': 'false', 'INWORLD_NARRATION_ENABLED': '0'}
r['TaskDefinition'] = resource('ECS::TaskDefinition', RequiresCompatibilities=['FARGATE'], NetworkMode='awsvpc',
    Cpu='1024', Memory='2048', RuntimePlatform={'CpuArchitecture': 'X86_64', 'OperatingSystemFamily': 'LINUX'},
    ExecutionRoleArn=att('ExecutionRole', 'Arn'), TaskRoleArn=att('TaskRole', 'Arn'),
    ContainerDefinitions=[{'Name': 'platform', 'Image': ref('ImageUri'), 'Essential': True,
        'Command': ['node', 'azure/recording-gateway.mjs'], 'User': 'node',
        'PortMappings': [{'ContainerPort': 8080, 'Protocol': 'tcp'}],
        'Environment': [{'Name': k, 'Value': v} for k, v in env.items()],
        'HealthCheck': {'Command': ['CMD-SHELL', 'node -e "fetch(\'http://127.0.0.1:8080/api/health\').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"'],
            'Interval': 15, 'Timeout': 5, 'Retries': 5, 'StartPeriod': 60},
        'LogConfiguration': {'LogDriver': 'awslogs', 'Options': {'awslogs-group': ref('AppLogs'),
            'awslogs-region': ref('AWS::Region'), 'awslogs-stream-prefix': 'platform'}}}], Tags=TAGS)
r['Service'] = resource('ECS::Service', Cluster=ref('Cluster'), TaskDefinition=ref('TaskDefinition'),
    DesiredCount=1, LaunchType='FARGATE', PlatformVersion='1.4.0', HealthCheckGracePeriodSeconds=180,
    DeploymentConfiguration={'DeploymentCircuitBreaker': {'Enable': True, 'Rollback': True}, 'MinimumHealthyPercent': 0, 'MaximumPercent': 100},
    NetworkConfiguration={'AwsvpcConfiguration': {'AssignPublicIp': 'ENABLED', 'Subnets': ref('SubnetIds'), 'SecurityGroups': [ref('TaskSecurityGroup')]}},
    LoadBalancers=[{'ContainerName': 'platform', 'ContainerPort': 8080, 'TargetGroupArn': ref('TargetGroup')}],
    EnableECSManagedTags=True, PropagateTags='SERVICE', Tags=TAGS)
r['Service']['DependsOn'] = ['OriginRule']
app['Outputs'] = {
    'Origin': output(sub('https://${Distribution.DomainName}')), 'ClusterArn': output(att('Cluster', 'Arn')),
    'ServiceName': output(att('Service', 'Name')), 'TargetGroupArn': output(ref('TargetGroup')),
    'DistributionId': output(ref('Distribution')), 'AppLogGroup': output(ref('AppLogs')),
}
if __name__ == '__main__':
    OUT.mkdir(exist_ok=True)
    for name, template in [('build', build), ('app', app)]:
        (OUT / (name + '.template.json')).write_text(json.dumps(template, indent=2) + '\n', encoding='utf-8')
        print('Wrote aws/' + name + '.template.json')
