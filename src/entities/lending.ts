import { Contract } from '@ethersproject/contracts';
import LendingCore from '@marginswap/core-abi/artifacts/contracts/Lending.sol/Lending.json';
import { Provider } from '@ethersproject/providers';
import * as _ from 'lodash';
import { getAddresses } from '../addresses';
import { Balances } from './margin-account';

async function getLending(provider: Provider) {
  return new Contract((await getAddresses(provider)).Lending, LendingCore.abi, provider);
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
  provider: Provider
): Promise<Balances> {
  const lending = await getLending(provider);
  const requests = activeTokens.map(token => lending.viewHourlyBondAmount(token, lenderAddress));
  return Promise.all(requests).then(balances => _.zipObject(activeTokens, balances));
}

/**
 * Get current interest rate for hourly bonds
 * @param tokens addresses of the issuers on the chain
 * @param chainId chain of the token
 * @param provider provider used to fetch the token
 */
export async function getHourlyBondInterestRates(tokens: string[], provider: Provider): Promise<Balances> {
  const lending = await getLending(provider);
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
  provider: Provider
): Promise<Balances> {
  const lending = await getLending(provider);
  const bondsData = await Promise.all(tokens.map(token => lending.hourlyBondAccounts(token, lenderAddress)));
  return bondsData.reduce((acc, cur, index) => ({ ...acc, [tokens[index]]: cur.moduloHour }), {});
}
