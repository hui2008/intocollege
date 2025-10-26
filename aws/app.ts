#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { NetworkingStack } from './stacks/networking-stack';
import { ComputeStack } from './stacks/compute-stack';
import { DataStack } from './stacks/data-stack';

const app = new cdk.App();

const appName = 'Lms'; // project/application name

// Use the current CLI configuration for account/region
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

// VPC and security groups
const networking = new NetworkingStack(app, `${appName}Vpc`, {
  env,
});

// App tier EC2 instances
const compute = new ComputeStack(app, `${appName}Compute`, {
  env,
  vpc: networking.vpc,
  appTierSecurityGroup: networking.appTierSecurityGroup,
  keyPairName: 'IntoKeyPair-01',
});
compute.addDependency(networking);

// Data tier (databases, storage)
const data = new DataStack(app, `${appName}Data`, {
  env,
  vpc: networking.vpc,
  dataTierSecurityGroup: networking.dataTierSecurityGroup,
});
data.addDependency(networking);
