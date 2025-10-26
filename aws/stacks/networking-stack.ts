import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface NetworkingStackProps extends cdk.StackProps {
  cidr?: string;
  maxAzs?: number;
}

/**
 * Implements a three-tier network architecture.
 * - Web tier: handled by Cloudflare (no public load balancers in this stack).
 * - App tier: EC2 instances in public subnets for now; planned migration to private subnets with IPv6.
 * - Data tier: RDS in isolated private subnets with no internet egress.
 */
export class NetworkingStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly appTierSecurityGroup: ec2.SecurityGroup;
  public readonly dataTierSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props?: NetworkingStackProps) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, 'Vpc', {
      vpcName: 'LmsVpc',
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 3,
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'AppTier',
          subnetType: ec2.SubnetType.PUBLIC, // can change to private with IPv6
        },
        {
          cidrMask: 24,
          name: 'DataTier',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Security group for app tier (EC2)
    this.appTierSecurityGroup = new ec2.SecurityGroup(this, 'AppTierEc2Sg', {
      vpc: this.vpc,
      description: 'Security group for app-tier EC2 instances',
      allowAllOutbound: true,
    });
    // Human-friendly console name via tag (non-destructive)
    cdk.Tags.of(this.appTierSecurityGroup).add('Name', 'lms-app-tier-ec2-sg');
    this.appTierSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'Allow SSH access');

    // Security group for data tier (RDS) - no outbound, allow Postgres from app tier
    this.dataTierSecurityGroup = new ec2.SecurityGroup(this, 'DataTierRdsSg', {
      vpc: this.vpc,
      description: 'Security group for data-tier PostgreSQL (RDS)',
      allowAllOutbound: false,
    });
    // Human-friendly console name via tag (non-destructive)
    cdk.Tags.of(this.dataTierSecurityGroup).add('Name', 'lms-data-tier-rds-sg');
    this.dataTierSecurityGroup.addIngressRule(this.appTierSecurityGroup, ec2.Port.tcp(5432), 'Allow to access RDS from EC2 instances');

    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
    });
  }
}
