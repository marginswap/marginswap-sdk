import { ChainId, Token, Query } from '../src'

describe('Query', () => {
    const ADDRESS_ONE = '0x0000000000000000000000000000000000000001'

    const USDC = new Token(ChainId.ROPSTEN, ADDRESS_ONE, 18, 'USDC', 'USD Coin')

    describe('#getHoldingAmounts', () => {
        it('returns the holding amounts', () => {
            return Query.getHoldingAmounts(ChainId.ROPSTEN, USDC.address).then(data => {
                expect(data).toEqual('1')
            })
        })
    })
})