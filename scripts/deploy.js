const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with:", deployer.address);

  const SimpleSwap = await hre.ethers.getContractFactory("SimpleSwap");
  const simpleSwap = await SimpleSwap.deploy(
    "0x03c4dac47eec187c5dc2b333c0743c6ef8a84afa", // Reemplaza con la dirección real
    "0x1e44dfac24406060acb91b6650768bfb577f7bd2"  // Reemplaza con la dirección real
  );

  await simpleSwap.waitForDeployment();
  console.log("SimpleSwap deployed to:", await simpleSwap.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});