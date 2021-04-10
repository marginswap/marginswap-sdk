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

const addresses: Record<string, DeploymentAddresses> = require('@marginswap/core-abi/addresses.json');

console.log('addresses:');
console.log(addresses);

export function getAddresses(chainId:ChainId) {
  console.log(`Getting addresses for ${chainId}`);
  if (!addresses[chainId]) {
    throw `Can't get addresses for ${chainId}`;
  }
  return addresses[chainId.toString()];
}

export default addresses;
