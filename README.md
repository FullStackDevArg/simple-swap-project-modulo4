SimpleSwap - TP4
Project Description
SimpleSwap is a decentralized application (dApp) that implements a basic token swap on the Ethereum blockchain (Sepolia network). The frontend, built with React and Vite, allows users to interact with a SimpleSwap smart contract through a carousel featuring four main functionalities: adding liquidity, removing liquidity, swapping tokens, and getting the token pair price.
Features

Wallet Connection: Users can connect their MetaMask wallet to interact with the dApp.
Add Liquidity: Allows users to contribute token pairs (Token A and Token B) to the liquidity pool.
Remove Liquidity: Enables users to withdraw their tokens from the pool based on the provided liquidity amount.
Swap Tokens: Facilitates the exchange of a Token A amount for Token B (or vice versa) based on pool reserves.
Get Price: Displays the current price of the token pair based on contract reserves.
Carousel Interface: An interactive carousel that navigates between the four functionalities with navigation buttons.

Technologies Used

Frontend: React, Vite, ethers.js.
Blockchain: Solidity, Hardhat, Sepolia network.
Deployment: Vercel.
Styling: Tailwind CSS (integrated in JSX).

Usage Instructions

Clone the repository:git clone https://github.com/FullStackDevArg/simple-swap-project-modulo4.git
cd simple-swap-project/frontend/vite


Install dependencies:npm install


Start the local development server:npm run dev


Connect MetaMask to the Sepolia network and approve transactions to interact with the contract at 0x371992a4D1BaC196b85D1C45A2C77CA15e399eE6.
Access the deployed frontend at: https://simple-swap-project-modulo4.vercel.app/.

Point 5: Cloud Storage and Deployment

Deployment: The frontend is deployed on Vercel, utilizing its infrastructure for static file storage.
Public URL: https://simple-swap-project-modulo4.vercel.app/.
Contract: The SimpleSwap contract is deployed on the Sepolia network (address to be updated after successful deployment).

Test Coverage
The project includes unit tests written with Hardhat to verify the SimpleSwap contract functionality. The tests cover:

Contract deployment with valid token addresses.
addLiquidity logic to ensure correct liquidity allocation.
getPrice calculation based on reserves.
Achieved at least 50% code coverage, validated using npx hardhat coverage. Results show that critical functions are tested, including event emissions (LiquidityAdded, LiquidityRemoved, Swap) and input validations.

To run the tests locally:
npx hardhat test

To generate the coverage report:
npx hardhat coverage

Current Status

The frontend is under active development, with the carousel functional and contract interactions implemented.
Pending: Resolve any Vercel build errors and ensure deployment stability.

Contributions
Created by [Your Name] for the TP4 of the course.
