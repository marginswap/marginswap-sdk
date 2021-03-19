import { Contract } from '@ethersproject/contracts'
import LendingCore from "marginswap-abi/contracts/Lending.sol/Lending.json";
import { getNetwork } from '@ethersproject/networks'
import { getDefaultProvider } from '@ethersproject/providers'
import { ChainId } from '../constants'
import * as _ from "lodash";

type token = string;
type amount = number;
type balances = Record<token, amount>;

const activeTokens: string[] = [];

export class Lending {
    /**
     * Get hourly bond amounts
     * @param chainId chain of the token
     * @param address address of the token on the chain
     * @param provider provider used to fetch the token
     */
    public static async getHourlyBondBalances(
        address: string,
        chainId = ChainId.MAINNET,
        provider = getDefaultProvider(getNetwork(chainId))
    ): Promise<balances> {
        const lending = new Contract(address, LendingCore.abi, provider);
        const requests = activeTokens.map(token => lending.viewHourlyBondAmount(token));
        return Promise.all(requests).then(balances => _.zipObject(activeTokens, balances));
    }
}
