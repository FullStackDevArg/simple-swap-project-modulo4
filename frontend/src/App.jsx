<<<<<<< HEAD
import React, { useEffect, useState } from 'react';
=======
import React, { useState, useEffect } from 'react';
>>>>>>> 475ece7 (Agregado chequeo de cuenta conectada en funciones de SimpleSwap)
import SimpleSwap from './components/SimpleSwap';

function App() {
  const [account, setAccount] = useState(null);
<<<<<<< HEAD
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
    <div>
      <h1>Simple Swap DApp</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {account ? (
        <div>
          <p>Connected Wallet: {account}</p>
          <SimpleSwap account={account} />
        </div>
      ) : (
        <p>Please connect your wallet to interact with the app.</p>
=======

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        setAccount(accounts[0]);
      } catch (err) {
        console.error('User denied wallet connection', err);
      }
    } else {
      alert('Please install MetaMask');
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum
        .request({ method: 'eth_accounts' })
        .then((accounts) => {
          if (accounts.length > 0) setAccount(accounts[0]);
        });

      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          setAccount(null);
        }
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      {!account ? (
        <button
          onClick={connectWallet}
          className="bg-blue-500 text-white px-4 py-2 rounded shadow"
        >
          Connect MetaMask
        </button>
      ) : (
        <>
          <p className="mb-4">Connected: {account}</p>
          <SimpleSwap account={account} />
        </>
>>>>>>> 475ece7 (Agregado chequeo de cuenta conectada en funciones de SimpleSwap)
      )}
    </div>
  );
}

export default App;
