const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  const ERC20 = await hre.ethers.getContractFactory("ERC20Mock");
  const tokenA = await ERC20.deploy("Token A", "TKNA", hre.ethers.utils.parseUnits("10000", 18));
  const tokenB = await ERC20.deploy("Token B", "TKNB", hre.ethers.utils.parseUnits("10000", 18));
  await tokenA.deployed();
  await tokenB.deployed();

  const SimpleSwap = await hre.ethers.getContractFactory("SimpleSwap");
  const simpleSwap = await SimpleSwap.deploy(tokenA.address, tokenB.address);
  await simpleSwap.deployed();

  console.log("Token A deployed to:", tokenA.address);
  console.log("Token B deployed to:", tokenB.address);
  console.log("SimpleSwap deployed to:", simpleSwap.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
