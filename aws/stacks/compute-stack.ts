import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface ComputeStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  ec2SecurityGroup: ec2.SecurityGroup;
  keyPairName?: string;
  instanceType?: ec2.InstanceType;
  ecrRepositoryName?: string;
}

export class ComputeStack extends cdk.Stack {
  public readonly ec2Instance: ec2.Instance;
  public readonly ecrRepository: ecr.Repository;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

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

    const ami = ec2.MachineImage.latestAmazonLinux2023({
      cpuType: ec2.AmazonLinuxCpuType.ARM_64,
    });

    this.ec2Instance = new ec2.Instance(this, 'Instance', {
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroup: props.ec2SecurityGroup,
      instanceType,
      machineImage: ami,
      keyName: props.keyPairName ?? 'intocollege-keypair',
      role,
    });

    new cdk.CfnOutput(this, 'EC2InstanceId', {
      value: this.ec2Instance.instanceId,
      description: 'EC2 Instance ID',
    });

    new cdk.CfnOutput(this, 'EC2PublicIP', {
      value: this.ec2Instance.instancePublicIp,
      description: 'EC2 Instance Public IP',
    });

    new cdk.CfnOutput(this, 'ECRRepositoryURI', {
      value: this.ecrRepository.repositoryUri,
      description: 'ECR Repository URI',
    });

    new cdk.CfnOutput(this, 'ECRRepositoryName', {
      value: this.ecrRepository.repositoryName,
      description: 'ECR Repository Name',
    });
  }
}
