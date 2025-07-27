// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/ISimpleSwap.sol";

/// @title SimpleSwap - A simple decentralized exchange (DEX) for token swapping and liquidity provision
/// @notice Implements a Uniswap V2-style AMM for adding/removing liquidity and swapping tokens
/// @dev Implements the ISimpleSwap interface with reentrancy protection and optimized state variable access
contract SimpleSwap is ISimpleSwap, ReentrancyGuard {
    /// @notice Address of token A in the trading pair
    address public immutable tokenA;
    
    /// @notice Address of token B in the trading pair
    address public immutable tokenB;
    
    /// @notice Reserve of token A in the pool
    uint256 private reserveA;
    
    /// @notice Reserve of token B in the pool
    uint256 private reserveB;
    
    /// @notice Total supply of liquidity tokens
    uint256 private totalLiquidity;
    
    /// @notice Mapping of liquidity token balances for each provider
    mapping(address => uint256) private liquidityBalance;
    
    /// @notice Constant for price and amount calculations, scaled by 1e18
    uint256 private constant PRECISION = 1e18;
    
    /// @notice Minimum liquidity to prevent division by zero
    uint256 private constant MINIMUM_LIQUIDITY = 1000;

    /// @dev Constructor to initialize the token pair
    /// @param _tokenA Address of the first token
    /// @param _tokenB Address of the second token
    constructor(address _tokenA, address _tokenB) {
        require(_tokenA != _tokenB, "Tokens must be different");
        require(_tokenA != address(0) && _tokenB != address(0), "Invalid token address");
        tokenA = _tokenA;
        tokenB = _tokenB;
    }

    /// @notice Adds liquidity to the token pair pool
    /// @param _tokenA Address of the first token
    /// @param _tokenB Address of the second token
    /// @param amountADesired Desired amount of token A to add
    /// @param amountBDesired Desired amount of token B to add
    /// @param amountAMin Minimum amount of token A to add (slippage protection)
    /// @param amountBMin Minimum amount of token B to add (slippage protection)
    /// @param to Address to receive the liquidity tokens
    /// @param deadline Timestamp after which the transaction will revert
    /// @return amountA Actual amount of token A added
    /// @return amountB Actual amount of token B added
    /// @return liquidity Amount of liquidity tokens minted
    function addLiquidity(
        address _tokenA,
        address _tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external override nonReentrant returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
        require(block.timestamp <= deadline, "Deadline expired");
        require(to != address(0), "Invalid recipient");
        require(_tokenA == tokenA && _tokenB == tokenB, "Invalid token pair");

        // Cache state variables to avoid multiple storage reads
        uint256 _reserveA = reserveA;
        uint256 _reserveB = reserveB;
        uint256 _totalLiquidity = totalLiquidity;

        if (_totalLiquidity == 0) {
            // Initial liquidity provision
            amountA = amountADesired;
            amountB = amountBDesired;
            liquidity = sqrt(amountA * amountB) - MINIMUM_LIQUIDITY;
        } else {
            // Calculate amounts based on current reserves
            amountA = amountADesired;
            amountB = (amountA * _reserveB) / _reserveA;
            if (amountB > amountBDesired) {
                amountB = amountBDesired;
                amountA = (amountB * _reserveA) / _reserveB;
            }
        }

        // Enforce minimum amounts (slippage protection)
        require(amountA >= amountAMin, "Insufficient amount A");
        require(amountB >= amountBMin, "Insufficient amount B");

        // Transfer tokens to the contract
        IERC20(_tokenA).transferFrom(msg.sender, address(this), amountA);
        IERC20(_tokenB).transferFrom(msg.sender, address(this), amountB);

        // Update reserves and liquidity
        reserveA = _reserveA + amountA;
        reserveB = _reserveB + amountB;
        liquidityBalance[to] += liquidity;
        totalLiquidity = _totalLiquidity + liquidity;

        emit LiquidityAdded(msg.sender, amountA, amountB, liquidity);
    }

    /// @notice Removes liquidity from the token pair pool
    /// @param _tokenA Address of the first token
    /// @param _tokenB Address of the second token
    /// @param liquidity Amount of liquidity tokens to burn
    /// @param amountAMin Minimum amount of token A to receive (slippage protection)
    /// @param amountBMin Minimum amount of token B to receive (slippage protection)
    /// @param to Address to receive the withdrawn tokens
    /// @param deadline Timestamp after which the transaction will revert
    /// @return amountA Amount of token A withdrawn
    /// @return amountB Amount of token B withdrawn
    function removeLiquidity(
        address _tokenA,
        address _tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external override nonReentrant returns (uint256 amountA, uint256 amountB) {
        require(block.timestamp <= deadline, "Deadline expired");
        require(to != address(0), "Invalid recipient");
        require(_tokenA == tokenA && _tokenB == tokenB, "Invalid token pair");
        require(liquidity > 0 && liquidityBalance[msg.sender] >= liquidity, "Insufficient liquidity");

        // Cache state variables to avoid multiple storage reads
        uint256 _reserveA = reserveA;
        uint256 _reserveB = reserveB;
        uint256 _totalLiquidity = totalLiquidity;

        // Calculate amounts to withdraw
        amountA = (liquidity * _reserveA) / _totalLiquidity;
        amountB = (liquidity * _reserveB) / _totalLiquidity;

        // Enforce minimum amounts (slippage protection)
        require(amountA >= amountAMin, "Insufficient amount A");
        require(amountB >= amountBMin, "Insufficient amount B");

        // Update state
        liquidityBalance[msg.sender] -= liquidity;
        totalLiquidity = _totalLiquidity - liquidity;
        reserveA = _reserveA - amountA;
        reserveB = _reserveB - amountB;

        // Transfer tokens to the recipient
        IERC20(_tokenA).transfer(to, amountA);
        IERC20(_tokenB).transfer(to, amountB);

        emit LiquidityRemoved(msg.sender, amountA, amountB);
    }

    /// @notice Swaps an exact amount of input tokens for output tokens
    /// @param amountIn Amount of input token to swap
    /// @param amountOutMin Minimum amount of output token expected (slippage protection)
    /// @param path Array of token addresses defining the swap path
    /// @param to Address to receive the output tokens
    /// @param deadline Timestamp after which the transaction will revert
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external override nonReentrant {
        require(block.timestamp <= deadline, "Deadline expired");
        require(path.length == 2, "Invalid path length");
        require(path[0] == tokenA && path[1] == tokenB, "Invalid token pair");
        require(amountIn > 0, "Invalid input amount");
        require(to != address(0), "Invalid recipient");

        // Cache reserves to avoid multiple storage reads
        uint256 _reserveA = reserveA;
        uint256 _reserveB = reserveB;

        // Calculate output amount using getAmountOut
        uint256 amountOut = getAmountOut(amountIn, _reserveA, _reserveB);
        require(amountOut >= amountOutMin, "Insufficient output amount");

        // Transfer input tokens to the contract
        IERC20(path[0]).transferFrom(msg.sender, address(this), amountIn);
        // Transfer output tokens to the recipient
        IERC20(path[1]).transfer(to, amountOut);

        // Update reserves
        reserveA = _reserveA + amountIn;
        reserveB = _reserveB - amountOut;

        emit Swap(msg.sender, amountIn, amountOut);
    }

    /// @notice Retrieves the price of tokenA in terms of tokenB
    /// @param _tokenA Address of the first token
    /// @param _tokenB Address of the second token
    /// @return price Amount of tokenB per tokenA, scaled by 1e18
    function getPrice(address _tokenA, address _tokenB) external view override returns (uint256 price) {
        require(_tokenA == tokenA && _tokenB == tokenB, "Invalid token pair");
        
        // Cache reserves to avoid multiple storage reads
        uint256 _reserveA = reserveA;
        uint256 _reserveB = reserveB;
        
        require(_reserveA > 0 && _reserveB > 0, "Insufficient reserves");
        price = (_reserveB * PRECISION) / _reserveA;
    }

    /// @notice Calculates the amount of output tokens for a given input amount
    /// @param amountIn Amount of input token
    /// @param reserveIn Reserve of the input token in the pool
    /// @param reserveOut Reserve of the output token in the pool
    /// @return amountOut Amount of output token expected
    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) public pure override returns (uint256 amountOut) {
        require(amountIn > 0, "Invalid input amount");
        require(reserveIn > 0 && reserveOut > 0, "Insufficient reserves");
        
        // Apply 0.3% fee (997/1000)
        uint256 amountInWithFee = amountIn * 997;
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * 1000) + amountInWithFee;
        amountOut = numerator / denominator;
    }

    /// @notice Requests approval for the contract to spend tokens on behalf of the caller
    /// @param amountA Amount of token A to approve
    /// @param amountB Amount of token B to approve
    function requestApproval(uint256 amountA, uint256 amountB) external override {
    require(amountA > 0 && amountB > 0, "Invalid approval amounts");
    IERC20(tokenA).approve(address(this), amountA);
    IERC20(tokenB).approve(address(this), amountB);
}
    /// @dev Internal function to calculate the square root (Babylonian method)
    /// @param y Input number
    /// @return z Square root of the input
    function sqrt(uint256 y) private pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
}