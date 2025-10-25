import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export interface NetworkingProps {
  cidr?: string;
  maxAzs?: number;
}

// Provides core networking: VPC + security groups for EC2 and RDS
export class Networking extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly ec2SecurityGroup: ec2.SecurityGroup;
  public readonly rdsSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: NetworkingProps = {}) {
    super(scope, id);

    // VPC with public and private subnets (default CDK layout)
    this.vpc = new ec2.Vpc(this, 'VPC', {
      ipAddresses: ec2.IpAddresses.cidr(props.cidr ?? '10.0.0.0/16'),
      maxAzs: props.maxAzs ?? 2,
      natGateways: 1,
    });

    // Security Group for EC2 instances
    this.ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for EC2 instance',
      allowAllOutbound: true,
    });
    // Allow SSH by default (adjust as needed for your IP)
    this.ec2SecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'Allow SSH access');

    // Security Group for RDS - no outbound, allow Postgres from EC2 SG
    this.rdsSecurityGroup = new ec2.SecurityGroup(this, 'RDSSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for RDS PostgreSQL instance',
      allowAllOutbound: false,
    });
    this.rdsSecurityGroup.addIngressRule(
      this.ec2SecurityGroup,
      ec2.Port.tcp(5432),
      'Allow Postgres from EC2 instances'
    );
  }
}
