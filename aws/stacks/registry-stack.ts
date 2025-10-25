import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { Construct } from 'constructs';

export interface RegistryStackProps extends cdk.StackProps {
  repositoryName?: string;
  maxImageCount?: number; // lifecycle retention
}

export class RegistryStack extends cdk.Stack {
  public readonly repository: ecr.Repository;

  constructor(scope: Construct, id: string, props: RegistryStackProps = {}) {
    super(scope, id, props);

    this.repository = new ecr.Repository(this, 'Repository', {
      repositoryName: props.repositoryName ?? 'intocollege',
      imageScanOnPush: true,
      lifecycleRules: [
        { rulePriority: 1, maxImageCount: props.maxImageCount ?? 50 },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      emptyOnDelete: false,
    });

    new cdk.CfnOutput(this, 'ECRRepositoryURI', {
      value: this.repository.repositoryUri,
      description: 'ECR Repository URI',
      exportName: `${this.stackName}:ECRRepositoryURI`,
    });

    new cdk.CfnOutput(this, 'ECRRepositoryName', {
      value: this.repository.repositoryName,
      description: 'ECR Repository Name',
      exportName: `${this.stackName}:ECRRepositoryName`,
    });
  }
}
