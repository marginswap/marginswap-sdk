# Marginswap SDK

To use this repo with its sister repositories, do the following.

```bash
cd ../marginswap-core
git clone git@github.com:marginswap/core-abi.git build/

# this overwrites your addresses file
npx hardhat node 

cd build
yarn link

cd ../../marginswap-sdk

yarn link @marginswap/core-abi
yarn build
yarn link

cd ../marginswap-interface
yarn link @marginswap/core-abi
yarn link @marginswap/sdk
```
