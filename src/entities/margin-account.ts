import { Contract } from '@ethersproject/contracts';
import CrossMarginTrading from '@marginswap/core-abi/artifacts/contracts/CrossMarginTrading.sol/CrossMarginTrading.json';
import MarginRouter from '@marginswap/core-abi/artifacts/contracts/MarginRouter.sol/MarginRouter.json';
import { Provider } from '@ethersproject/abstract-provider';
import { getAddresses } from '../addresses';
import { getNetwork } from '@ethersproject/networks';
import { BaseProvider, getDefaultProvider } from '@ethersproject/providers';
import { ChainId } from '../constants';
import * as _ from 'lodash';
import { BigNumber } from '@ethersproject/bignumber';

type token = string;
type amount = BigNumber;
export type Balances = Record<token, amount>;

async function getCrossMarginTrading(provider: BaseProvider) {
  return new Contract((await getAddresses(provider)).CrossMarginTrading, CrossMarginTrading.abi, provider);
}

/**
 * Get holding amounts
 * @param chainId chain of the token
 * @param address address of the token on the chain
 * @param provider provider used to fetch the token
 */
export async function getHoldingAmounts(address: string, provider: BaseProvider): Promise<Balances> {
  const marginTrader = await getCrossMarginTrading(provider);
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
export async function getBorrowAmounts(address: string, provider: BaseProvider): Promise<Balances> {
  const marginTrader = await getCrossMarginTrading(provider);
  return marginTrader
    .getBorrowAmounts(address)
    .then(([tokens, amounts]: [string[], number[]]) => _.zipObject(tokens, amounts));
}

export async function getAccountBalances(
  traderAddress: string,
  provider: BaseProvider
): Promise<{ holdingAmounts: Balances; borrowingAmounts: Balances }> {
  const holdingAmounts = getHoldingAmounts(traderAddress, provider);
  const borrowAmounts = getBorrowAmounts(traderAddress, provider);
  return Promise.all([holdingAmounts, borrowAmounts]).then(
    ([holdingAmounts, borrowingAmounts]: [Balances, Balances]) => {
      return { holdingAmounts, borrowingAmounts };
    }
  );
}

export async function getAccountHoldingTotal(traderAddress: string, provider: BaseProvider): Promise<amount> {
  const marginTrader = await getCrossMarginTrading(provider);
  return await marginTrader.viewHoldingsInPeg(traderAddress);
}

export async function getAccountBorrowTotal(
  traderAddress: string,
  chainId = ChainId.MAINNET,
  provider = getDefaultProvider(getNetwork(chainId))
): Promise<amount> {
  const marginTrader = await getCrossMarginTrading(provider);
  return await marginTrader.viewLoanInPeg(traderAddress);
}

// TODO does this work? does it return a number?
export async function crossDeposit(tokenAddress: string, amount: string, provider: Provider): Promise<number> {
  const marginRouter = new Contract((await getAddresses(provider)).MarginRouter, MarginRouter.abi, provider);
  return await marginRouter.crossDeposit(tokenAddress, amount);
}
