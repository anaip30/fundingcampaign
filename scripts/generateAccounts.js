// scripts/generateAccounts.js
const fs = require("fs");
const path = require("path");
const hre = require("hardhat");
const { HDNode } = require("@ethersproject/hdnode");

async function main() {
  const mnemonic = hre.config.networks.hardhat.accounts.mnemonic;
  const master = HDNode.fromMnemonic(mnemonic);
  const accounts = [];

  for (let i = 0; i < 20; i++) {
    const node = master.derivePath(`m/44'/60'/0'/0/${i}`);
    accounts.push({
      index: i,
      address: node.address,
      privateKey: node.privateKey
    });
  }

  const out = path.join(__dirname, "../frontend/public/hardhatAccounts.json");
  fs.writeFileSync(out, JSON.stringify(accounts, null, 2));
  console.log(`Upisano ${accounts.length} računa u ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});