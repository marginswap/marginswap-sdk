import { Query } from '../src'
import { getDefaultProvider } from '@ethersproject/providers'

describe('Query', () => {
    const ADDRESS_ONE = '0x0000000000000000000000000000000000000001'

    // const USDC = new Token(ChainId.ROPSTEN, ADDRESS_ONE, 18, 'USDC', 'USD Coin')

    describe('#getHoldingAmounts', () => {
        it('returns empty holding amounts for nonexistent account', () => {
            const provider = getDefaultProvider("http://localhost");
            return Query.getHoldingAmounts(ADDRESS_ONE, -1, provider).then(data => {
                expect(data).toEqual([[], []]);
            });
        })
    })
})