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
  provider: Provider,
  expiration?: string
): Promise<TransactionReceipt> {
  const marginRouter = getMarginRouterContract(chainId, provider);
  return await marginRouter.makeOrder(fromToken, toToken, inAmount, outAmount, expiration ?? '0');
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

export type OrderRecord = {
  fromToken: string;
  toToken: string;
  inAmount: BigNumber;
  outAmount: BigNumber;
  maker: string;
  expiration: BigNumber;
};

export async function getOrdersPerUser(
  userAddress: string,
  chainId: ChainId,
  provider: Provider
): Promise<OrderRecord[]> {
  const marginRouter = getMarginRouterContract(chainId, provider);
  return await marginRouter.getPendingOrderRecordsPerUser(userAddress);
}
