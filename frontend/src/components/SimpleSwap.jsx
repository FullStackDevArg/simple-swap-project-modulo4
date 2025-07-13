import { useState } from 'react';
import { ethers } from 'ethers';

function SimpleSwap() {
  const [account, setAccount] = useState(null);
  const [error, setError] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');

  // Configuración del contrato (reemplaza con las direcciones reales después de desplegar)
  const contractAddress = '0x640B356E7209B619Cd0CE962F13f7c9b9CF6256B'; // Actualizar después de desplegar
  const tokenA = '0x03c4dac47eec187c5dc2b333c0743c6ef8a84afa'; // Actualizar después de desplegar
  const tokenB = '0x1e44dfac24406060acb91b6650768bfb577f7bd2'; // Actualizar después de desplegar
  const abi = [
    'function addLiquidity(address tokenA, address tokenB, uint256 amountADesired, uint256 amountBDesired, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) external returns (uint256 amountA, uint256 amountB, uint256 liquidity)',
    'function removeLiquidity(address tokenA, address tokenB, uint256 liquidity, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) external returns (uint256 amountA, uint256 amountB)',
    'function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) external returns (uint256[] memory amounts)',
    'function getPrice(address tokenIn, address tokenOut) public view returns (uint256)',
    'function totalLiquidity() public view returns (uint256)'
  ];

  // Conectar con MetaMask
  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send('eth_requestAccounts', []);
        setAccount(accounts[0]);
        setError(null);
      } else {
        setError('MetaMask no está instalado');
      }
    } catch (err) {
      setError('Error al conectar con MetaMask: ' + err.message);
    }
  };

  // Añadir liquidez
  const addLiquidity = async () => {
    try {
      if (!account) {
        setError('Por favor, conecta tu billetera primero');
        return;
      }
      if (!amountA || !amountB) {
        setError('Ingresa las cantidades para ambos tokens');
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi, signer);

      const amountADesired = ethers.parseEther(amountA);
      const amountBDesired = ethers.parseEther(amountB);
      const amountAMin = ethers.parseEther((parseFloat(amountA) * 0.9).toString());
      const amountBMin = ethers.parseEther((parseFloat(amountB) * 0.9).toString());
      const to = account;
      const deadline = Math.floor(Date.now() / 1000) + 600; // 10 minutos desde ahora

      const tx = await contract.addLiquidity(
        tokenA,
        tokenB,
        amountADesired,
        amountBDesired,
        amountAMin,
        amountBMin,
        to,
        deadline,
        { gasLimit: 4000000 }
      );

      const receipt = await tx.wait();
      setTxHash(receipt.transactionHash);
      setError(null);
    } catch (err) {
      setError('Error al añadir liquidez: ' + err.message);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">SimpleSwap</h1>
      {!account ? (
        <button
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
          onClick={connectWallet}
        >
          Conectar con MetaMask
        </button>
      ) : (
        <div>
          <p className="mb-2">Conectado: {account}</p>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Cantidad Token A</label>
            <input
              type="number"
              value={amountA}
              onChange={(e) => setAmountA(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              placeholder="Ej: 1000"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Cantidad Token B</label>
            <input
              type="number"
              value={amountB}
              onChange={(e) => setAmountB(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              placeholder="Ej: 2000"
            />
          </div>
          <button
            className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
            onClick={addLiquidity}
          >
            Añadir Liquidez
          </button>
        </div>
      )}
      {error && <p className="mt-4 text-red-500">{error}</p>}
      {txHash && (
        <p className="mt-4 text-green-500">
          Transacción exitosa: <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="underline">{txHash}</a>
        </p>
      )}
    </div>
  );
}

export default SimpleSwap;