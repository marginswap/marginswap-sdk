import IncentiveDistribution from '@marginswap/core-abi/artifacts/contracts/IncentiveDistribution.sol/IncentiveDistribution.json';
import { Contract } from '@ethersproject/contracts';

import { getAddresses } from 'addresses';
import { Provider } from '@ethersproject/abstract-provider';

async function getIncentiveDistro(provider: Provider): Promise<Contract> {
  return new Contract((await getAddresses(provider)).IncentiveDistribution, IncentiveDistribution.abi, provider);
}

// this should be MFI per day / per amount staked
export async function getDailyRewardRate(tranche: number, provider: Provider): Promise<number> {
  const incentiveDistribution = await getIncentiveDistro(provider);
  const rewardRate =
    (await incentiveDistribution.trancheMetadata(tranche)).yesterdayRewardRateFP.mul(24 * 60 * 60).toNumber() / 2 ** 32;
  return rewardRate;
}
