import JSBI from 'jsbi';

// exports for external consumption
export type BigintIsh = JSBI | bigint | string;

export enum ChainId {
  MAINNET = 1,
  ROPSTEN = 3,
  RINKEBY = 4,
  GÖRLI = 5,
  KOVAN = 42,
  FUJI = 43113,
  MATIC = 137,
  XDAI = 100,
  HECO = 128,
  HARMONY = 1666600000,
  FANTOM = 250,
  BSC = 56,
  AVALANCHE = 43114,
  LOCAL = 31337
}

export enum TradeType {
  EXACT_INPUT,
  EXACT_OUTPUT
}

export enum LeverageType {
  SPOT,
  CROSS_MARGIN,
  ISOLATED_MARGIN
}

export enum Rounding {
  ROUND_DOWN,
  ROUND_HALF_UP,
  ROUND_UP
}

export enum AMMs {
  UNI,
  SUSHI,
  PANGOLIN,
  BAGUETTE,
  SUSHI_ALT,
  QUICKSWAP
}

export const ammsPerChain = {
  [ChainId.MAINNET]: [AMMs.UNI, AMMs.SUSHI],
  [ChainId.KOVAN]: [AMMs.UNI, AMMs.SUSHI],
  [ChainId.LOCAL]: [AMMs.UNI, AMMs.SUSHI],
  [ChainId.AVALANCHE]: [AMMs.PANGOLIN, AMMs.SUSHI_ALT],
  [ChainId.FUJI]: [AMMs.PANGOLIN, AMMs.BAGUETTE],
  [ChainId.ROPSTEN]: [AMMs.UNI, AMMs.SUSHI],
  [ChainId.RINKEBY]: [AMMs.UNI, AMMs.SUSHI],
  [ChainId.GÖRLI]: [AMMs.UNI, AMMs.SUSHI],
  [ChainId.MATIC]: [AMMs.QUICKSWAP, AMMs.SUSHI_ALT]
};

export const ammOrder: Record<AMMs, number> = {
  [AMMs.UNI]: 0,
  [AMMs.SUSHI]: 1,
  [AMMs.PANGOLIN]: 0,
  [AMMs.SUSHI_ALT]: 1,
  [AMMs.BAGUETTE]: 2,
  [AMMs.QUICKSWAP]: 0
};

export const factoryAddresses: Record<AMMs, string> = {
  [AMMs.UNI]: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
  [AMMs.SUSHI]: '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac',
  [AMMs.PANGOLIN]: '0xefa94DE7a4656D787667C749f7E1223D71E9FD88',
  [AMMs.BAGUETTE]: '0xBB6e8C136ca537874a6808dBFC5DaebEd9a57554',
  [AMMs.SUSHI_ALT]: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4',
  [AMMs.QUICKSWAP]: '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32'
};

export const amms: Record<string, AMMs> = {
  [factoryAddresses[AMMs.UNI]]: AMMs.UNI,
  [factoryAddresses[AMMs.SUSHI]]: AMMs.SUSHI,
  [factoryAddresses[AMMs.PANGOLIN]]: AMMs.PANGOLIN,
  [factoryAddresses[AMMs.BAGUETTE]]: AMMs.BAGUETTE,
  [factoryAddresses[AMMs.SUSHI_ALT]]: AMMs.SUSHI_ALT
};

export const initCodeHashes: Record<string, string> = {
  [factoryAddresses[AMMs.UNI]]: '0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f',
  [factoryAddresses[AMMs.SUSHI]]: '0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303',
  [factoryAddresses[AMMs.PANGOLIN]]: '0x40231f6b438bce0797c9ada29b718a87ea0a5cea3fe9a771abdd76bd41a3e545',
  [factoryAddresses[AMMs.BAGUETTE]]: '0x81dbf51ab39dc634785936a3b34def28bf8007e6dfa30d4284c4b8547cb47a51',
  [factoryAddresses[AMMs.SUSHI_ALT]]: '0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303',
  [factoryAddresses[AMMs.QUICKSWAP]]: '0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f'
};

export const MINIMUM_LIQUIDITY = JSBI.BigInt(1000);

// exports for internal consumption
export const ZERO = JSBI.BigInt(0);
export const ONE = JSBI.BigInt(1);
export const TWO = JSBI.BigInt(2);
export const THREE = JSBI.BigInt(3);
export const FIVE = JSBI.BigInt(5);
export const TEN = JSBI.BigInt(10);
export const _100 = JSBI.BigInt(100);
export const _997 = JSBI.BigInt(997);
export const _1000 = JSBI.BigInt(1000);

export enum SolidityType {
  uint8 = 'uint8',
  uint256 = 'uint256'
}

export const SOLIDITY_TYPE_MAXIMA = {
  [SolidityType.uint8]: JSBI.BigInt('0xff'),
  [SolidityType.uint256]: JSBI.BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
};
