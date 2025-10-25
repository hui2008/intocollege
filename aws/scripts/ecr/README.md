## Create ECR

- aws ecr create-repository --repository-name lms/moodle

- aws ecr put-lifecycle-policy --repository-name my-repo --lifecycle-policy-text file://lifecycle-policy.json

## Publish image

aws ecr get-login-password | docker login --username AWS --password-stdin 892797891149.dkr.ecr.ap-southeast-2.amazonaws.com