import { ChainId } from "./constants";

export type DeploymentAddresses = {
  Admin: string;
  CrossMarginTrading: string;
  DependencyController: string;
  Fund: string;
  IncentiveDistribution: string;
  Lending: string;
  LiquidityMiningReward: string;
  MarginRouter: string;
  Peg: string;
  Roles: string;
  SpotRouter: string;
  TokenActivation: string;
  TokenAdmin: string;
};

let addresses: Record<string, DeploymentAddresses> = require('@marginswap/core-abi/addresses.json');

export function getAddresses(chainId:ChainId) {
  return addresses[chainId];
}

export default addresses;
