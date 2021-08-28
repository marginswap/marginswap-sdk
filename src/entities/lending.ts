import { Contract } from '@ethersproject/contracts';
import LendingCore from '@marginswap/core-abi/artifacts/contracts/Lending.sol/Lending.json';
import PriceAware from '@marginswap/core-abi/artifacts/contracts/PriceAware.sol/PriceAware.json';
import { getNetwork } from '@ethersproject/networks';
import { BaseProvider, getDefaultProvider, TransactionReceipt } from '@ethersproject/providers';
import { ChainId } from '../constants';
import { Token } from './token';
import * as _ from 'lodash';
import { getAddresses } from '../addresses';
import { Balances } from './margin-account';
import { BigNumber } from '@ethersproject/bignumber';
import { getCoinUsdPrice, CoinGeckoReponseType } from '../utils';

function getLending(chainId: ChainId, provider: BaseProvider) {
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

export async function totalLendingAvailable(
  tokenAddress: string,
  chainId = ChainId.MAINNET,
  provider = getDefaultProvider(getNetwork(chainId))
): Promise<TransactionReceipt> {
  const lending = getLending(chainId, provider);
  const { totalLending, totalBorrowed } = await lending.lendingMeta(tokenAddress);
  if (totalLending.gt(totalBorrowed)) {
    return totalLending.sub(totalBorrowed);
  } else {
    return totalLending.sub(totalLending);
  }
}

/**
 * Update hourly bond interest
 * @param token issuer token address
 * @param chainId chain of the token
 * @param provider provider used to fetch the token
 */
export async function updateBondInterest(
  token: string,
  chainId = ChainId.MAINNET,
  provider = getDefaultProvider(getNetwork(chainId))
): Promise<number> {
  return getLending(chainId, provider).updateHourlyYield(token);
}

/**
 * Get current interest rate for borrow
 * @param tokens addresses of the issuers on the chain
 * @param chainId chain of the token
 * @param provider provider used to fetch the token
 */
export async function getBorrowInterestRates(
  tokens: string[],
  chainId = ChainId.MAINNET,
  provider = getDefaultProvider(getNetwork(chainId))
): Promise<Balances> {
  const lending = getLending(chainId, provider);
  const requests = tokens.map(token => lending.viewBorrowAPRPer10k(token));
  return Promise.all(requests).then(interestRates => _.zipObject(tokens, interestRates));
}

export async function getIncentiveRatePer10k(
  token: string,
  chainId: ChainId,
  provider: BaseProvider
): Promise<BigNumber> {
  const lending = getLending(chainId, provider);
  return lending.viewYearlyIncentivePer10k(token);
}

export async function getHourlyBondIncentiveInterestRates(
  tokens: Token[],
  chainId: ChainId,
  provider: BaseProvider
): Promise<Balances> {
  const tokenUSDPrice: CoinGeckoReponseType = await getCoinUsdPrice([
    ...tokens.map(token => token.coingeckoId || ''),
    'marginswap'
  ]);
  const requests = tokens.map(async token => {
    if (!token?.coingeckoId) return BigNumber.from(0);
    const tokenAPRPer10k = await getIncentiveRatePer10k(token.address, chainId, provider);
    const MFIUSDPrice: number = tokenUSDPrice?.data['marginswap'].usd || 0;
    const conversionFactor = Math.floor(
      (10 ** 14 * (MFIUSDPrice * 10 ** 18) / tokenUSDPrice.data[token.coingeckoId]?.usd * 10 ** token.decimals)
    );

    console.log(conversionFactor);
    let amount = tokenAPRPer10k.mul(conversionFactor.toString()).div(`1${'0'.repeat(14)}`);

    try {
      amount.toNumber();
    } catch (error) {
      console.log(error);
      amount = BigNumber.from('999999999');
    }

    return amount;
  });
  const addresses = tokens.map(token => token.address);

  return Promise.all(requests).then(interestRates => _.zipObject(addresses, interestRates));
}
