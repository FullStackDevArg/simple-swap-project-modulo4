const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleSwap", function () {
  let SimpleSwap, simpleSwap, TokenA, TokenB, tokenA, tokenB, owner, user;
  const MINIMUM_LIQUIDITY = 1000;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    // Deploy ERC20 tokens
    const ERC20 = await ethers.getContractFactory("ERC20PresetMinterPauser");
    tokenA = await ERC20.deploy("Token A", "TKNA");
    tokenB = await ERC20.deploy("Token B", "TKNB");
    await tokenA.deployed();
    await tokenB.deployed();

    // Deploy SimpleSwap
    SimpleSwap = await ethers.getContractFactory("SimpleSwap");
    simpleSwap = await SimpleSwap.deploy(tokenA.address, tokenB.address);
    await simpleSwap.deployed();

    // Mint tokens and approve
    await tokenA.mint(user.address, ethers.utils.parseEther("10000"));
    await tokenB.mint(user.address, ethers.utils.parseEther("10000"));
    await tokenA.connect(user).approve(simpleSwap.address, ethers.constants.MaxUint256);
    await tokenB.connect(user).approve(simpleSwap.address, ethers.constants.MaxUint256);
  });

  describe("addLiquidity", function () {
    it("Should add initial liquidity correctly", async function () {
      const amountA = ethers.utils.parseEther("100");
      const amountB = ethers.utils.parseEther("200");
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      await expect(simpleSwap.connect(user).addLiquidity(
        tokenA.address,
        tokenB.address,
        amountA,
        amountB,
        0,
        0,
        user.address,
        deadline
      ))
        .to.emit(simpleSwap, "LiquidityAdded")
        .withArgs(user.address, amountA, amountB, amountA);

      expect(await simpleSwap.reserveA()).to.equal(amountA);
      expect(await simpleSwap.reserveB()).to.equal(amountB);
      expect(await simpleSwap.liquidityBalance(user.address)).to.equal(amountA);
    });

    it("Should add subsequent liquidity proportionally", async function () {
      await simpleSwap.connect(user).addLiquidity(
        tokenA.address,
        tokenB.address,
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("200"),
        0,
        0,
        user.address,
        Math.floor(Date.now() / 1000) + 3600
      );

      const amountA = ethers.utils.parseEther("50");
      const amountB = ethers.utils.parseEther("100"); // 100 = 50 * 200 / 100
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      await expect(simpleSwap.connect(user).addLiquidity(
        tokenA.address,
        tokenB.address,
        amountA,
        amountB,
        0,
        0,
        user.address,
        deadline
      ))
        .to.emit(simpleSwap, "LiquidityAdded")
        .withArgs(user.address, amountA, amountB, ethers.utils.parseEther("50"));

      expect(await simpleSwap.reserveA()).to.equal(ethers.utils.parseEther("150"));
      expect(await simpleSwap.reserveB()).to.equal(ethers.utils.parseEther("300"));
    });

    it("Should revert if deadline expired", async function () {
      await expect(simpleSwap.connect(user).addLiquidity(
        tokenA.address,
        tokenB.address,
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("200"),
        0,
        0,
        user.address,
        Math.floor(Date.now() / 1000) - 3600
      )).to.be.revertedWith("Deadline expired");
    });

    it("Should revert if amounts are zero", async function () {
      await expect(simpleSwap.connect(user).addLiquidity(
        tokenA.address,
        tokenB.address,
        0,
        ethers.utils.parseEther("200"),
        0,
        0,
        user.address,
        Math.floor(Date.now() / 1000) + 3600
      )).to.be.revertedWith("Invalid amounts");
    });

    it("Should revert if tokens are invalid", async function () {
      await expect(simpleSwap.connect(user).addLiquidity(
        ethers.constants.AddressZero,
        tokenB.address,
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("200"),
        0,
        0,
        user.address,
        Math.floor(Date.now() / 1000) + 3600
      )).to.be.revertedWith("Invalid tokens");
    });

    it("Should revert if recipient is zero address", async function () {
      await expect(simpleSwap.connect(user).addLiquidity(
        tokenA.address,
        tokenB.address,
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("200"),
        0,
        0,
        ethers.constants.AddressZero,
        Math.floor(Date.now() / 1000) + 3600
      )).to.be.revertedWith("Invalid recipient");
    });

    it("Should revert if liquidity minted is below minimum", async function () {
      await simpleSwap.connect(user).addLiquidity(
        tokenA.address,
        tokenB.address,
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("200"),
        0,
        0,
        user.address,
        Math.floor(Date.now() / 1000) + 3600
      );

      await expect(simpleSwap.connect(user).addLiquidity(
        tokenA.address,
        tokenB.address,
        ethers.utils.parseEther("0.0001"),
        ethers.utils.parseEther("0.0002"),
        0,
        0,
        user.address,
        Math.floor(Date.now() / 1000) + 3600
      )).to.be.revertedWith("Insufficient liquidity minted");
    });
  });

  describe("swap", function () {
    beforeEach(async function () {
      await simpleSwap.connect(user).addLiquidity(
        tokenA.address,
        tokenB.address,
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("200"),
        0,
        0,
        user.address,
        Math.floor(Date.now() / 1000) + 3600
      );
    });

    it("Should swap tokenA for tokenB correctly", async function () {
      const amountIn = ethers.utils.parseEther("10");
      const reserveOut = ethers.utils.parseEther("200");
      const reserveIn = ethers.utils.parseEther("100");
      const amountInWithFee = amountIn.mul(997);
      const expectedOut = reserveOut.mul(amountInWithFee).div(reserveIn.mul(1000).add(amountInWithFee));

      await expect(simpleSwap.connect(user).swap(tokenA.address, amountIn))
        .to.emit(simpleSwap, "Swap")
        .withArgs(user.address, tokenA.address, amountIn, expectedOut);

      expect(await simpleSwap.reserveA()).to.equal(reserveIn.add(amountIn));
      expect(await simpleSwap.reserveB()).to.equal(reserveOut.sub(expectedOut));
    });

    it("Should swap tokenB for tokenA correctly", async function () {
      const amountIn = ethers.utils.parseEther("20");
      const reserveOut = ethers.utils.parseEther("100");
      const reserveIn = ethers.utils.parseEther("200");
      const amountInWithFee = amountIn.mul(997);
      const expectedOut = reserveOut.mul(amountInWithFee).div(reserveIn.mul(1000).add(amountInWithFee));

      await expect(simpleSwap.connect(user).swap(tokenB.address, amountIn))
        .to.emit(simpleSwap, "Swap")
        .withArgs(user.address, tokenB.address, amountIn, expectedOut);

      expect(await simpleSwap.reserveB()).to.equal(reserveIn.add(amountIn));
      expect(await simpleSwap.reserveA()).to.equal(reserveOut.sub(expectedOut));
    });

    it("Should revert if amountIn is zero", async function () {
      await expect(simpleSwap.connect(user).swap(tokenA.address, 0))
        .to.be.revertedWith("Invalid input amount");
    });

    it("Should revert if tokenIn is invalid", async function () {
      await expect(simpleSwap.connect(user).swap(ethers.constants.AddressZero, ethers.utils.parseEther("10")))
        .to.be.revertedWith("Invalid token");
    });

    it("Should revert if output amount is zero", async function () {
      await simpleSwap.connect(user).addLiquidity(
        tokenA.address,
        tokenB.address,
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("0.0001"),
        0,
        0,
        user.address,
        Math.floor(Date.now() / 1000) + 3600
      );

      await expect(simpleSwap.connect(user).swap(tokenA.address, ethers.utils.parseEther("100")))
        .to.be.revertedWith("Insufficient output amount");
    });
  });

  describe("Price functions", function () {
    beforeEach(async function () {
      await simpleSwap.connect(user).addLiquidity(
        tokenA.address,
        tokenB.address,
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("200"),
        0,
        0,
        user.address,
        Math.floor(Date.now() / 1000) + 3600
      );
    });

    it("Should return correct price for tokenA to tokenB", async function () {
      const price = await simpleSwap.getPriceAtoB();
      expect(price).to.equal(ethers.utils.parseEther("2")); // 200 / 100 = 2
    });

    it("Should return correct price for tokenB to tokenA", async function () {
      const price = await simpleSwap.getPriceBtoA();
      expect(price).to.equal(ethers.utils.parseEther("0.5")); // 100 / 200 = 0.5
    });

    it("Should revert if no liquidity", async function () {
      const newSwap = await SimpleSwap.deploy(tokenA.address, tokenB.address);
      await newSwap.deployed();
      await expect(newSwap.getPriceAtoB()).to.be.revertedWith("No liquidity");
    });
  });
});
