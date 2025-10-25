import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as cdk from 'aws-cdk-lib';

export interface DatabaseProps {
  vpc: ec2.Vpc;
  securityGroup: ec2.SecurityGroup;
  instanceType?: ec2.InstanceType;
  databaseName?: string;
  secretName?: string;
}

// RDS PostgreSQL instance with a generated password stored in Secrets Manager
export class Database extends Construct {
  public readonly rdsInstance: rds.DatabaseInstance;
  public readonly secret: secretsmanager.ISecret;

  constructor(scope: Construct, id: string, props: DatabaseProps) {
    super(scope, id);

    const dbName = props.databaseName ?? 'intocollege';
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
      securityGroups: [props.securityGroup],
      multiAz: false,
      allocatedStorage: 20,
      databaseName: dbName,
      publiclyAccessible: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deletionProtection: false,
    });
  }
}
