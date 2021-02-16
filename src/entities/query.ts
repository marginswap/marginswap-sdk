import { Contract } from '@ethersproject/contracts'
import MarginTrader from "marginswap-core/build/contracts/MarginTrading.json"
import { getNetwork } from '@ethersproject/networks'
import { getDefaultProvider } from '@ethersproject/providers'
import { ChainId } from '../constants'

export class Query {

    /**
     * Get holding amounts
     * @param chainId chain of the token
     * @param address address of the token on the chain
     * @param provider provider used to fetch the token
     */
    public static async getHoldingAmounts(
        chainId: ChainId,
        address: string,
        provider = getDefaultProvider(getNetwork(chainId))
    ): Promise<[string[], number[]]> {
        const marginTrader = new Contract(address, MarginTrader.abi, provider);
        return marginTrader.functions.getHoldingAmounts(address)
    }
}