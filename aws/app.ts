#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { NetworkingStack } from './stacks/networking-stack';
import { DataStack } from './stacks/data-stack';
import { ComputeStack } from './stacks/compute-stack';
import { RegistryStack } from './stacks/registry-stack';

const app = new cdk.App();

// Use the current CLI configuration for account/region
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

// 1) Networking
const networking = new NetworkingStack(app, 'NetworkingStack', { env });

// 2) Data (depends on networking)
const data = new DataStack(app, 'DataStack', {
  env,
  vpc: networking.vpc,
  rdsSecurityGroup: networking.rdsSecurityGroup,
});
data.addDependency(networking);

// 3) Registry (ECR)
const registry = new RegistryStack(app, 'RegistryStack', {
  env,
  repositoryName: 'intocollege',
});

// 4) Compute (depends on networking + registry)
const compute = new ComputeStack(app, 'ComputeStack', {
  env,
  vpc: networking.vpc,
  ec2SecurityGroup: networking.ec2SecurityGroup,
  ecrRepository: registry.repository,
});
compute.addDependency(networking);
compute.addDependency(registry);