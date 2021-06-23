import { Contract } from '@ethersproject/contracts';
import { getAddresses } from '../addresses';
import { ChainId } from '../constants';
import MFIStaking from '@marginswap/core-abi/artifacts/contracts/MFIStaking.sol/MFIStaking.json';
import LiquidityMiningReward from '@marginswap/core-abi/artifacts/contracts/LiquidityMiningReward.sol/LiquidityMiningReward.json';
import { Provider, TransactionReceipt } from '@ethersproject/abstract-provider';
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
  [Duration.ONE_WEEK]: 1,
  [Duration.ONE_MONTH]: 60,
  [Duration.THREE_MONTHS]: 180
  // [Duration.ONE_WEEK]: 60 * 24 * 7 + 1,
  // [Duration.ONE_MONTH]: 60 * 24 * 30 + 1,
  // [Duration.THREE_MONTHS]: 60 * 24 * 90 + 1
};

const durationFactor: Record<Duration, number> = {
  [Duration.ONE_WEEK]: 1,
  [Duration.ONE_MONTH]: 2,
  [Duration.THREE_MONTHS]: 3
};

export function getMFIStaking(chainId: ChainId | undefined, provider: Provider | undefined): Contract | undefined {
  if (!chainId || !provider) return undefined;

  const address = getAddresses(chainId).MFIStaking;
  return new Contract(address, MFIStaking.abi, provider);
}

export function getLiquidityMiningReward(
  chainId: ChainId | undefined,
  provider: Provider | undefined
): Contract | undefined {
  if (!chainId || !provider) return undefined;

  const address = getAddresses(chainId).LiquidityMiningReward;
  return new Contract(address, LiquidityMiningReward.abi, provider);
}

export async function stake(
  stakingContract: Contract,
  amount: string,
  duration: Duration
): Promise<TransactionReceipt> {
  const timeframe = durations[duration].toString();
  return stakingContract.stake(amount, timeframe);
}

export async function withdrawStake(stakingContract: Contract, amount: string): Promise<TransactionReceipt> {
  return stakingContract.withdrawStake(amount);
}

export async function canWithdraw(stakingContract: Contract, address: string): Promise<boolean> {
  const stakeAccount = await stakingContract.stakeAccounts(address);

  const currentTime = Math.floor(Date.now() / 1000);
  return currentTime >= stakeAccount.lockEnd && ((await accruedReward(stakingContract, address))?.gt(0) ?? false);
}

export async function accruedReward(
  stakingContract: Contract | undefined,
  address: string | undefined
): Promise<BigNumber | undefined> {
  if (!stakingContract || !address) return undefined;
  return stakingContract.viewRewardAmount(address);
}

export async function withdrawReward(stakingContract: Contract): Promise<TransactionReceipt> {
  return stakingContract.withdrawReward();
}

export async function getLiquidityAPRPerWeight(
  lmr: Contract | undefined,
  duration: Duration,
  provider: Provider | undefined
): Promise<number | undefined> {
  if (!lmr || !provider) return undefined;

  const uniswapPair = new Contract(LIQUIDITY_TOKEN, UniswapV2Pair.abi, provider);
  const MFIReserve = (await uniswapPair.getReserves())[1];

  const totalSupply = await uniswapPair.totalSupply();
  const totalReserveInMFI = MFIReserve.mul(2);

  const rewardRate = await lmr.totalCurrentRewardPerBlock();
  const totalWeight = await lmr.totalCurrentWeights();

  const rewardPerMFIStakedPerYear = rewardRate
    .mul(10000 * 365 * 24 * 60 * 4)
    .div(totalReserveInMFI.mul(totalWeight).div(totalSupply.add(1)).add(1));

  return (rewardPerMFIStakedPerYear.toNumber() * durationFactor[duration]) / (10000 / 100);
}

export async function getMFIAPRPerWeight(
  stakingContract: Contract | undefined,
  duration: Duration
): Promise<number | undefined> {
  if (!stakingContract) return undefined;

  const rewardRate = await stakingContract.totalCurrentRewardPerBlock();
  const totalWeight = await stakingContract.totalCurrentWeights();

  return (
    (rewardRate
      .mul(10000 * 367 * 24 * 60 * 4)
      .div(totalWeight.add(1))
      .toNumber() *
      durationFactor[duration]) /
    (10000 / 100)
  );
}

export async function getTimeUntilLockEnd(
  stakingContract: Contract | undefined,
  address: string | undefined
): Promise<number | undefined> {
  if (!stakingContract || !address) return undefined;
  const lockEnd = (await stakingContract.stakeAccounts(address)).lockEnd.toNumber();
  const currentTime = Math.floor(Date.now() / 1000);
  return Math.max(0, lockEnd - currentTime);
}

export async function getStakedBalance(
  stakingContract: Contract | undefined,
  address: string | undefined
): Promise<BigNumber | undefined> {
  if (!stakingContract || !address) return undefined;
  return (await stakingContract.stakeAccounts(address)).stakeAmount;
}
