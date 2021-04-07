import Admin from '@marginswap/core-abi/artifacts/contracts/Admin.sol/Admin.json';
import LiquidityMiningReward from '@marginswap/core-abi/artifacts/contracts/LiquidityMiningReward.sol/LiquidityMiningReward.json';
import { Contract } from '@ethersproject/contracts';
import { getAddresses } from '../addresses';
import { Provider, TransactionReceipt } from '@ethersproject/providers';
import * as _ from 'lodash';
import { BigNumber } from '@ethersproject/bignumber';
import { Signer } from '@ethersproject/abstract-signer';

async function getLiquidityMiningReward(provider: Provider): Promise<Contract> {
  return new Contract((await getAddresses(provider)).LiquidityMiningReward, LiquidityMiningReward.abi, provider);
}

async function getAdmin(provider: Provider): Promise<Contract> {
  return new Contract((await getAddresses(provider)).Admin, Admin.abi, provider);
}

export async function getLiquidityStakeAmount(traderAdress: string, provider: Provider): Promise<BigNumber> {
  const liquidityMiningReward = await getLiquidityMiningReward(provider);
  return liquidityMiningReward.stakeAmounts(traderAdress);
}

export async function getMFIStakeAmount(traderAdress: string, provider: Provider): Promise<BigNumber> {
  const admin = await getAdmin(provider);
  return admin.stakes(traderAdress);
}

// TODO what type do these actions return? TransactionReceipt?
export async function depositLiquidityStake(
  amount: number,
  signer: Signer,
  provider: Provider
): Promise<TransactionReceipt> {
  const stakingContractWithSigner = (await getLiquidityMiningReward(provider)).connect(signer);
  return stakingContractWithSigner.depositStake(amount);
}

export async function withdrawLiquidityStake(
  amount: number,
  signer: Signer,
  provider: Provider
): Promise<TransactionReceipt> {
  const stakingContractWithSigner = (await getLiquidityMiningReward(provider)).connect(signer);
  return await stakingContractWithSigner.withdrawStake(amount);
}

export async function depositAdminStake(
  amount: number,
  signer: Signer,
  provider: Provider
): Promise<TransactionReceipt> {
  const stakingContractWithSigner = (await getAdmin(provider)).connect(signer);
  return await stakingContractWithSigner.depositStake(amount);
}

export async function withdrawAdminStake(
  amount: number,
  signer: Signer,
  provider: Provider
): Promise<TransactionReceipt> {
  const stakingContractWithSigner = (await getAdmin(provider)).connect(signer);
  return await stakingContractWithSigner.withdrawStake(amount);
}
