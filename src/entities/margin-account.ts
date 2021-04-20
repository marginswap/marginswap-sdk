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
import { getIERC20Token } from './IERC20Token';
import { BigNumber } from '@ethersproject/bignumber';

const PERCENTAGE_BUFFER = 3;

type token = string;
type amount = BigNumber;
export type Balances = Record<token, amount>;

export function getCrossMarginTrading(chainId: ChainId, provider: Provider): Contract {
  const address = getAddresses(chainId).CrossMarginTrading;
  return new Contract(address, CrossMarginTrading.abi, provider);
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

export async function crossBorrow(
  tokenAddress: string,
  amount: string,
  chainId: ChainId,
  library: Signer | Provider
): Promise<TransactionReceipt> {
  const marginRouter = getMarginRouterContract(chainId, library);
  return await marginRouter.crossBorrow(tokenAddress, amount);
}

export async function borrowable(
  traderAddress: string,
  tokenAddress: string,
  chainId: ChainId,
  provider: Provider
): Promise<BigNumber> {
  const holdingTotal = BigNumber.from((await getAccountHoldingTotal(traderAddress, chainId, provider)).toString());
  const borrowTotal = BigNumber.from((await getAccountBorrowTotal(traderAddress, chainId, provider)).toString());

  const crossMarginAddress = getAddresses(chainId).CrossMarginTrading;
  const marginAccounts = new Contract(crossMarginAddress, CrossMarginAccounts.abi, provider);
  const priceManager = new Contract(crossMarginAddress, PriceAware.abi, provider);

  const leveragePercent = (await marginAccounts.leveragePercent()).toNumber();
  const levRatio = (leveragePercent - 100 - PERCENTAGE_BUFFER) / leveragePercent;

  const E18 = BigNumber.from(10).pow(18);
  const currentPriceE18 = await priceManager.viewCurrentPriceInPeg(tokenAddress, E18.toString());

  return holdingTotal
    .mul(1000)
    .mul(Math.round(levRatio * Math.pow(10, 15)))
    .div(borrowTotal.add(1))
    .div(BigNumber.from(currentPriceE18.toString()));
}

export async function borrowableInPeg(traderAddress: string, chainId: ChainId, provider: Provider): Promise<string> {
  const holdingTotal = await getAccountHoldingTotal(traderAddress, chainId, provider);
  const borrowTotal = await getAccountBorrowTotal(traderAddress, chainId, provider);

  const crossMarginAddress = getAddresses(chainId).CrossMarginTrading;
  const marginAccounts = new Contract(crossMarginAddress, CrossMarginAccounts.abi, provider);

  const leveragePercent = await marginAccounts.leveragePercent();
  const borrowPercent = leveragePercent.sub(100);

  const holdingsInUse = leveragePercent.mul(borrowTotal).div(borrowPercent);

  if (holdingTotal.gt(holdingsInUse)) {
    const availableToLever = holdingTotal.sub(holdingsInUse);
    return availableToLever.mul(leveragePercent.sub(PERCENTAGE_BUFFER)).div(100).sub(availableToLever).toString();
  } else {
    return '0';
  }
}

export async function approveToFund(
  tokenAddress: string,
  amount: string,
  chainId: ChainId,
  provider: Provider
): Promise<number> {
  const tokenContract = getIERC20Token(tokenAddress, provider);
  return tokenContract.approve(getAddresses(chainId).Fund, amount);
}

export async function getTokenAllowances(
  ownerAddress: string,
  tokenAddresses: string[],
  chainId: ChainId,
  provider: Provider
): Promise<number[]> {
  return Promise.all(
    tokenAddresses.map(async tokenAddress => {
      const tokenContract = getIERC20Token(tokenAddress, provider);
      return tokenContract.allowance(ownerAddress, getAddresses(chainId).Fund);
    })
  );
}

export async function overCollateralizedBorrow(
  depositToken: string,
  depositAmount: string,
  borrowToken: string,
  withdrawAmount: string,
  chainId: ChainId,
  provider: Provider
): Promise<void> {
  const marginRouter = getMarginRouterContract(chainId, provider);
  await marginRouter.crossOvercollateralizedBorrow(depositToken, depositAmount, borrowToken, withdrawAmount);
}

export async function viewCurrentPriceInPeg(
  tokenAddress: string,
  amount: string,
  chainId: ChainId,
  provider: Provider
): Promise<BigNumber> {
  const crossMarginAddress = getAddresses(chainId).CrossMarginTrading;
  const priceController = new Contract(crossMarginAddress, PriceAware.abi, provider);
  return priceController.viewCurrentPriceInPeg(tokenAddress, amount);
}

export async function crossDepositETH(amount: string, chainId: ChainId, provider: Provider): Promise<void> {
  const marginRouter = getMarginRouterContract(chainId, provider);
  await marginRouter.crossDepositETH({ value: amount });
}

export async function crossWithdrawETH(amount: string, chainId: ChainId, provider: Provider): Promise<void> {
  const marginRouter = getMarginRouterContract(chainId, provider);
  await marginRouter.crossWithdrawETH(amount);
}
