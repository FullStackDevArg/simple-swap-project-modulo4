import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const SimpleSwap = () => {
  const [account, setAccount] = useState(null);
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const contractAddress = '0x371992a4D1BaC196b85D1C45A2C77CA15e399eE6'; // Actualiza con tu dirección
  const tokenA = '0x03c4dac47eec187c5dc2b333c0743c6ef8a84afa'; // Actualiza
  const tokenB = '0x1e44dfac24406060acb91b6650768bfb577f7bd2'; // Actualiza
  const abi = [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_tokenA",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_tokenB",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "provider",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amountA",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amountB",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "liquidityMinted",
          "type": "uint256"
        }
      ],
      "name": "LiquidityAdded",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "provider",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amountA",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amountB",
          "type": "uint256"
        }
      ],
      "name": "LiquidityRemoved",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amountIn",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amountOut",
          "type": "uint256"
        }
      ],
      "name": "Swap",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_tokenA",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_tokenB",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "amountADesired",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "amountBDesired",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "amountAMin",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "amountBMin",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "deadline",
          "type": "uint256"
        }
      ],
      "name": "addLiquidity",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "amountA",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "amountB",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "liquidityMinted",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "amountIn",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "reserveIn",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "reserveOut",
          "type": "uint256"
        }
      ],
      "name": "getAmountOut",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "amountOut",
          "type": "uint256"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_tokenA",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_tokenB",
          "type": "address"
        }
      ],
      "name": "getPrice",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "price",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "liquidity",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_tokenA",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_tokenB",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "liquidityAmount",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "amountAMin",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "amountBMin",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "deadline",
          "type": "uint256"
        }
      ],
      "name": "removeLiquidity",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "amountA",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "amountB",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "amountA",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "amountB",
          "type": "uint256"
        }
      ],
      "name": "requestApproval",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "reserveA",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "reserveB",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "amountIn",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "amountOutMin",
          "type": "uint256"
        },
        {
          "internalType": "address[]",
          "name": "path",
          "type": "address[]"
        },
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "deadline",
          "type": "uint256"
        }
      ],
      "name": "swapExactTokensForTokens",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "tokenA",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "tokenB",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalLiquidity",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ];

  const slides = [
    {
      title: 'Add Liquidity',
      content: (
        <>
          <input
            type="number"
            value={amountA}
            onChange={(e) => setAmountA(e.target.value)}
            placeholder="Amount A"
            className="border p-2 mb-2 w-full"
          />
          <input
            type="number"
            value={amountB}
            onChange={(e) => setAmountB(e.target.value)}
            placeholder="Amount B"
            className="border p-2 mb-2 w-full"
          />
          <button
            onClick={addLiquidity}
            className="bg-blue-500 text-white p-2 rounded"
          >
            Add Liquidity
          </button>
        </>
      ),
    },
    {
      title: 'Remove Liquidity',
      content: (
        <>
          <input
            type="number"
            value={amountA}
            onChange={(e) => setAmountA(e.target.value)}
            placeholder="Liquidity Amount"
            className="border p-2 mb-2 w-full"
          />
          <button
            onClick={removeLiquidity}
            className="bg-red-500 text-white p-2 rounded"
          >
            Remove Liquidity
          </button>
        </>
      ),
    },
    {
      title: 'Swap Tokens',
      content: (
        <>
          <input
            type="number"
            value={amountA}
            onChange={(e) => setAmountA(e.target.value)}
            placeholder="Amount In"
            className="border p-2 mb-2 w-full"
          />
          <button
            onClick={swapTokens}
            className="bg-green-500 text-white p-2 rounded"
          >
            Swap Tokens
          </button>
        </>
      ),
    },
    {
      title: 'Get Price',
      content: (
        <button
          onClick={getPrice}
          className="bg-purple-500 text-white p-2 rounded"
        >
          Get Price
        </button>
      ),
    },
  ];

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_requestAccounts' }).then(accounts => {
        setAccount(accounts[0]);
      });
    }
  }, []);

  const connectWallet = async () => {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
    }
  };

  const addLiquidity = async () => {
    if (!account) return alert('Please connect your wallet');
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);
    const deadline = Math.floor(Date.now() / 1000) + 600; // 10 minutes
    const tx = await contract.addLiquidity(
      tokenA, tokenB, ethers.parseEther(amountA), ethers.parseEther(amountB),
      ethers.parseEther((amountA * 0.9).toString()), ethers.parseEther((amountB * 0.9).toString()),
      account, deadline
    );
    await tx.wait();
    alert('Liquidity added!');
  };

  const removeLiquidity = async () => {
    if (!account) return alert('Please connect your wallet');
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);
    const deadline = Math.floor(Date.now() / 1000) + 600;
    const tx = await contract.removeLiquidity(
      tokenA, tokenB, ethers.parseEther(amountA),
      ethers.parseEther((amountA * 0.9).toString()), ethers.parseEther('0'),
      account, deadline
    );
    await tx.wait();
    alert('Liquidity removed!');
  };

  const swapTokens = async () => {
    if (!account) return alert('Please connect your wallet');
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);
    const path = [tokenA, tokenB];
    const deadline = Math.floor(Date.now() / 1000) + 600;
    const tx = await contract.swapExactTokensForTokens(
      ethers.parseEther(amountA), ethers.parseEther((amountA * 0.9).toString()),
      path, account, deadline
    );
    await tx.wait();
    alert('Tokens swapped!');
  };

  const getPrice = async () => {
    if (!account) return alert('Please connect your wallet');
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(contractAddress, abi, provider);
    const price = await contract.getPrice(tokenA, tokenB);
    alert(`Price: ${ethers.formatEther(price)}`);
  };

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