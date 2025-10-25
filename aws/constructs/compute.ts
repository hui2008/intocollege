import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ecr from 'aws-cdk-lib/aws-ecr';

export interface ComputeProps {
  vpc: ec2.Vpc;
  securityGroup: ec2.SecurityGroup;
  keyPairName?: string;
  instanceType?: ec2.InstanceType;
  ecrRepositoryName?: string;
}

// Provides an EC2 instance and an ECR repository for application images
export class Compute extends Construct {
  public readonly ec2Instance: ec2.Instance;
  public readonly ecrRepository: ecr.Repository;

  constructor(scope: Construct, id: string, props: ComputeProps) {
    super(scope, id);

    this.ecrRepository = new ecr.Repository(this, 'Repository', {
      repositoryName: props.ecrRepositoryName ?? 'intocollege',
      imageScanOnPush: true,
    });

    const role = new iam.Role(this, 'Ec2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryReadOnly'),
      ],
    });

    const instanceType =
      props.instanceType ?? ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MEDIUM);

    // Use AL2023 for ARM64 to match t4g.*
    const ami = ec2.MachineImage.latestAmazonLinux2023({
      cpuType: ec2.AmazonLinuxCpuType.ARM_64,
    });

    this.ec2Instance = new ec2.Instance(this, 'Instance', {
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroup: props.securityGroup,
      instanceType,
      machineImage: ami,
      keyName: props.keyPairName,
      role,
    });
  }
}
