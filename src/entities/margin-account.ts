import { Contract } from '@ethersproject/contracts';
import CrossMarginTrading from '@marginswap/core-abi/artifacts/contracts/CrossMarginTrading.sol/CrossMarginTrading.json';
import Admin from '@marginswap/core-abi/artifacts/contracts/Admin.sol/Admin.json';
import LiquidityMiningReward from '@marginswap/core-abi/artifacts/contracts/LiquidityMiningReward.sol/LiquidityMiningReward.json';
import addresses from '@marginswap/core-abi/addresses.json';
import { getNetwork } from '@ethersproject/networks';
import { BaseProvider, getDefaultProvider } from '@ethersproject/providers';
import { ChainId } from '../constants';
import * as _ from 'lodash';
import { BigNumber } from '@ethersproject/bignumber';

type token = string;
type amount = BigNumber;
export type Balances = Record<token, amount>;

function getCrossMarginTrading(chainId: ChainId, provider: BaseProvider) {
  const networkName = getNetwork(chainId).name;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Contract((addresses as any)[networkName].CrossMarginTrading, CrossMarginTrading.abi, provider);
}

/**
 * Get holding amounts
 * @param chainId chain of the token
 * @param address address of the token on the chain
 * @param provider provider used to fetch the token
 */
export async function getHoldingAmounts(
  address: string,
  chainId = ChainId.MAINNET,
  provider = getDefaultProvider(getNetwork(chainId))
): Promise<Balances> {
  const marginTrader = getCrossMarginTrading(chainId, provider);
  return marginTrader
    .getHoldingAmounts(address)
    .then(([tokens, amounts]: [string[], number[]]) => _.zipObject(tokens, amounts));
}

/**
 * Get borrow amounts
 * @param address address of the token on the chain
 * @param chainId chain of the token
 * @param provider provider used to fetch the token
 */
export async function getBorrowAmounts(
  address: string,
  chainId = ChainId.MAINNET,
  provider = getDefaultProvider(getNetwork(chainId))
): Promise<Balances> {
  const marginTrader = getCrossMarginTrading(chainId, provider);
  return marginTrader
    .getBorrowAmounts(address)
    .then(([tokens, amounts]: [string[], number[]]) => _.zipObject(tokens, amounts));
}

export async function getAccountBalances(
  traderAddress: string,
  chainId = ChainId.MAINNET,
  provider = getDefaultProvider(getNetwork(chainId))
): Promise<{ holdingAmounts: Balances; borrowingAmounts: Balances }> {
  const holdingAmounts = getHoldingAmounts(traderAddress, chainId, provider);
  const borrowAmounts = getBorrowAmounts(traderAddress, chainId, provider);
  return Promise.all([holdingAmounts, borrowAmounts]).then(
    ([holdingAmounts, borrowingAmounts]: [Balances, Balances]) => {
      return { holdingAmounts, borrowingAmounts };
    }
  );
}

export async function getAccountHoldingTotal(
  traderAddress: string,
  chainId = ChainId.MAINNET,
  provider = getDefaultProvider(getNetwork(chainId))
): Promise<amount> {
  const marginTrader = getCrossMarginTrading(chainId, provider);
  return await marginTrader.viewHoldingsInPeg(traderAddress);
}

export async function getAccountBorrowTotal(
  traderAddress: string,
  chainId = ChainId.MAINNET,
  provider = getDefaultProvider(getNetwork(chainId))
): Promise<amount> {
  const marginTrader = getCrossMarginTrading(chainId, provider);
  return await marginTrader.viewLoanInPeg(traderAddress);
}

export async function getLiquidityStakeAmount(
  traderAdress: string,
  provider = getDefaultProvider(getNetwork(ChainId.MAINNET))
): Promise<number> {
  const networkName = await provider.getNetwork().then(network => network.name);
  const liquidityMiningReward = new Contract(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (addresses as any)[networkName].LiquidityMiningReward,
    LiquidityMiningReward.abi,
    provider
  );
  return liquidityMiningReward.stakeAmounts(traderAdress);
}

export async function getMaintenanceStakeAmount(
  traderAdress: string,
  provider = getDefaultProvider(getNetwork(ChainId.MAINNET))
): Promise<number> {
  const networkName = await provider.getNetwork().then(network => network.name);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = new Contract((addresses as any)[networkName].Admin, Admin.abi, provider);
  return admin.stakes(traderAdress);
}
