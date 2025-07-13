import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const SimpleSwap = () => {
  const [account, setAccount] = useState(null);
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const contractAddress = '0x371992a4D1BaC196b85D1C45A2C77CA15e399eE6'; // Actualiza si cambia
  const tokenA = '0x03c4dac47eec187c5dc2b333c0743c6ef8a84afa';
  const tokenB = '0x1e44dfac24406060acb91b6650768bfb577f7bd2';
  const abi = [/* Tu ABI aquí, como lo compartiste */]; // Asegúrate de que sea el ABI completo

  useEffect(() => {
    const connect = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          setAccount(accounts[0]);
        } catch (error) {
          console.error("Error connecting wallet:", error);
        }
      }
    };
    connect();
  }, []);

  const connectWallet = async () => {
    if (!account && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
      } catch (error) {
        console.error("Error connecting wallet:", error);
      }
    }
  };

  const addLiquidity = async () => {
    if (!account) return alert('Please connect your wallet');
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi, signer);
      const deadline = Math.floor(Date.now() / 1000) + 600;
      const tx = await contract.addLiquidity(
        tokenA, tokenB, ethers.parseEther(amountA || '0'), ethers.parseEther(amountB || '0'),
        ethers.parseEther((parseFloat(amountA || '0') * 0.9).toString()), ethers.parseEther((parseFloat(amountB || '0') * 0.9).toString()),
        account, deadline
      );
      await tx.wait();
      alert('Liquidity added!');
    } catch (error) {
      console.error("Error adding liquidity:", error);
      alert('Error adding liquidity');
    }
  };

  // Similarmente, agrega try-catch a removeLiquidity, swapTokens, y getPrice
  const removeLiquidity = async () => {
    if (!account) return alert('Please connect your wallet');
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi, signer);
      const deadline = Math.floor(Date.now() / 1000) + 600;
      const tx = await contract.removeLiquidity(
        tokenA, tokenB, ethers.parseEther(amountA || '0'),
        ethers.parseEther((parseFloat(amountA || '0') * 0.9).toString()), ethers.parseEther('0'),
        account, deadline
      );
      await tx.wait();
      alert('Liquidity removed!');
    } catch (error) {
      console.error("Error removing liquidity:", error);
      alert('Error removing liquidity');
    }
  };

  const swapTokens = async () => {
    if (!account) return alert('Please connect your wallet');
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi, signer);
      const path = [tokenA, tokenB];
      const deadline = Math.floor(Date.now() / 1000) + 600;
      const tx = await contract.swapExactTokensForTokens(
        ethers.parseEther(amountA || '0'), ethers.parseEther((parseFloat(amountA || '0') * 0.9).toString()),
        path, account, deadline
      );
      await tx.wait();
      alert('Tokens swapped!');
    } catch (error) {
      console.error("Error swapping tokens:", error);
      alert('Error swapping tokens');
    }
  };

  const getPrice = async () => {
    if (!account) return alert('Please connect your wallet');
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, abi, provider);
      const price = await contract.getPrice(tokenA, tokenB);
      alert(`Price: ${ethers.formatEther(price)}`);
    } catch (error) {
      console.error("Error getting price:", error);
      alert('Error getting price');
    }
  };

  const slides = [
  { title: 'Add Liquidity', content: <p>Add Liquidity content</p> },
  { title: 'Remove Liquidity', content: <p>Remove Liquidity content</p> },
  { title: 'Swap Tokens', content: <p>Swap Tokens content</p> },
  { title: 'Get Price', content: <p>Get Price content</p> },
];
// Como lo tenías

  return (
    <div className="max-w-md mx-auto p-4">
      {!account && (
        <button onClick={connectWallet} className="bg-blue-500 text-white p-2 rounded mb-4">
          Connect Wallet
        </button>
      )}
      {account && (
        <div>
          <h1 className="text-2xl mb-4">SimpleSwap - Connected: {account}</h1>
          <div className="relative">
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-300"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {slides.map((slide, index) => (
                  <div key={index} className="w-full flex-shrink-0 p-4">
                    <h2 className="text-xl mb-2">{slide.title}</h2>
                    {slide.content}
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => setCurrentSlide((prev) => (prev > 0 ? prev - 1 : slides.length - 1))}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-gray-500 text-white p-2 rounded"
            >
              ←
            </button>
            <button
              onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-gray-500 text-white p-2 rounded"
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleSwap;
