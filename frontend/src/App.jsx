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
      )}
    </div>
  );
}

export default App;
