import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface DataStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  dataTierSecurityGroup: ec2.SecurityGroup;
  instanceType?: ec2.InstanceType;
  databaseName?: string;
  secretName?: string;
}

export class DataStack extends cdk.Stack {
  public readonly rdsInstance: rds.DatabaseInstance;
  public readonly secret: secretsmanager.ISecret;

  constructor(scope: Construct, id: string, props: DataStackProps) {
    super(scope, id, props);

    const secret = new secretsmanager.Secret(this, 'DbSecret', {
      secretName: props.secretName ?? 'intocollege-db-credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'postgres' }),
        generateStringKey: 'password',
        excludePunctuation: true,
      },
    });
    this.secret = secret;

    this.rdsInstance = new rds.DatabaseInstance(this, 'Postgres', {
      engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_15 }),
      instanceType:
        props.instanceType ?? ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MEDIUM),
      vpc: props.vpc,
      credentials: rds.Credentials.fromSecret(secret),
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
  securityGroups: [props.dataTierSecurityGroup],
      multiAz: false,
      allocatedStorage: 20,
      databaseName: props.databaseName ?? 'intocollege',
      publiclyAccessible: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deletionProtection: false,
    });

    new cdk.CfnOutput(this, 'RDSEndpoint', {
      value: this.rdsInstance.instanceEndpoint.hostname,
      description: 'RDS PostgreSQL Endpoint',
    });

    new cdk.CfnOutput(this, 'RDSPort', {
      value: this.rdsInstance.instanceEndpoint.port.toString(),
      description: 'RDS PostgreSQL Port',
    });
  }
}
