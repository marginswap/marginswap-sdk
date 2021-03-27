import { Contract } from '@ethersproject/contracts';
import CrossMarginTrading from "marginswap-abi/contracts/CrossMarginTrading.sol/CrossMarginTrading.json";
import * as addresses from "marginswap-abi/addresses.json";
import { getNetwork } from '@ethersproject/networks';
import { BaseProvider, getDefaultProvider } from '@ethersproject/providers';
import { ChainId } from '../constants';
import * as _ from "lodash";

type token = string;
type amount = number;
type balances = Record<token, amount>;


function getCrossMarginTrading(chainId: ChainId, provider: BaseProvider) {
  const networkName = getNetwork(chainId).name;
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
): Promise<balances> {
  const marginTrader = getCrossMarginTrading(chainId, provider);
  return marginTrader.functions.getHoldingAmounts(address)
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
): Promise<balances> {
  const marginTrader = getCrossMarginTrading(chainId, provider);
  return marginTrader.functions.getBorrowAmounts(address)
    .then(([tokens, amounts]: [string[], number[]]) => _.zipObject(tokens, amounts));
}

export async function getAccountBalances(
  traderAddress: string,
  chainId = ChainId.MAINNET,
  provider = getDefaultProvider(getNetwork(chainId))
) {
  const holdingAmounts = getHoldingAmounts(traderAddress, chainId, provider);
  const borrowAmounts = getBorrowAmounts(traderAddress, chainId, provider);
  return Promise.all([holdingAmounts, borrowAmounts]).then(
    ([holdingAmounts, borrowingAmounts]: [balances, balances]) => {
      return { holdingAmounts, borrowingAmounts };
    }
  );
}

