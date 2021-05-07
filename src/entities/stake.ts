import { Contract } from '@ethersproject/contracts';
import { getAddresses } from 'addresses';
import { ChainId } from '../constants';
import MFIStaking from '@marginswap/core-abi/artifacts/contracts/MFIStaking.sol/MFIStaking.json';
import LiquidityMiningReward from '@marginswap/core-abi/artifacts/contracts/LiquidityMiningReward.sol/LiquidityMiningReward.json';
import { Provider, TransactionReceipt } from '@ethersproject/abstract-provider';
import { TokenAmount } from './fractions';
import { BigNumber } from '@ethersproject/bignumber';
import UniswapV2Pair from '@uniswap/v2-core/build/UniswapV2Pair.json';

const LIQUIDITY_TOKEN = '0x9d640080af7c81911d87632a7d09cc4ab6b133ac';
const STAKING_CONTRACT = '0xEfa8122994c742566DB4478d25aD1eC3DF07f477';

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

export async function getLiquidityAPRPerWeight(lmr: Contract, provider: Provider): Promise<number> {
  const uniswapPair = new Contract(LIQUIDITY_TOKEN, UniswapV2Pair.abi, provider);
  const MFIReserve = (await uniswapPair.getReserves())[1];

  const totalSupply = await uniswapPair.totalSupply();
  const totalReserveInMFI = MFIReserve.mul(2);

  const rewardRate = await lmr.totalCurrentRewardPerBlock();
  const totalWeight = await lmr.totalCurrentWeights();

  const rewardPerMFIStakedPerYear = rewardRate
    .mul(10000 * 365 * 24 * 60 * 4)
    .div(totalReserveInMFI.mul(totalWeight).div(totalSupply));

  return rewardPerMFIStakedPerYear.toNumber() / (10000 / 100);
}

export async function getMFIAPRPerWeight(stakingContract: Contract, provider: Provider): Promise<number> {
  const rewardRate = await stakingContract.totalCurrentRewardPerBlock();
  const totalWeight = await stakingContract.totalCurrentWeights();

  return (
    rewardRate
      .mul(10000 * 367 * 24 * 60 * 4)
      .div(totalWeight)
      .toNumber() /
    (10000 / 100)
  );
}

export async function getTimeUntilLockEnd(stakingContract: Contract, address: string): Promise<number> {
  const lockEnd = (await stakingContract.stakeAccounts(address)).lockEnd.toNumber();
  const currentTime = Math.floor(Date.now() / 1000);
  return Math.max(0, lockEnd - currentTime);
}
