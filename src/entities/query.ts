import { Contract } from '@ethersproject/contracts'
import MarginTrader from "marginswap-core/build/contracts/MarginTrading.json"
import { getNetwork } from '@ethersproject/networks'
import { getDefaultProvider } from '@ethersproject/providers'
import { ChainId } from '../constants'
import * as _ from "lodash";

type token = string;
type amount = number;
type balances = Record<token, amount>;

export class Query {

    /**
     * Get holding amounts
     * @param chainId chain of the token
     * @param address address of the token on the chain
     * @param provider provider used to fetch the token
     */
    public static async getHoldingAmounts(
        address: string,
        chainId = ChainId.MAINNET,
        provider = getDefaultProvider(getNetwork(chainId))
    ): Promise<balances> {
        const marginTrader = new Contract(address, MarginTrader.abi, provider);
        return marginTrader.functions.getHoldingAmounts(address)
            .then(([tokens, amounts]: [string[], number[]]) => _.zipObject(tokens, amounts));
    }

    /**
     * Get borrow amounts
     * @param address address of the token on the chain
     * @param chainId chain of the token
     * @param provider provider used to fetch the token
     */
    public static async getBorrowAmounts(
        address: string,
        chainId = ChainId.MAINNET,
        provider = getDefaultProvider(getNetwork(chainId))
    ): Promise<balances> {
        const marginTrader = new Contract(address, MarginTrader.abi, provider);
        return marginTrader.functions.getBorrowAmounts(address)
            .then(([tokens, amounts]: [string[], number[]]) => _.zipObject(tokens, amounts));
    }

    public static async getAccountBalances(
        traderAddress: string,
        chainId = ChainId.MAINNET,
        provider = getDefaultProvider(getNetwork(chainId))
    ) {
        const holdingAmounts = this.getHoldingAmounts(traderAddress, chainId, provider)
        const borrowAmounts = this.getBorrowAmounts(traderAddress, chainId, provider)
        return Promise.all([holdingAmounts, borrowAmounts]).then(
            ([holdingAmounts, borrowingAmounts]: [balances, balances]) => {
                return { holdingAmounts, borrowingAmounts };
            }
        );
    }
}