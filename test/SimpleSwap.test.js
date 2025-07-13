const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleSwap", function () {
  let tokenA, tokenB, simpleSwap;
  let owner, addr1, addr2;
  const initialSupply = ethers.parseEther("10000");

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
    tokenA = await ERC20Mock.deploy("Token A", "TKA", initialSupply);
    tokenB = await ERC20Mock.deploy("Token B", "TKB", initialSupply);
    await tokenA.waitForDeployment();
    await tokenB.waitForDeployment();

    const SimpleSwap = await ethers.getContractFactory("SimpleSwap");
    simpleSwap = await SimpleSwap.deploy(tokenA.target, tokenB.target);
    await simpleSwap.waitForDeployment();

    await tokenA.approve(simpleSwap.target, initialSupply);
    await tokenB.approve(simpleSwap.target, initialSupply);
  });

  describe("addLiquidity", function () {
    it("should add initial liquidity correctly", async function () {
      const amountA = ethers.parseEther("1000");
      const amountB = ethers.parseEther("2000");
      const deadline = Math.floor(Date.now() / 1000) + 60;

      await simpleSwap.addLiquidity(
        tokenA.target,
        tokenB.target,
        amountA,
        amountB,
        amountA,
        amountB,
        owner.address,
        deadline
      );

      expect(await tokenA.balanceOf(simpleSwap.target)).to.equal(amountA);
      expect(await tokenB.balanceOf(simpleSwap.target)).to.equal(amountB);
      expect(await simpleSwap.totalLiquidity()).to.be.gt(0);
    });

    it("should fail if deadline is reached", async function () {
      const amountA = ethers.parseEther("1000");
      const amountB = ethers.parseEther("2000");
      const pastDeadline = Math.floor(Date.now() / 1000) - 3600;

      await expect(
        simpleSwap.addLiquidity(
          tokenA.target,
          tokenB.target,
          amountA,
          amountB,
          amountA,
          amountB,
          owner.address,
          pastDeadline
        )
      ).to.be.revertedWith("Deadline reached");
    });

    it("should fail if minimum amounts not met", async function () {
      const amountA = ethers.parseEther("1000");
      const amountB = ethers.parseEther("2000");
      const amountAMin = ethers.parseEther("2000"); // Mayor que amountA
      const deadline = Math.floor(Date.now() / 1000) + 60;

      await expect(
        simpleSwap.addLiquidity(
          tokenA.target,
          tokenB.target,
          amountA,
          amountB,
          amountAMin,
          amountB,
          owner.address,
          deadline
        )
      ).to.be.revertedWith("Minimum amounts not met");
    });

    it("should add additional liquidity respecting ratio", async function () {
      const amountA = ethers.parseEther("1000");
      const amountB = ethers.parseEther("2000");
      const deadline = Math.floor(Date.now() / 1000) + 60;

      await simpleSwap.addLiquidity(
        tokenA.target,
        tokenB.target,
        amountA,
        amountB,
        0,
        0,
        owner.address,
        deadline
      );

      const amountA2 = ethers.parseEther("500");
      const amountB2 = ethers.parseEther("1000"); // Mantiene proporción 1:2
      await simpleSwap.addLiquidity(
        tokenA.target,
        tokenB.target,
        amountA2,
        amountB2,
        0,
        0,
        owner.address,
        deadline
      );

      expect(await tokenA.balanceOf(simpleSwap.target)).to.equal(amountA + amountA2);
      expect(await tokenB.balanceOf(simpleSwap.target)).to.equal(amountB + amountB2);
    });
  });

  describe("removeLiquidity", function () {
    it("should remove liquidity correctly", async function () {
      const amountA = ethers.parseEther("1000");
      const amountB = ethers.parseEther("2000");
      const deadline = Math.floor(Date.now() / 1000) + 60;

      await simpleSwap.addLiquidity(
        tokenA.target,
        tokenB.target,
        amountA,
        amountB,
        0,
        0,
        owner.address,
        deadline
      );

      const liquidity = await simpleSwap.totalLiquidity();
      const initialBalanceA = await tokenA.balanceOf(owner.address);
      const initialBalanceB = await tokenB.balanceOf(owner.address);

      await simpleSwap.removeLiquidity(
        tokenA.target,
        tokenB.target,
        liquidity,
        0,
        0,
        owner.address,
        deadline
      );

      expect(await simpleSwap.totalLiquidity()).to.equal(0);
      expect(await tokenA.balanceOf(owner.address)).to.equal(initialBalanceA + amountA);
      expect(await tokenB.balanceOf(owner.address)).to.equal(initialBalanceB + amountB);
    });

    it("should fail if insufficient liquidity", async function () {
      const amountA = ethers.parseEther("1000");
      const amountB = ethers.parseEther("2000");
      const deadline = Math.floor(Date.now() / 1000) + 60;

      await simpleSwap.addLiquidity(
        tokenA.target,
        tokenB.target,
        amountA,
        amountB,
        0,
        0,
        owner.address,
        deadline
      );

      const liquidity = (await simpleSwap.totalLiquidity()) * 2n; // Más de lo disponible

      await expect(
        simpleSwap.removeLiquidity(
          tokenA.target,
          tokenB.target,
          liquidity,
          0,
          0,
          owner.address,
          deadline
        )
      ).to.be.revertedWith("Insufficient liquidity");
    });
  });

  describe("swapExactTokensForTokens", function () {
    it("should swap tokens correctly", async function () {
      const amountA = ethers.parseEther("1000");
      const amountB = ethers.parseEther("1000");
      const deadline = Math.floor(Date.now() / 1000) + 60;

      await simpleSwap.addLiquidity(
        tokenA.target,
        tokenB.target,
        amountA,
        amountB,
        0,
        0,
        owner.address,
        deadline
      );

      const swapAmount = ethers.parseEther("100");
      await tokenA.transfer(addr1.address, swapAmount);
      await tokenA.connect(addr1).approve(simpleSwap.target, swapAmount);

      const path = [tokenA.target, tokenB.target];
      const initialBalanceB = await tokenB.balanceOf(addr1.address);

      await simpleSwap.connect(addr1).swapExactTokensForTokens(
        swapAmount,
        0,
        path,
        addr1.address,
        deadline
      );

      const balanceB = await tokenB.balanceOf(addr1.address);
      expect(balanceB).to.be.gt(initialBalanceB);
    });

    it("should fail if path is invalid", async function () {
      const swapAmount = ethers.parseEther("10");
      const deadline = Math.floor(Date.now() / 1000) + 60;

      await expect(
        simpleSwap.swapExactTokensForTokens(
          swapAmount,
          0,
          [tokenB.target, tokenA.target], // Camino inverso
          owner.address,
          deadline
        )
      ).to.be.revertedWith("Invalid token path");
    });

    it("should fail if deadline is reached", async function () {
      const amountA = ethers.parseEther("1000");
      const amountB = ethers.parseEther("1000");
      const deadline = Math.floor(Date.now() / 1000) + 60;
      const pastDeadline = Math.floor(Date.now() / 1000) - 3600;

      await simpleSwap.addLiquidity(
        tokenA.target,
        tokenB.target,
        amountA,
        amountB,
        0,
        0,
        owner.address,
        deadline
      );

      const swapAmount = ethers.parseEther("100");
      await tokenA.transfer(addr1.address, swapAmount);
      await tokenA.connect(addr1).approve(simpleSwap.target, swapAmount);

      const path = [tokenA.target, tokenB.target];

      await expect(
        simpleSwap.connect(addr1).swapExactTokensForTokens(
          swapAmount,
          0,
          path,
          addr1.address,
          pastDeadline
        )
      ).to.be.revertedWith("Deadline reached");
    });
  });

  describe("getPrice and getAmountOut", function () {
    it("should return correct price", async function () {
      const amountA = ethers.parseEther("1000");
      const amountB = ethers.parseEther("2000");
      const deadline = Math.floor(Date.now() / 1000) + 60;

      await simpleSwap.addLiquidity(
        tokenA.target,
        tokenB.target,
        amountA,
        amountB,
        0,
        0,
        owner.address,
        deadline
      );

      const price = await simpleSwap.getPrice(tokenA.target, tokenB.target);
      expect(price).to.equal(amountB / amountA); // Proporción 2:1
    });

    it("should return correct amount out", async function () {
      const amountA = ethers.parseEther("1000");
      const amountB = ethers.parseEther("2000");
      const inputAmount = ethers.parseEther("10");

      await simpleSwap.addLiquidity(
        tokenA.target,
        tokenB.target,
        amountA,
        amountB,
        0,
        0,
        owner.address,
        Math.floor(Date.now() / 1000) + 60
      );

      const output = await simpleSwap.getAmountOut(
        inputAmount,
        amountA,
        amountB
      );
      expect(output).to.be.gt(0);
    });

    it("should fail getPrice with insufficient liquidity", async function () {
      await expect(
        simpleSwap.getPrice(tokenA.target, tokenB.target)
      ).to.be.revertedWith("Insufficient liquidity");
    });
  });

  describe("ERC20Mock", function () {
    it("should transfer tokens correctly", async function () {
      const amount = ethers.parseEther("100");
      const initialBalance = await tokenA.balanceOf(owner.address);
      await tokenA.transfer(addr1.address, amount);
      expect(await tokenA.balanceOf(addr1.address)).to.equal(amount);
      expect(await tokenA.balanceOf(owner.address)).to.equal(initialBalance - amount);
    });

    it("should approve and check allowance", async function () {
      const amount = ethers.parseEther("100");
      await tokenA.approve(addr1.address, amount);
      expect(await tokenA.allowance(owner.address, addr1.address)).to.equal(amount);
    });
  });

describe("Additional edge cases", function () {
  it("should fail addLiquidity with invalid to address", async function () {
    const amountA = ethers.parseEther("1000");
    const amountB = ethers.parseEther("2000");
    const deadline = Math.floor(Date.now() / 1000) + 60;

    await expect(
      simpleSwap.addLiquidity(
        tokenA.target,
        tokenB.target,
        amountA,
        amountB,
        0,
        0,
        ethers.ZeroAddress, // Dirección inválida
        deadline
      )
    ).to.be.revertedWith("Invalid to address");
  });

  it("should fail swap with insufficient liquidity", async function () {
    const swapAmount = ethers.parseEther("100");
    const path = [tokenA.target, tokenB.target];
    const deadline = Math.floor(Date.now() / 1000) + 60;

    await tokenA.transfer(addr1.address, swapAmount);
    await tokenA.connect(addr1).approve(simpleSwap.target, swapAmount);

    await expect(
      simpleSwap.connect(addr1).swapExactTokensForTokens(
        swapAmount,
        0,
        path,
        addr1.address,
        deadline
      )
    ).to.be.revertedWith("Insufficient liquidity");
  });

  it("should fail removeLiquidity with invalid token path", async function () {
    const amountA = ethers.parseEther("1000");
    const amountB = ethers.parseEther("2000");
    const deadline = Math.floor(Date.now() / 1000) + 60;

    await simpleSwap.addLiquidity(
      tokenA.target,
      tokenB.target,
      amountA,
      amountB,
      0,
      0,
      owner.address,
      deadline
    );

    const liquidity = await simpleSwap.totalLiquidity();

    await expect(
      simpleSwap.removeLiquidity(
        tokenB.target, // Orden incorrecto
        tokenA.target,
        liquidity,
        0,
        0,
        owner.address,
        deadline
      )
    ).to.be.revertedWith("Invalid token path");
  });
});

describe("ERC20Mock additional tests", function () {
  it("should allow transferFrom after approval", async function () {
    const amount = ethers.parseEther("100");
    await tokenA.approve(addr1.address, amount);
    await tokenA.connect(addr1).transferFrom(owner.address, addr2.address, amount);
    expect(await tokenA.balanceOf(addr2.address)).to.equal(amount);
    expect(await tokenA.balanceOf(owner.address)).to.equal(initialSupply - amount);
  });
});});