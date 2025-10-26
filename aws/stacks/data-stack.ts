import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface DataStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  dataTierSecurityGroup: ec2.SecurityGroup;
}

export class DataStack extends cdk.Stack {
  public readonly rdsInstance: rds.DatabaseInstance;
  public readonly secret: secretsmanager.ISecret;

  constructor(scope: Construct, id: string, props: DataStackProps) {
    super(scope, id, props);

    const secret = new secretsmanager.Secret(this, 'DbSecret', {
      secretName: 'intocollege-db-credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'intocollege' }),
        generateStringKey: 'password',
        excludePunctuation: true,
      },
    });
    this.secret = secret;

    this.rdsInstance = new rds.DatabaseInstance(this, 'IntoDb', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_17
      }),
      databaseName: 'moodle',
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MEDIUM),
      allocatedStorage: 60,
      credentials: rds.Credentials.fromSecret(secret),
      securityGroups: [
        props.dataTierSecurityGroup
      ],
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED
      },
      multiAz: false,
      availabilityZone: props.vpc.availabilityZones[0],
      backupRetention: cdk.Duration.days(7),
      publiclyAccessible: false,
      deletionProtection: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    new cdk.CfnOutput(this, 'DbEndpoint', {
      value: this.rdsInstance.instanceEndpoint.hostname + ':' + this.rdsInstance.instanceEndpoint.port.toString(),
      description: 'RDS PostgreSQL Endpoint',
    });
  }
}
