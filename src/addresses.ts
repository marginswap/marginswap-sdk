// eslint-disable-next-line @typescript-eslint/no-explicit-any
let addresses: any;

if (process.env.LOCAL_ADDRESSES === 'true') {
  addresses = require('./abis/addresses-local.json');
} else {
  addresses = require('@marginswap/core-abi/addresses.json');
}

export default addresses;
