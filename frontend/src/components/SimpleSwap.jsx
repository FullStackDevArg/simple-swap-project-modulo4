import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import abi from '../abi/SimpleSwapABI.json'; // Asegúrate de tener este ABI exportado correctamente
import './SimpleSwap.css';

const contractAddress = '0x371992a4D1BaC196b85D1C45A2C77CA15e399eE6'; // Reemplaza con tu dirección real del contrato
const tokenA = '0x03c4dac47eec187c5dc2b333c0743c6ef8a84afa'; // Reemplaza con la dirección real de tokenA
const tokenB = '0x1e44dfac24406060acb91b6650768bfb577f7bd2'; // Reemplaza con la dirección real de tokenB

const SimpleSwap = ({ account }) => {
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [liquidity, setLiquidity] = useState('');
  const [selectedSlide, setSelectedSlide] = useState(0);
  const [contract, setContract] = useState(null);

  useEffect(() => {
    const initContract = async () => {
      if (window.ethereum && account) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const contractInstance = new ethers.Contract(contractAddress, abi, signer);
          setContract(contractInstance);
        } catch (error) {
          console.error("Error initializing contract:", error);
        }
      }
    };
    initContract();
  }, [account]);

  const addLiquidity = async () => {
    if (!contract) return alert('Contract not initialized');
    try {
      const tx = await contract.addLiquidity(
        tokenA,
        tokenB,
        ethers.parseUnits(amountA || '0', 18),
        ethers.parseUnits(amountB || '0', 18),
        ethers.parseUnits((parseFloat(amountA || '0') * 0.9).toString(), 18), // Mínimo 90%
        ethers.parseUnits((parseFloat(amountB || '0') * 0.9).toString(), 18), // Mínimo 90%
        account,
        Math.floor(Date.now() / 1000) + 600 // 10 minutos de deadline
      );
      await tx.wait();
      alert('Liquidity added!');
    } catch (error) {
      console.error("Add liquidity error:", error);
      alert('Add liquidity failed: ' + (error.message || error));
    }
  };

  const removeLiquidity = async () => {
    if (!contract) return alert('Contract not initialized');
    try {
      const tx = await contract.removeLiquidity(
        tokenA,
        tokenB,
        ethers.parseUnits(liquidity || '0', 18),
        ethers.parseUnits((parseFloat(liquidity || '0') * 0.9).toString(), 18), // Mínimo 90%
        ethers.parseUnits('0', 18), // Mínimo 0 (ajusta según necesidad)
        account,
        Math.floor(Date.now() / 1000) + 600
      );
      await tx.wait();
      alert('Liquidity removed!');
    } catch (error) {
      console.error("Remove liquidity error:", error);
      alert('Remove liquidity failed: ' + (error.message || error));
    }
  };

  const swapTokens = async () => {
    if (!contract) return alert('Contract not initialized');
    try {
      const tx = await contract.swapExactTokensForTokens(
        ethers.parseUnits(amountA || '0', 18),
        ethers.parseUnits((parseFloat(amountA || '0') * 0.9).toString(), 18), // Mínimo 90%
        [tokenA, tokenB],
        account,
        Math.floor(Date.now() / 1000) + 600
      );
      await tx.wait();
      alert('Swap successful!');
    } catch (error) {
      console.error("Swap error:", error);
      alert('Swap failed: ' + (error.message || error));
    }
  };

  const getPrice = async () => {
    if (!contract) return alert('Contract not initialized');
    try {
      const price = await contract.getPrice(tokenA, tokenB);
      alert(`Price: ${ethers.formatEther(price)}`);
    } catch (error) {
      console.error("Get price error:", error);
      alert('Error getting price: ' + (error.message || error));
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
