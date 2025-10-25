import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { Database } from '../constructs/database';

export interface DataStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  rdsSecurityGroup: ec2.SecurityGroup;
  instanceType?: ec2.InstanceType;
  databaseName?: string;
  secretName?: string;
}

export class DataStack extends cdk.Stack {
  public readonly database: Database;

  constructor(scope: Construct, id: string, props: DataStackProps) {
    super(scope, id, props);

    this.database = new Database(this, 'Database', {
      vpc: props.vpc,
      securityGroup: props.rdsSecurityGroup,
      instanceType:
        props.instanceType ?? ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MEDIUM),
      databaseName: props.databaseName ?? 'intocollege',
      secretName: props.secretName ?? 'intocollege-db-credentials',
    });

    new cdk.CfnOutput(this, 'RDSEndpoint', {
      value: this.database.rdsInstance.instanceEndpoint.hostname,
      description: 'RDS PostgreSQL Endpoint',
    });

    new cdk.CfnOutput(this, 'RDSPort', {
      value: this.database.rdsInstance.instanceEndpoint.port.toString(),
      description: 'RDS PostgreSQL Port',
    });
  }
}
