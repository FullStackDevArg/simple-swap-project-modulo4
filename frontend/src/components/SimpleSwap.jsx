import React, { useState } from 'react';
import { ethers } from 'ethers';
import abi from '../abi/SimpleSwapABI.json'; // Asegurate de tener este ABI exportado correctamente
import './SimpleSwap.css';

const contractAddress = 'TU_DIRECCION_CONTRATO'; // Reemplazá con tu dirección real del contrato
const tokenA = 'DIRECCION_TOKEN_A'; // Reemplazá con la dirección real de tokenA
const tokenB = 'DIRECCION_TOKEN_B'; // Reemplazá con la dirección real de tokenB

const SimpleSwap = ({ account }) => {
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [liquidity, setLiquidity] = useState('');
  const [selectedSlide, setSelectedSlide] = useState(0);

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(contractAddress, abi, signer);

  const addLiquidity = async () => {
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
