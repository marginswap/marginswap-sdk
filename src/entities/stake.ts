import { Contract } from '@ethersproject/contracts';
import { getAddresses } from '../addresses';
import { ChainId } from '../constants';
import Staking from '@marginswap/core-abi/artifacts/contracts/Staking.sol/Staking.json';
import MFIStaking from '@marginswap/core-abi/artifacts/contracts/MFIStaking.sol/MFIStaking.json';
import LiquidityMiningReward from '@marginswap/core-abi/artifacts/contracts/LiquidityMiningReward.sol/LiquidityMiningReward.json';
import { Provider, TransactionReceipt } from '@ethersproject/abstract-provider';
import { BigNumber } from '@ethersproject/bignumber';
import UniswapV2Pair from '@uniswap/v2-core/build/UniswapV2Pair.json';

const LIQUIDITY_TOKEN = '0x9d640080af7c81911d87632a7d09cc4ab6b133ac';

export function getMFIStaking(chainId: ChainId | undefined, provider: Provider | undefined): Contract | undefined {
  if (!chainId || !provider) return undefined;

  const address = getAddresses(chainId).Staking;
  return new Contract(address, Staking.abi, provider);
}

export function getLegacyStaking(chainId: ChainId | undefined, provider: Provider | undefined): Contract | undefined {
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

export async function isMigrated(
  stakingContract: Contract,
  chainId: ChainId,
  provider: Provider,
  address: string
): Promise<boolean> {
  const legacy = await getLegacyStaking(chainId, provider);
  const account = await legacy!.stakeAccounts(address);

  const balance = account.stakeAmount;

  return (await stakingContract.migrated(address)) && balance.gt(`1${'0'.repeat(18)}`);
}

export async function stake(stakingContract: Contract, amount: string): Promise<TransactionReceipt> {
  return stakingContract.stake(amount);
}

export async function withdrawStake(stakingContract: Contract, amount: string): Promise<TransactionReceipt> {
  return stakingContract.withdrawStake(amount);
}

export async function exitLegacyStake(legacyStaking: Contract, address: string): Promise<TransactionReceipt> {
  const stakeAccount = await legacyStaking.stakeAccounts(address);
  return legacyStaking.withdrawStake(stakeAccount.stakeAmount);
}

export async function canWithdraw(stakingContract: Contract, address: string): Promise<boolean> {
  const lockEnd =
    (await stakingContract.stakeStart(address)).toNumber() + (await stakingContract.lockTime()).toNumber();

  const currentTime = Math.floor(Date.now() / 1000);
  return currentTime >= lockEnd;
}

export async function accruedReward(
  stakingContract: Contract | undefined,
  legacy: Contract | undefined,
  address: string | undefined
): Promise<BigNumber | undefined> {
  if (!stakingContract || !address) return undefined;
  let reward = await stakingContract.viewRewardAmount(address);
  if (legacy) {
    const totalReward = await legacy.viewUpdatedCumulativeReward();
    const account = await stakingContract.legacyStakeAccounts(address);
    reward = reward.add(totalReward.sub(account.cumulativeStart).mul(account.stakeWeight).div((await stakingContract.startingWeights()).add(1)));
  }
  return reward;
}

export async function withdrawReward(stakingContract: Contract): Promise<TransactionReceipt> {
  return stakingContract.withdrawReward();
}

export async function getLiquidityAPRPerWeight(
  lmr: Contract | undefined,
  provider: Provider | undefined
): Promise<number | undefined> {
  if (!lmr || !provider) return undefined;

  const uniswapPair = new Contract(LIQUIDITY_TOKEN, UniswapV2Pair.abi, provider);
  const MFIReserve = (await uniswapPair.getReserves())[1];

  const totalSupply = await uniswapPair.totalSupply();
  const totalReserveInMFI = MFIReserve.mul(2);

  const rewardRate = await lmr.rewardRate();
  const totalWeight = await lmr.totalSupply();

  const rewardPerMFIStakedPerYear = rewardRate
    .mul(10000 * 365 * 24 * 60 * 60)
    .div(totalReserveInMFI.mul(totalWeight).div(totalSupply.add(1)).add(1));

  return rewardPerMFIStakedPerYear.toNumber() / (10000 / 100);
}

export async function getMFIAPRPerWeight(stakingContract: Contract | undefined): Promise<number | undefined> {
  if (!stakingContract) return undefined;

  const rewardRate = await stakingContract.rewardRate();
  const totalWeight = await stakingContract.totalSupply();

  return (
    rewardRate
      .mul(10000 * 367 * 24 * 60 * 60)
      .div(totalWeight.add(1))
      .toNumber() /
    (10000 / 100)
  );
}

export async function getTimeUntilLockEnd(
  stakingContract: Contract | undefined,
  address: string | undefined
): Promise<number | undefined> {
  if (!stakingContract || !address) return undefined;
  const lockEnd =
    (await stakingContract.stakeStart(address)).toNumber() + (await stakingContract.lockTime()).toNumber();
  const currentTime = Math.floor(Date.now() / 1000);
  return Math.max(0, lockEnd - currentTime);
}

export async function getStakedBalance(
  stakingContract: Contract | undefined,
  address: string | undefined
): Promise<BigNumber | undefined> {
  if (!stakingContract || !address) return undefined;
  return await stakingContract.balanceOf(address);
}
