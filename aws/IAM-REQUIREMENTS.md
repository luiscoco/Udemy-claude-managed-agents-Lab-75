# Permissions and account prerequisites

Ask your account administrator for a suitable approved training role or
permission set. Organization policies, permission boundaries, region restrictions
and quotas can still prevent provisioning. Do not use instructor credentials or
grant AdministratorAccess simply to bypass an error.

The CloudShell identity needs permission for the helper's API calls and the
resources CloudFormation creates/deletes. The templates are the authoritative
inventory. This checklist is not a drop-in least-privilege IAM policy.

## Operator permission areas

- STS: get caller identity.
- EC2/VPC: describe VPCs, subnets, route tables and managed prefix lists; manage
  the dedicated security groups/rules and their tags. Existing networking is not changed.
- Service Quotas: read the Fargate On-Demand vCPU quota.
- CloudFormation: validate, create, describe and delete the two stacks, inspect
  events and manage their purpose tags.
- S3: create/configure/tag/delete the dedicated bucket/policy, encryption,
  ownership and public-access block; upload/list/delete lesson source objects.
- ECR: create/read/tag/delete the repository and its images; describe image digests.
- CodeBuild: manage the dedicated project, start the build and read its status.
- CloudWatch Logs: manage the dedicated log groups/retention and read diagnostic logs.
- IAM: create/read/tag/delete service roles and inline policies; pass only the
  appropriate CodeBuild and ECS roles to those services. First use can require
  ECS or Elastic Load Balancing service-linked role creation.
- ECS: manage the dedicated cluster, task definition, service and deployment settings.
- Elastic Load Balancing v2: manage the ALB, target group, listener, rule,
  attributes/tags and inspect target health.
- CloudFront: create/read/update/tag/disable/delete the dedicated distribution.

CloudFront is global. A region-only organization policy may need a reviewed
exception. CAPABILITY_IAM acknowledges role creation; it grants no missing permissions.

## Created service roles

CodeBuild reads only the source bucket's source prefix, writes its build logs,
and publishes to the dedicated repository. The execution role pulls this ECR
image and writes application logs. ECR authorization-token retrieval requires
its separate account-level action. The application task role has no AWS access
policies. No AWS access key or provider API key belongs in the image.

## Network and quota prerequisites

Use eu-north-1 with an existing default VPC, usable default subnets in at least
two zones, active internet-gateway routes and quota for the one-vCPU task. Other
workloads can consume that quota. A sandbox that blocks IAM roles, CodeBuild,
CloudFront or public ALBs cannot run this exact architecture unchanged. Ask its
owner rather than removing access protections.
