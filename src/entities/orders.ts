import { Provider, TransactionReceipt } from '@ethersproject/abstract-provider';
import { ChainId } from '../constants';
import { BigNumber } from '@ethersproject/bignumber';
import { getMarginRouterContract } from './margin-account';

export async function makeOrder(
  fromToken: string,
  toToken: string,
  inAmount: string,
  outAmount: string,
  chainId: ChainId,
  provider: Provider
): Promise<TransactionReceipt> {
  const marginRouter = getMarginRouterContract(chainId, provider);
  return await marginRouter.makeOrder(fromToken, toToken, inAmount, outAmount);
}

export async function invalidateOrder(
  orderId: string,
  chainId: ChainId,
  provider: Provider
): Promise<TransactionReceipt> {
  const marginRouter = getMarginRouterContract(chainId, provider);
  return await marginRouter.invalidateOrder(orderId);
}

export async function takeOrder(
  orderId: string,
  maxInAmount: BigNumber,
  chainId: ChainId,
  provider: Provider
): Promise<TransactionReceipt> {
  const marginRouter = getMarginRouterContract(chainId, provider);
  return await marginRouter.takeOrder(orderId, maxInAmount);
}
