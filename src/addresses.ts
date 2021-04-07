import { Provider } from '@ethersproject/providers';

// eslint-disable-next-line @typescript-eslint/no-explicit-any

type DeploymentAddresses = {
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

export let addresses: { [netName: string]: DeploymentAddresses };

if (process.env.NODE_ENV === 'development') {
  addresses = require('./abis/addresses-local.json');
} else {
  addresses = require('@marginswap/core-abi/addresses.json');
}

export async function getAddresses(provider: Provider): Promise<DeploymentAddresses> {
  const _networkName = await provider.getNetwork().then(network => network.name);
  const networkName = _networkName === 'homestead' ? 'mainnet' : _networkName;
  return addresses[networkName];
}
