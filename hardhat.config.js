require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.17",
  networks: {
    hardhat: {
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 20
      }
    }
  }
};