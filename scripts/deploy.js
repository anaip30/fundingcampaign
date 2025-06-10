const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployam ugovor s računa:", deployer.address);

  const Crowdfunding = await hre.ethers.getContractFactory("Crowdfunding");
  const contract = await Crowdfunding.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log("Crowdfunding deployan na adresi:", address);

  const config = { address };
  const filePath = path.join(__dirname, "..", "frontend", "public", "contractAddress.json");
  fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
  console.log("Adresa ugovora zapisana u:", filePath);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });

  