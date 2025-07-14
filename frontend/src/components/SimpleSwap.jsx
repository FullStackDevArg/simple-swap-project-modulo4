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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initContract = async () => {
      if (window.ethereum && account) {
        try {
          setLoading(true);
          const provider = new ethers.BrowserProvider(window.ethereum);
          await provider.send("eth_requestAccounts", []); // Solicita conexión a MetaMask
          const signer = await provider.getSigner();
          const contractInstance = new ethers.Contract(contractAddress, abi, signer);
          setContract(contractInstance);
        } catch (error) {
          console.error("Error initializing contract:", error);
          alert('Failed to connect to MetaMask or initialize contract');
        } finally {
          setLoading(false);
        }
      } else {
        alert('Please install MetaMask and connect your wallet');
      }
    };
    initContract();
  }, [account]);

  const addLiquidity = async () => {
    if (!contract) {
      alert('Contract not initialized. Please connect MetaMask and refresh.');
      return;
    }
    if (loading) return;
    setLoading(true);
    try {
      const tx = await contract.addLiquidity(
        tokenA,
        tokenB,
        ethers.parseUnits(amountA || '0', 18),
        ethers.parseUnits(amountB || '0', 18),
        ethers.parseUnits((parseFloat(amountA || '0') * 0.9).toString(), 18),
        ethers.parseUnits((parseFloat(amountB || '0') * 0.9).toString(), 18),
        account,
        Math.floor(Date.now() / 1000) + 600
      );
      await tx.wait();
      alert('Liquidity added!');
    } catch (error) {
      console.error("Add liquidity error:", error);
      alert('Add liquidity failed: ' + (error.message || error));
    } finally {
      setLoading(false);
    }
  };

  const removeLiquidity = async () => {
    if (!contract) {
      alert('Contract not initialized. Please connect MetaMask and refresh.');
      return;
    }
    if (loading) return;
    setLoading(true);
    try {
      const tx = await contract.removeLiquidity(
        tokenA,
        tokenB,
        ethers.parseUnits(liquidity || '0', 18),
        ethers.parseUnits((parseFloat(liquidity || '0') * 0.9).toString(), 18),
        ethers.parseUnits('0', 18),
        account,
        Math.floor(Date.now() / 1000) + 600
      );
      await tx.wait();
      alert('Liquidity removed!');
    } catch (error) {
      console.error("Remove liquidity error:", error);
      alert('Remove liquidity failed: ' + (error.message || error));
    } finally {
      setLoading(false);
    }
  };

  const swapTokens = async () => {
    if (!contract) {
      alert('Contract not initialized. Please connect MetaMask and refresh.');
      return;
    }
    if (loading) return;
    setLoading(true);
    try {
      const tx = await contract.swapExactTokensForTokens(
        ethers.parseUnits(amountA || '0', 18),
        ethers.parseUnits((parseFloat(amountA || '0') * 0.9).toString(), 18),
        [tokenA, tokenB],
        account,
        Math.floor(Date.now() / 1000) + 600
      );
      await tx.wait();
      alert('Swap successful!');
    } catch (error) {
      console.error("Swap error:", error);
      alert('Swap failed: ' + (error.message || error));
    } finally {
      setLoading(false);
    }
  };

  const getPrice = async () => {
    if (!contract) {
      alert('Contract not initialized. Please connect MetaMask and refresh.');
      return;
    }
    if (loading) return;
    setLoading(true);
    try {
      const price = await contract.getPrice(tokenA, tokenB);
      alert(`Price: ${ethers.formatEther(price)}`);
    } catch (error) {
      console.error("Get price error:", error);
      alert('Error getting price: ' + (error.message || error));
    } finally {
      setLoading(false);
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
          <button onClick={addLiquidity} disabled={loading}>
            {loading ? 'Loading...' : 'Add'}
          </button>
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
          <button onClick={removeLiquidity} disabled={loading}>
            {loading ? 'Loading...' : 'Remove'}
          </button>
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
          <button onClick={swapTokens} disabled={loading}>
            {loading ? 'Loading...' : 'Swap'}
          </button>
        </>
      ),
    },
    {
      title: 'Get Price',
      content: (
        <button onClick={getPrice} disabled={loading}>
          {loading ? 'Loading...' : 'Fetch Price'}
        </button>
      ),
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
