import { Contract } from '@ethersproject/contracts';
import CrossMarginTrading from '@marginswap/core-abi/artifacts/contracts/CrossMarginTrading.sol/CrossMarginTrading.json';
import MarginRouter from '@marginswap/core-abi/artifacts/contracts/MarginRouter.sol/MarginRouter.json';
import { Signer } from '@ethersproject/abstract-signer';
import { Provider } from '@ethersproject/abstract-provider';
import { getAddresses } from '../addresses';
import { getNetwork } from '@ethersproject/networks';
import { BaseProvider, getDefaultProvider } from '@ethersproject/providers';
import { ChainId } from '../constants';
import * as _ from 'lodash';
import { BigNumber } from '@ethersproject/bignumber';
import { getIERC20Token } from './IERC20Token';

type token = string;
type amount = BigNumber;
export type Balances = Record<token, amount>;

export function getCrossMarginTrading(chainId: ChainId, provider: BaseProvider): Contract {
  return new Contract(getAddresses(chainId).CrossMarginTrading, CrossMarginTrading.abi, provider);
}

export function getMarginRouterContract(chainId: ChainId, provider: Signer | Provider): Contract {
  return new Contract(getAddresses(chainId).MarginRouter, MarginRouter.abi, provider);
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

export async function crossDeposit(
  tokenAddress: string,
  amount: string,
  chainId = ChainId.MAINNET,
  provider = getDefaultProvider(getNetwork(chainId))
): Promise<number> {
  const tokenContract = getIERC20Token(tokenAddress, provider);
  await tokenContract.approve(getAddresses(chainId).Fund, amount);
  const marginRouter = getMarginRouterContract(chainId, provider);
  return await marginRouter.crossDeposit(tokenAddress, amount);
}

export async function crossWithdraw(
  tokenAddress: string,
  amount: string,
  chainId = ChainId.MAINNET,
  library: Signer | Provider
): Promise<number> {
  const marginRouter = getMarginRouterContract(chainId, library);
  return await marginRouter.crossWithdraw(tokenAddress, amount);
}
