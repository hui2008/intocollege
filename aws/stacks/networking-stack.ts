import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { Networking } from '../constructs/networking';

export interface NetworkingStackProps extends cdk.StackProps {
  cidr?: string;
  maxAzs?: number;
}

export class NetworkingStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly ec2SecurityGroup: ec2.SecurityGroup;
  public readonly rdsSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props?: NetworkingStackProps) {
    super(scope, id, props);

    const networking = new Networking(this, 'Networking', {
      cidr: props?.cidr ?? '10.0.0.0/16',
      maxAzs: props?.maxAzs ?? 2,
    });

    this.vpc = networking.vpc;
    this.ec2SecurityGroup = networking.ec2SecurityGroup;
    this.rdsSecurityGroup = networking.rdsSecurityGroup;

    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
    });
  }
}
