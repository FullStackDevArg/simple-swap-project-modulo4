const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleSwap", function () {
  let SimpleSwap, simpleSwap, owner, addr1, tokenA, tokenB;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("ERC20Mock");
    tokenA = await Token.deploy("Token A", "TA", ethers.parseEther("1000000"));
    tokenB = await Token.deploy("Token B", "TB", ethers.parseEther("1000000"));
    await tokenA.waitForDeployment();
    await tokenB.waitForDeployment();

    const SimpleSwap = await ethers.getContractFactory("SimpleSwap");
    simpleSwap = await SimpleSwap.deploy(await tokenA.getAddress(), await tokenB.getAddress());
    await simpleSwap.waitForDeployment();

    // Aprobar el contrato para gastar tokens
    await tokenA.approve(await simpleSwap.getAddress(), ethers.MaxUint256);
    await tokenB.approve(await simpleSwap.getAddress(), ethers.MaxUint256);
    await tokenA.connect(addr1).approve(await simpleSwap.getAddress(), ethers.MaxUint256);
    await tokenB.connect(addr1).approve(await simpleSwap.getAddress(), ethers.MaxUint256);
  });

  it("Should deploy with correct token addresses", async function () {
    expect(await simpleSwap.tokenA()).to.equal(await tokenA.getAddress());
    expect(await simpleSwap.tokenB()).to.equal(await tokenB.getAddress());
  });

  it("Should add liquidity successfully", async function () {
    const amountA = ethers.parseEther("1000");
    const amountB = ethers.parseEther("2000");
    const deadline = Math.floor(Date.now() / 1000) + 600;

    await tokenA.transfer(owner.address, amountA);
    await tokenB.transfer(owner.address, amountB);

    const tx = await simpleSwap.addLiquidity(
      await tokenA.getAddress(),
      await tokenB.getAddress(),
      amountA,
      amountB,
      0,
      0,
      owner.address,
      deadline
    );
    await tx.wait();

    expect(await simpleSwap.reserveA()).to.equal(amountA);
    expect(await simpleSwap.reserveB()).to.equal(amountB);
    expect(await simpleSwap.totalLiquidity()).to.be.above(0);
    expect(await simpleSwap.liquidity(owner.address)).to.be.above(0);
  });

  it("Should fail to add liquidity with invalid deadline", async function () {
    const amountA = ethers.parseEther("1000");
    const amountB = ethers.parseEther("2000");
    const deadline = Math.floor(Date.now() / 1000) - 60; // Deadline pasado

    await expect(
      simpleSwap.addLiquidity(
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        amountA,
        amountB,
        0,
        0,
        owner.address,
        deadline
      )
    ).to.be.revertedWith("Deadline reached");
  });

  it("Should remove liquidity successfully", async function () {
    const amountA = ethers.parseEther("1000");
    const amountB = ethers.parseEther("2000");
    const deadline = Math.floor(Date.now() / 1000) + 600;

    await tokenA.transfer(owner.address, amountA);
    await tokenB.transfer(owner.address, amountB);
    await simpleSwap.addLiquidity(
      await tokenA.getAddress(),
      await tokenB.getAddress(),
      amountA,
      amountB,
      0,
      0,
      owner.address,
      deadline
    );

    const liquidityAmount = await simpleSwap.liquidity(owner.address);
    const tx = await simpleSwap.removeLiquidity(
      await tokenA.getAddress(),
      await tokenB.getAddress(),
      liquidityAmount,
      0,
      0,
      owner.address,
      deadline
    );
    await tx.wait();

    expect(await simpleSwap.reserveA()).to.equal(0);
    expect(await simpleSwap.reserveB()).to.equal(0);
    expect(await simpleSwap.totalLiquidity()).to.equal(0);
  });

  it("Should fail to remove liquidity with insufficient balance", async function () {
    const deadline = Math.floor(Date.now() / 1000) + 600;
    await expect(
      simpleSwap.removeLiquidity(
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        ethers.parseEther("1"),
        0,
        0,
        owner.address,
        deadline
      )
    ).to.be.revertedWith("Insufficient liquidity");
  });

  it("Should swap tokens successfully", async function () {
    const amountA = ethers.parseEther("1000");
    const amountB = ethers.parseEther("2000");
    const deadline = Math.floor(Date.now() / 1000) + 600;

    await tokenA.transfer(owner.address, amountA);
    await tokenB.transfer(owner.address, amountB);
    await simpleSwap.addLiquidity(
      await tokenA.getAddress(),
      await tokenB.getAddress(),
      amountA,
      amountB,
      0,
      0,
      owner.address,
      deadline
    );

    const amountIn = ethers.parseEther("100");
    const initialBalance = await tokenB.balanceOf(owner.address);
    await simpleSwap.swapExactTokensForTokens(
      amountIn,
      0,
      [await tokenA.getAddress(), await tokenB.getAddress()],
      owner.address,
      deadline
    );

    const finalBalance = await tokenB.balanceOf(owner.address);
    expect(finalBalance).to.be.above(initialBalance);
  });

  it("Should get price correctly", async function () {
    const amountA = ethers.parseEther("1000");
    const amountB = ethers.parseEther("2000");
    const deadline = Math.floor(Date.now() / 1000) + 600;

    await tokenA.transfer(owner.address, amountA);
    await tokenB.transfer(owner.address, amountB);
    await simpleSwap.addLiquidity(
      await tokenA.getAddress(),
      await tokenB.getAddress(),
      amountA,
      amountB,
      0,
      0,
      owner.address,
      deadline
    );

    const price = await simpleSwap.getPrice(await tokenA.getAddress(), await tokenB.getAddress());
    expect(price).to.be.closeTo(ethers.parseEther("2"), ethers.parseEther("0.01")); // 2000/1000 = 2
  });
});