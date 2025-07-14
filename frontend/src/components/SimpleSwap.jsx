import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import abi from '../abi/SimpleSwapABI.json';
import './SimpleSwap.css';

const contractAddress = '0x371992a4D1BaC196b85D1C45A2C77CA15e399eE6';
const tokenA = '0x03c4dac47eec187c5dc2b333c0743c6ef8a84afa';
const tokenB = '0x1e44dfac24406060acb91b6650768bfb577f7bd2';

const SimpleSwap = ({ account }) => {
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [liquidity, setLiquidity] = useState('');
  const [selectedSlide, setSelectedSlide] = useState(0);
  const [contract, setContract] = useState(null);

  useEffect(() => {
    const initContract = async () => {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const instance = new ethers.Contract(contractAddress, abi, signer);
        setContract(instance);
      } catch (error) {
        console.error('Error initializing contract:', error);
      }
    };

    initContract();
  }, []);

  const addLiquidity = async () => {
    if (!contract) return;
    try {
      const tx = await contract.addLiquidity(
        tokenA,
        tokenB,
        ethers.parseUnits(amountA, 18),
        ethers.parseUnits(amountB, 18),
        1,
        1,
        account,
        Math.floor(Date.now() / 1000) + 60
      );
      await tx.wait();
      alert('Liquidity added!');
    } catch (error) {
      console.error(error);
      alert('Add liquidity failed');
    }
  };

  const removeLiquidity = async () => {
    if (!contract) return;
    try {
      const tx = await contract.removeLiquidity(
        tokenA,
        tokenB,
        ethers.parseUnits(liquidity, 18),
        1,
        1,
        account,
        Math.floor(Date.now() / 1000) + 60
      );
      await tx.wait();
      alert('Liquidity removed!');
    } catch (error) {
      console.error(error);
      alert('Remove liquidity failed');
    }
  };

  const swapTokens = async () => {
    if (!contract) return;
    try {
      const tx = await contract.swapExactTokensForTokens(
        ethers.parseUnits(amountA, 18),
        1,
        [tokenA, tokenB],
        account,
        Math.floor(Date.now() / 1000) + 60
      );
      await tx.wait();
      alert('Swap successful!');
    } catch (error) {
      console.error(error);
      alert('Swap failed');
    }
  };

  const getPrice = async () => {
    if (!contract) return;
    try {
      const price = await contract.getPrice(tokenA, tokenB);
      alert(`Price: ${ethers.formatEther(price)}`);
    } catch (error) {
      console.error(error);
      alert('Error getting price');
    }
  };

  const slides = [
    {
      title: 'Add Liquidity',
      content: (
        <>
          <input
            placeholder="Amount A"
            value={amountA}
            onChange={(e) => setAmountA(e.target.value)}
          />
          <input
            placeholder="Amount B"
            value={amountB}
            onChange={(e) => setAmountB(e.target.value)}
          />
          <button onClick={addLiquidity}>Add</button>
        </>
      ),
    },
    {
      title: 'Remove Liquidity',
      content: (
        <>
          <input
            placeholder="Liquidity Amount"
            value={liquidity}
            onChange={(e) => setLiquidity(e.target.value)}
          />
          <button onClick={removeLiquidity}>Remove</button>
        </>
      ),
    },
    {
      title: 'Swap Tokens',
      content: (
        <>
          <input
            placeholder="Amount A"
            value={amountA}
            onChange={(e) => setAmountA(e.target.value)}
          />
          <button onClick={swapTokens}>Swap</button>
        </>
      ),
    },
    {
      title: 'Get Price',
      content: <button onClick={getPrice}>Fetch Price</button>,
    },
  ];

  return (
    <div className="carousel-container">
      <div className="carousel-buttons">
        {slides.map((slide, index) => (
          <button key={index} onClick={() => setSelectedSlide(index)}>
            {slide.title}
          </button>
        ))}
      </div>
      <div className="carousel-content">{slides[selectedSlide].content}</div>
    </div>
  );
};

export default SimpleSwap;
