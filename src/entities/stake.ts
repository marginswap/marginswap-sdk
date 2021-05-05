import { Contract } from '@ethersproject/contracts';
import { getAddresses } from 'addresses';
import { ChainId } from '../constants';
import MFIStaking from '@marginswap/core-abi/artifacts/contracts/MFIStaking.sol/MFIStaking.json';
import LiquidityMiningReward from '@marginswap/core-abi/artifacts/contracts/LiquidityMiningReward.sol/LiquidityMiningReward.json';
import { Provider, TransactionReceipt } from '@ethersproject/abstract-provider';
import { TokenAmount } from './fractions';
import { BigNumber } from '@ethersproject/bignumber';

export enum Duration {
  ONE_WEEK,
  ONE_MONTH,
  THREE_MONTHS
}

const durations: Record<Duration, number> = {
  [Duration.ONE_WEEK]: 60 * 24 * 7,
  [Duration.ONE_MONTH]: 60 * 24 * 30,
  [Duration.THREE_MONTHS]: 60 * 24 * 90
};

export function getMFIStaking(chainId: ChainId, provider: Provider): Contract {
  const address = getAddresses(chainId).MFIStaking;
  return new Contract(address, MFIStaking.abi, provider);
}

export function getLiquidityMiningReward(chainId: ChainId, provider: Provider): Contract {
  const address = getAddresses(chainId).LiquidityMiningReward;
  return new Contract(address, LiquidityMiningReward.abi, provider);
}

export async function stake(
  stakingContract: Contract,
  amount: TokenAmount,
  duration: Duration
): Promise<TransactionReceipt> {
  return stakingContract.stake(amount.toExact(), durations[duration].toString());
}

export async function withdrawStake(stakingContract: Contract, amount: TokenAmount): Promise<TransactionReceipt> {
  return stakingContract.withdrawStake(amount.toExact());
}

export async function canWithdraw(stakingContract: Contract, address: string): Promise<boolean> {
  const stakeAccount = await stakingContract.stakeAccounts(address);

  const currentTime = Math.floor(Date.now() / 1000);
  return currentTime >= stakeAccount.lockEnd && (await accruedReward(stakingContract, address)).gt(0);
}

export async function accruedReward(stakingContract: Contract, address: string): Promise<BigNumber> {
  return stakingContract.viewRewardAmount(address);
}

export async function withdrawReward(stakingContract: Contract): Promise<TransactionReceipt> {
  return stakingContract.withdrawReward();
}
