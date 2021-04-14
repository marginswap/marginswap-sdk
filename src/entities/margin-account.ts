import { Contract } from '@ethersproject/contracts';
import CrossMarginTrading from '@marginswap/core-abi/artifacts/contracts/CrossMarginTrading.sol/CrossMarginTrading.json';
import MarginRouter from '@marginswap/core-abi/artifacts/contracts/MarginRouter.sol/MarginRouter.json';
import PriceAware from '@marginswap/core-abi/artifacts/contracts/PriceAware.sol/PriceAware.json';
import CrossMarginAccounts from '@marginswap/core-abi/artifacts/contracts/CrossMarginAccounts.sol/CrossMarginAccounts.json';
import { Signer } from '@ethersproject/abstract-signer';
import { Provider, TransactionReceipt } from '@ethersproject/abstract-provider';
import { getAddresses } from '../addresses';
import { ChainId } from '../constants';
import * as _ from 'lodash';
import { parseFixed } from '@ethersproject/bignumber';
import { getIERC20Token } from './IERC20Token';
import BigNumber from "bignumber.js";

const PERCENTAGE_BUFFER = 3;

type token = string;
type amount = BigNumber;
export type Balances = Record<token, amount>;

export function getCrossMarginTrading(chainId: ChainId, provider: Provider): Contract {
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
export async function getHoldingAmounts(address: string, chainId: ChainId, provider: Provider): Promise<Balances> {
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
export async function getBorrowAmounts(address: string, chainId: ChainId, provider: Provider): Promise<Balances> {
  const marginTrader = getCrossMarginTrading(chainId, provider);
  return marginTrader
    .getBorrowAmounts(address)
    .then(([tokens, amounts]: [string[], number[]]) => _.zipObject(tokens, amounts));
}

export async function getAccountBalances(
  traderAddress: string,
  chainId: ChainId,
  provider: Provider
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
  chainId: ChainId,
  provider: Provider
): Promise<amount> {
  const marginTrader = getCrossMarginTrading(chainId, provider);
  return marginTrader.viewHoldingsInPeg(traderAddress);
}

export async function getAccountBorrowTotal(
  traderAddress: string,
  chainId: ChainId,
  provider: Provider
): Promise<amount> {
  const marginTrader = getCrossMarginTrading(chainId, provider);
  return marginTrader.viewLoanInPeg(traderAddress);
}

export async function getBalanceInToken(
  traderAddress: string,
  tokenAddress: string,
  chainId: ChainId,
  provider: Provider
): Promise<amount> {
  const marginTrader = getCrossMarginTrading(chainId, provider);
  return await marginTrader.viewBalanceInToken(traderAddress, tokenAddress);
}

export async function crossDeposit(
  tokenAddress: string,
  amount: string,
  chainId: ChainId,
  provider: Provider
): Promise<TransactionReceipt> {
  const marginRouter = getMarginRouterContract(chainId, provider);
  return await marginRouter.crossDeposit(tokenAddress, amount);
}

export async function crossWithdraw(
  tokenAddress: string,
  amount: string,
  chainId: ChainId,
  library: Signer | Provider
): Promise<TransactionReceipt> {
  const marginRouter = getMarginRouterContract(chainId, library);
  return await marginRouter.crossWithdraw(tokenAddress, amount);
}

export async function borrowable(
  traderAddress: string,
  tokenAddress: string,
  chainId: ChainId,
  provider: Provider
): Promise<BigNumber> {
  const marginTrader = getCrossMarginTrading(chainId, provider);
  const holdingTotal = new BigNumber((await getAccountHoldingTotal(traderAddress, chainId, provider)).toString());
  const borrowTotal = new BigNumber((await getAccountBorrowTotal(traderAddress, chainId, provider)).toString());

  const crossMarginAddress = getAddresses(chainId).CrossMarginTrading;
  const marginAccounts = new Contract(crossMarginAddress, CrossMarginAccounts.abi, provider);
  const priceManager = new Contract(crossMarginAddress, PriceAware.abi, provider);

  const leveragePercent = (await marginAccounts.leveragePercent()).toNumber();
  const levRatio = (leveragePercent - 100 - PERCENTAGE_BUFFER) / leveragePercent;

  const E18 = new BigNumber(10).pow(18);
  let currentPriceE18 = (await priceManager.viewCurrentPriceInPeg(tokenAddress, E18.toString()));

  return holdingTotal.times(E18).times(levRatio).div(borrowTotal.plus(1)).div(new BigNumber(currentPriceE18.toString()));
}

export async function approveToFund(
  tokenAddress: string,
  amount: string,
  chainId: ChainId,
  provider: Provider
): Promise<number> {
  const tokenContract = getIERC20Token(tokenAddress, provider);
  return await tokenContract.approve(getAddresses(chainId).Fund, amount);
}
