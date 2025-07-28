// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Interfaz para el contrato SimpleSwap
/// @notice Define las funciones y eventos para interactuar con el contrato SimpleSwap
/// @dev Interfaz para un DEX que permite añadir/retirar liquidez y realizar swaps
interface ISimpleSwap {
    /// @notice Emitted when liquidity is added to the pool
    /// @param provider Address of the liquidity provider
    /// @param amountA Amount of token A added
    /// @param amountB Amount of token B added
    /// @param liquidityMinted Amount of liquidity tokens minted
    event LiquidityAdded(address indexed provider, uint256 amountA, uint256 amountB, uint256 liquidityMinted);

    /// @notice Emitted when liquidity is removed from the pool
    /// @param provider Address of the liquidity provider
    /// @param amountA Amount of token A removed
    /// @param amountB Amount of token B removed
    event LiquidityRemoved(address indexed provider, uint256 amountA, uint256 amountB);

    /// @notice Emitted when a token swap is performed
    /// @param user Address of the user performing the swap
    /// @param amountIn Amount of input token
    /// @param amountOut Amount of output token
    event Swap(address indexed user, uint256 amountIn, uint256 amountOut);

    /// @notice Approves the contract to spend tokenA and tokenB on behalf of the caller
    /// @param amountA Amount of token A to approve
    /// @param amountB Amount of token B to approve
    function requestApproval(uint256 amountA, uint256 amountB) external;

    /// @notice Adds liquidity to the pool
    /// @param _tokenA Address of the first token
    /// @param _tokenB Address of the second token
    /// @param amountADesired Desired amount of token A to add
    /// @param amountBDesired Desired amount of token B to add
    /// @param amountAMin Minimum amount of token A to add
    /// @param amountBMin Minimum amount of token B to add
    /// @param to Address to receive liquidity tokens
    /// @param deadline Timestamp after which the transaction will revert
    /// @return amountA Actual amount of token A added
    /// @return amountB Actual amount of token B added
    /// @return liquidityMinted Amount of liquidity tokens minted
    function addLiquidity(
        address _tokenA,
        address _tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB, uint256 liquidityMinted);

    /// @notice Removes liquidity from the pool
    /// @param _tokenA Address of the first token
    /// @param _tokenB Address of the second token
    /// @param liquidityAmount Amount of liquidity tokens to remove
    /// @param amountAMin Minimum amount of token A to receive
    /// @param amountBMin Minimum amount of token B to receive
    /// @param to Address to receive the tokens
    /// @param deadline Timestamp after which the transaction will revert
    /// @return amountA Amount of token A removed
    /// @return amountB Amount of token B removed
    function removeLiquidity(
        address _tokenA,
        address _tokenB,
        uint256 liquidityAmount,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB);

    /// @notice Swaps exact tokens for tokens
    /// @param amountIn Amount of input token
    /// @param amountOutMin Minimum amount of output token expected
    /// @param path Array of token addresses defining the swap path
    /// @param to Address to receive the output tokens
    /// @param deadline Timestamp after which the transaction will revert
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external;

    /// @notice Gets the price of tokenA in terms of tokenB
    /// @param _tokenA Address of the first token
    /// @param _tokenB Address of the second token
    /// @return price Amount of tokenB per tokenA, scaled by 1e18
    function getPrice(address _tokenA, address _tokenB) external view returns (uint256 price);

    /// @notice Calculates the amount of output tokens for a given input
    /// @param amountIn Amount of input token
    /// @param reserveIn Reserve of the input token
    /// @param reserveOut Reserve of the output token
    /// @return amountOut Amount of output token
    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) external pure returns (uint256 amountOut);
    
    
}
