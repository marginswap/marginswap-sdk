import { ChainId, Token, Query } from '../src'

describe('Pair', () => {
    const USDC = new Token(ChainId.MAINNET, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 18, 'USDC', 'USD Coin')

    describe('#getHoldingAmounts', () => {
        it('returns the holding amounts', () => {
            return Query.getHoldingAmounts(ChainId.MAINNET, USDC.address).then(data => {
                expect(data).toEqual('1')
            })
        })
    })
})