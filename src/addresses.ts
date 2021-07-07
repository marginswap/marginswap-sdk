import { ChainId } from './constants';

export type DeploymentAddresses = {
  Admin: string;
  CrossMarginTrading: string;
  DependencyController: string;
  Fund: string;
  IncentiveDistribution: string;
  Lending: string;
  MFIStaking: string;
  LiquidityMiningReward: string;
  MarginRouter: string;
  Peg: string;
  Roles: string;
  SpotRouter: string;
  TokenActivation: string;
  TokenAdmin: string;
  Staking: string;
};

const addresses: Record<string, DeploymentAddresses> = require('@marginswap/core-abi/addresses.json');

export function getAddresses(chainId: ChainId): DeploymentAddresses {
  if (!addresses[chainId]) {
    throw `Can't get addresses for ${chainId}`;
  }
  return addresses[chainId.toString()];
}
