import { Provider } from '@ethersproject/providers';
import { Contract } from '@ethersproject/contracts';
import abi from '../abis/ERC20.json';
import { BigNumber } from '@ethersproject/bignumber';

export const getIERC20Token = (address: string, provider: Provider): Contract => new Contract(address, abi, provider);

export const getTokenBalance = async (
  ownerAddress: string,
  tokenAddress: string,
  provider: Provider
): Promise<BigNumber> => {
  const token = getIERC20Token(tokenAddress, provider);
  return token.balanceOf(ownerAddress);
};
