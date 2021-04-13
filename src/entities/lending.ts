import { Contract } from '@ethersproject/contracts';
import LendingCore from '@marginswap/core-abi/artifacts/contracts/Lending.sol/Lending.json';
import PriceAware from '@marginswap/core-abi/artifacts/contracts/PriceAware.sol/PriceAware.json';
import { getNetwork } from '@ethersproject/networks';
import { BaseProvider, getDefaultProvider, TransactionReceipt } from '@ethersproject/providers';
import { ChainId } from '../constants';
import * as _ from 'lodash';
import { getAddresses } from '../addresses';
import { Balances, getCrossMarginTrading } from './margin-account';
import { getIERC20Token } from './IERC20Token';

function getLending(chainId: ChainId, provider: BaseProvider) {
  const networkName = getNetwork(chainId).name;
  return new Contract(getAddresses(chainId).Lending, LendingCore.abi, provider);
}

/**
 * Get hourly bond amounts
 * @param lenderAddress address of the lender on the chain
 * @param activeTokens addresses of the issuers on the chain
 * @param chainId chain of the token
 * @param provider provider used to fetch the token
 */
export async function getHourlyBondBalances(
  lenderAddress: string,
  activeTokens: string[],
  chainId = ChainId.MAINNET,
  provider = getDefaultProvider(getNetwork(chainId))
): Promise<Balances> {
  const lending = getLending(chainId, provider);
  const requests = activeTokens.map(token => lending.viewHourlyBondAmount(token, lenderAddress));
  return Promise.all(requests).then(balances => _.zipObject(activeTokens, balances));
}

/**
 * Get current interest rate for hourly bonds
 * @param tokens addresses of the issuers on the chain
 * @param chainId chain of the token
 * @param provider provider used to fetch the token
 */
export async function getHourlyBondInterestRates(
  tokens: string[],
  chainId = ChainId.MAINNET,
  provider = getDefaultProvider(getNetwork(chainId))
): Promise<Balances> {
  const lending = getLending(chainId, provider);
  const requests = tokens.map(token => lending.viewHourlyBondAPRPer10k(token));
  return Promise.all(requests).then(interestRates => _.zipObject(tokens, interestRates));
}

/**
 * Get hourly bond maturities
 * @param lenderAddress address of the lender on the chain
 * @param tokens addresses of the issuers on the chain
 * @param chainId chain of the token
 * @param provider provider used to fetch the token
 */
export async function getHourlyBondMaturities(
  lenderAddress: string,
  tokens: string[],
  chainId = ChainId.MAINNET,
  provider = getDefaultProvider(getNetwork(chainId))
): Promise<Balances> {
  const lending = getLending(chainId, provider);
  const bondsData = await Promise.all(tokens.map(token => lending.hourlyBondAccounts(token, lenderAddress)));
  return bondsData.reduce((acc, cur, index) => {
    const currentTime = Math.floor(Date.now() / 1000);
    const oneHour = 60 ** 2;
    const maturity = (cur.moduloHour + oneHour - (currentTime % oneHour)) % oneHour;
    return { ...acc, [tokens[index]]: maturity };
  }, {});
}

export async function buyHourlyBondSubscription(
  token: string,
  amount: string,
  chainId = ChainId.MAINNET,
  provider = getDefaultProvider(getNetwork(chainId))
): Promise<TransactionReceipt> {
  const lending = getLending(chainId, provider);
  return lending.buyHourlyBondSubscription(token, amount);
}

export async function getBondsCostInDollars(
  lenderAddress: string,
  tokens: string[],
  chainId = ChainId.MAINNET,
  provider = getDefaultProvider(getNetwork(chainId))
): Promise<Balances> {
  const balances = await getHourlyBondBalances(lenderAddress, tokens, chainId, provider);
  const crossMarginAddress = getAddresses(chainId).CrossMarginTrading;
  const priceManager = new Contract(crossMarginAddress, PriceAware.abi, provider);

  const bondsData = await Promise.all(tokens.map(token => priceManager.viewCurrentPriceInPeg(token, balances[token])));
  return _.zipObject(tokens, bondsData);
}

export async function withdrawHourlyBond(
  token: string,
  amount: string,
  chainId = ChainId.MAINNET,
  provider = getDefaultProvider(getNetwork(chainId))
): Promise<TransactionReceipt> {
  const lending = getLending(chainId, provider);
  return lending.withdrawHourlyBond(token, amount);
}
