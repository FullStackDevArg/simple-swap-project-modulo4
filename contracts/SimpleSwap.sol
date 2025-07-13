// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Definition of the ISimpleSwap interface within the file
interface ISimpleSwap {
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB, uint256 liquidity);

    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB);

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external;

    function getPrice(address tokenA, address tokenB) external view returns (uint256 price);
    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) external view returns (uint256);
}

/**
 * @title SimpleSwap
 * @dev A basic Automated Market Maker (AMM) contract for token swapping and liquidity provision.
 * This contract implements the ISimpleSwap interface and uses a constant product formula for swaps.
 */
contract SimpleSwap is ISimpleSwap {
    address public tokenA;
    address public tokenB;
    uint256 public reserveA;
    uint256 public reserveB;
    uint256 public totalLiquidity;

    mapping(address => uint256) public liquidity;

    /**
     * @notice Emitted when liquidity is added to the pool.
     * @param provider The address adding liquidity.
     * @param amountA Amount of tokenA added.
     * @param amountB Amount of tokenB added.
     * @param liquidity Amount of liquidity tokens minted.
     */
    event LiquidityAdded(address indexed provider, uint256 amountA, uint256 amountB, uint256 liquidity);

    /**
     * @notice Emitted when liquidity is removed from the pool.
     * @param provider The address removing liquidity.
     * @param amountA Amount of tokenA removed.
     * @param amountB Amount of tokenB removed.
     */
    event LiquidityRemoved(address indexed provider, uint256 amountA, uint256 amountB);

    /**
     * @notice Emitted when a token swap is performed.
     * @param user The address performing the swap.
     * @param amountIn Amount of input tokens.
     * @param amountOut Amount of output tokens.
     */
    event Swap(address indexed user, uint256 amountIn, uint256 amountOut);

    /**
     * @notice Initializes the SimpleSwap contract with token addresses.
     * @dev Sets the tokenA and tokenB addresses, ensuring they are valid and different.
     * @param _tokenA The address of the first token.
     * @param _tokenB The address of the second token.
     */
    constructor(address _tokenA, address _tokenB) {
        require(_tokenA != address(0) && _tokenB != address(0), "Invalid token address");
        require(_tokenA != _tokenB, "Tokens must be different");
        tokenA = _tokenA;
        tokenB = _tokenB;
    }

    /**
     * @notice Adds liquidity to the pool.
     * @dev Transfers tokens from the caller and mints liquidity tokens based on the current ratio.
     * @param tokenA_ Ignored parameter (for interface compatibility, uses constructor tokenA).
     * @param tokenB_ Ignored parameter (for interface compatibility, uses constructor tokenB).
     * @param amountADesired Desired amount of tokenA to add.
     * @param amountBDesired Desired amount of tokenB to add.
     * @param amountAMin Minimum amount of tokenA to add.
     * @param amountBMin Minimum amount of tokenB to add.
     * @param to Address to receive liquidity tokens.
     * @param deadline Ignored parameter (for interface compatibility).
     * @return amountA Actual amount of tokenA added.
     * @return amountB Actual amount of tokenB added.
     * @return liquidityMinted Amount of liquidity tokens minted.
     */
    function addLiquidity(
        address tokenA_, // Ignored, uses constructor tokenA
        address tokenB_, // Ignored, uses constructor tokenB
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline // Ignored for simplicity
    ) external override returns (uint256 amountA, uint256 amountB, uint256 liquidityMinted) {
        require(to != address(0), "Invalid to address");
        require(amountADesired >= amountAMin && amountBDesired >= amountBMin, "Minimum amounts not met");

        if (totalLiquidity == 0) {
            // Initial liquidity: use desired amounts
            require(amountADesired > 0 && amountBDesired > 0, "Initial liquidity must be positive");
            amountA = amountADesired;
            amountB = amountBDesired;
        } else {
            // Calculate amounts based on current ratio
            uint256 amountBOptimal = (amountADesired * reserveB) / reserveA;
            if (amountBOptimal <= amountBDesired) {
                require(amountBOptimal >= amountBMin, "Insufficient B amount");
                amountA = amountADesired;
                amountB = amountBOptimal;
            } else {
                uint256 amountAOptimal = (amountBDesired * reserveA) / reserveB;
                require(amountAOptimal >= amountAMin, "Insufficient A amount");
                amountA = amountAOptimal;
                amountB = amountBDesired;
            }
        }

        // Transfer tokens to this contract
        require(IERC20(tokenA).transferFrom(msg.sender, address(this), amountA), "Transfer A failed");
        require(IERC20(tokenB).transferFrom(msg.sender, address(this), amountB), "Transfer B failed");

        // Calculate liquidity minted
        if (totalLiquidity == 0) {
            liquidityMinted = amountA; // Initial liquidity based on amountA
        } else {
            liquidityMinted = (amountA * totalLiquidity) / reserveA;
        }

        // Update reserves and liquidity
        reserveA += amountA;
        reserveB += amountB;
        totalLiquidity += liquidityMinted;
        liquidity[to] += liquidityMinted;

        emit LiquidityAdded(to, amountA, amountB, liquidityMinted);
    }

    /**
     * @notice Removes liquidity from the pool.
     * @dev Burns liquidity tokens and transfers tokens back to the caller based on their share.
     * @param tokenA_ Ignored parameter (for interface compatibility, uses constructor tokenA).
     * @param tokenB_ Ignored parameter (for interface compatibility, uses constructor tokenB).
     * @param liquidityAmount Amount of liquidity tokens to remove.
     * @param amountAMin Minimum amount of tokenA to receive.
     * @param amountBMin Minimum amount of tokenB to receive.
     * @param to Address to receive the tokens.
     * @param deadline Ignored parameter (for interface compatibility).
     * @return amountA Actual amount of tokenA removed.
     * @return amountB Actual amount of tokenB removed.
     */
    function removeLiquidity(
        address tokenA_, // Ignored, uses constructor tokenA
        address tokenB_, // Ignored, uses constructor tokenB
        uint256 liquidityAmount,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline // Ignored for simplicity
    ) external override returns (uint256 amountA, uint256 amountB) {
        require(to != address(0), "Invalid to address");
        require(liquidity[msg.sender] >= liquidityAmount, "Insufficient liquidity");
        require(liquidityAmount > 0, "Liquidity amount must be positive");

        // Calculate amounts based on liquidity share
        amountA = (liquidityAmount * reserveA) / totalLiquidity;
        amountB = (liquidityAmount * reserveB) / totalLiquidity;
        require(amountA >= amountAMin, "Insufficient A amount");
        require(amountB >= amountBMin, "Insufficient B amount");

        // Update reserves and liquidity
        reserveA -= amountA;
        reserveB -= amountB;
        totalLiquidity -= liquidityAmount;
        liquidity[msg.sender] -= liquidityAmount;

        // Transfer tokens back to user
        require(IERC20(tokenA).transfer(to, amountA), "Transfer A failed");
        require(IERC20(tokenB).transfer(to, amountB), "Transfer B failed");

        emit LiquidityRemoved(to, amountA, amountB);
    }

    /**
     * @notice Performs a token swap with an exact input amount.
     * @dev Transfers input tokens and sends output tokens to the recipient based on the constant product formula.
     * @param amountIn Amount of input tokens (assumed to be tokenA).
     * @param amountOutMin Minimum amount of output tokens (tokenB) to receive.
     * @param path Array of token addresses [tokenA, tokenB].
     * @param to Address to receive the output tokens.
     * @param deadline Ignored parameter (for interface compatibility).
     */
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline // Ignored for simplicity
    ) external override {
        require(to != address(0), "Invalid to address");
        require(path.length == 2, "Invalid path length");
        require(path[0] == tokenA && path[1] == tokenB, "Invalid token path");

        uint256 amountOut = getAmountOut(amountIn, reserveA, reserveB);
        require(amountOut >= amountOutMin, "Insufficient output amount");

        // Transfer input tokens to this contract
        require(IERC20(tokenA).transferFrom(msg.sender, address(this), amountIn), "Transfer A failed");

        // Update reserves
        reserveA += amountIn;
        reserveB -= amountOut;

        // Transfer output tokens to user
        require(IERC20(tokenB).transfer(to, amountOut), "Transfer B failed");

        emit Swap(msg.sender, amountIn, amountOut);
    }

    /**
     * @notice Retrieves the current price of tokenB in terms of tokenA.
     * @dev Returns the price with 1e18 precision, requiring sufficient liquidity.
     * @param _tokenA Address of tokenA to verify.
     * @param _tokenB Address of tokenB to verify.
     * @return price The price of tokenB in tokenA terms.
     */
    function getPrice(address _tokenA, address _tokenB) external view override returns (uint256 price) {
        require(_tokenA == tokenA && _tokenB == tokenB, "Invalid token pair");
        require(reserveA > 0 && reserveB > 0, "Insufficient liquidity");
        price = (reserveB * 1e18) / reserveA; // Price in 1e18 precision
    }

    /**
     * @notice Calculates the output amount for a given input amount.
     * @dev Uses the constant product formula without fees for simplicity.
     * @param amountIn Input amount of tokenA.
     * @param reserveIn Reserve of tokenA.
     * @param reserveOut Reserve of tokenB.
     * @return amountOut The calculated output amount of tokenB.
     */
    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) public pure override returns (uint256 amountOut) {
        require(amountIn > 0, "Amount in must be positive");
        require(reserveIn > 0 && reserveOut > 0, "Insufficient liquidity");
        uint256 amountInWithFee = amountIn; // No fee for simplicity
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = reserveIn + amountInWithFee;
        amountOut = numerator / denominator;
        require(amountOut > 0, "Amount out must be positive");
    }
}