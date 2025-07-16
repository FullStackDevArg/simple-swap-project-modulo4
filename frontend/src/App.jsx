import React, { useEffect, useState } from 'react';
import SimpleSwap from './components/SimpleSwap';

function App() {
  const [account, setAccount] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const connectWallet = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          setAccount(accounts[0]);

          // Escuchar cambios de cuenta
          window.ethereum.on('accountsChanged', (accounts) => {
            setAccount(accounts[0] || null);
          });
        } catch (err) {
          setError('Error connecting wallet: ' + err.message);
        }
      } else {
        setError('MetaMask is not installed. Please install it to use this app.');
      }
    };

    connectWallet();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-4">Simple Swap DApp</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {!account ? (
        <p className="mb-4">Please connect your wallet to interact with the app.</p>
      ) : (
        <>
          <p className="mb-4">Connected Wallet
