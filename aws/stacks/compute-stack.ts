import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { Compute } from '../constructs/compute';

export interface ComputeStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  ec2SecurityGroup: ec2.SecurityGroup;
  keyPairName?: string;
  instanceType?: ec2.InstanceType;
  ecrRepositoryName?: string;
}

export class ComputeStack extends cdk.Stack {
  public readonly compute: Compute;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    this.compute = new Compute(this, 'Compute', {
      vpc: props.vpc,
      securityGroup: props.ec2SecurityGroup,
      keyPairName: props.keyPairName ?? 'intocollege-keypair',
      instanceType:
        props.instanceType ?? ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MEDIUM),
      ecrRepositoryName: props.ecrRepositoryName ?? 'intocollege',
    });

    new cdk.CfnOutput(this, 'EC2InstanceId', {
      value: this.compute.ec2Instance.instanceId,
      description: 'EC2 Instance ID',
    });

    new cdk.CfnOutput(this, 'EC2PublicIP', {
      value: this.compute.ec2Instance.instancePublicIp,
      description: 'EC2 Instance Public IP',
    });

    new cdk.CfnOutput(this, 'ECRRepositoryURI', {
      value: this.compute.ecrRepository.repositoryUri,
      description: 'ECR Repository URI',
    });

    new cdk.CfnOutput(this, 'ECRRepositoryName', {
      value: this.compute.ecrRepository.repositoryName,
      description: 'ECR Repository Name',
    });
  }
}
