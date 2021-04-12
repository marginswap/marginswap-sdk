import { Provider } from '@ethersproject/providers';
import { Contract } from '@ethersproject/contracts';
import abi from '../abis/ERC20.json';

export const getIERC20Token = (address: string, provider: Provider): Contract => new Contract(address, abi, provider);
