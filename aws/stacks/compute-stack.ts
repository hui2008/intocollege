import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface ComputeStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  appTierSecurityGroup: ec2.SecurityGroup;
  keyPairName: string;
  instanceType?: ec2.InstanceType;
}

export class ComputeStack extends cdk.Stack {
  public readonly ec2Instance: ec2.Instance;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    const instanceType = ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MEDIUM);

    const ami = ec2.MachineImage.latestAmazonLinux2023({
      cpuType: ec2.AmazonLinuxCpuType.ARM_64,
    });

    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'sudo dnf update -y',
      'sudo dnf install -y docker',
      'sudo systemctl start docker',
      'sudo systemctl enable docker',
      'sudo usermod -a -G docker ec2-user',
    );

    this.ec2Instance = new ec2.Instance(this, 'Moodle', {
      instanceType,
      machineImage: ami,
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC
      },
      availabilityZone: props.vpc.availabilityZones[0],
  securityGroup: props.appTierSecurityGroup,
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(60, {
            volumeType: ec2.EbsDeviceVolumeType.GP3,
          }),
        }
      ],
      userData,
      keyPair: ec2.KeyPair.fromKeyPairName(this, 'KeyPair', props.keyPairName),
    });

    new cdk.CfnOutput(this, 'EC2InstanceId', {
      value: this.ec2Instance.instanceId,
      description: 'EC2 Instance ID',
    });

    new cdk.CfnOutput(this, 'EC2PublicIP', {
      value: this.ec2Instance.instancePublicIp,
      description: 'EC2 Instance Public IP',
    });
  }
}
