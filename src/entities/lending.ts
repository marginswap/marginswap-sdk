import { Contract } from '@ethersproject/contracts';
import LendingCore from "@marginswap/core-abi/artifacts/contracts/Lending.sol/Lending.json";
import { getNetwork } from '@ethersproject/networks';
import { BaseProvider, getDefaultProvider } from '@ethersproject/providers';
import { ChainId } from '../constants';
import * as _ from "lodash";
import addresses from "@marginswap/core-abi/addresses.json";

type token = string;
type amount = number;
type balances = Record<token, amount>;

function getLending(chainId:ChainId, provider:BaseProvider) {
    const networkName = getNetwork(chainId).name;
    return new Contract((addresses as any)[networkName].Lending, LendingCore.abi, provider);
}

/**
 * Get hourly bond amounts
 * @param chainId chain of the token
 * @param address address of the token on the chain
 * @param provider provider used to fetch the token
 */
export async function getHourlyBondBalances(
    lenderAddress: string,
    activeTokens:string[],
    chainId = ChainId.MAINNET,
    provider = getDefaultProvider(getNetwork(chainId))
): Promise<balances> {
    const lending = getLending(chainId, provider);
    const requests = activeTokens.map(token => lending.viewHourlyBondAmount(token, lenderAddress));
    return Promise.all(requests).then(balances => _.zipObject(activeTokens, balances));
}

/**
 * Get current interest rate for hourly bonds
 */

// TODO call viewHourlyBondAPRPer10k in Lending
