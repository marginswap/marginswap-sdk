import { Contract } from '@ethersproject/contracts';
import MarginRouter from '@marginswap/core-abi/artifacts/contracts/MarginRouter.sol/MarginRouter.json';
import { Signer } from '@ethersproject/abstract-signer';
import { Provider, TransactionReceipt } from '@ethersproject/abstract-provider';
import { getAddresses } from '../addresses';
import { ChainId } from '../constants';
import { BigNumber } from '@ethersproject/bignumber';

export function getMarginRouterContract(chainId: ChainId, provider: Signer | Provider): Contract {
  return new Contract(getAddresses(chainId).MarginRouter, MarginRouter.abi, provider);
}

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
