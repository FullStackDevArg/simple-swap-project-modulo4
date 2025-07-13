// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @title ISimpleSwap Interface
/// @notice Interface for a simple token swap contract
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

/// @title SimpleSwap
/// @notice A basic DEX contract for adding/removing liquidity and swapping tokens
contract SimpleSwap is ISimpleSwap, ReentrancyGuard {
    /// @notice Address of token A
    address public immutable tokenA;

    /// @notice Address of token B
    address public immutable tokenB;

    /// @notice Reserve amount of token A
    uint256 public reserveA;

    /// @notice Reserve amount of token B
    uint256 public reserveB;

    /// @notice Total supply of liquidity tokens
    uint256 public totalLiquidity;

    /// @notice Mapping of user addresses to their liquidity token balances
    mapping(address => uint256) public liquidity;

    /// @notice Emitted when liquidity is added
    event LiquidityAdded(address indexed provider, uint256 amountA, uint256 amountB, uint256 liquidityMinted);

    /// @notice Emitted when liquidity is removed
    event LiquidityRemoved(address indexed provider, uint256 amountA, uint256 amountB);

    /// @notice Emitted when a token swap is performed
    event Swap(address indexed user, uint256 amountIn, uint256 amountOut);

    /// @notice Constructor sets token addresses
    constructor(address _tokenA, address _tokenB) {
        require(_tokenA != address(0) && _tokenB != address(0), "Invalid token address");
        require(_tokenA != _tokenB, "Tokens must differ");
        tokenA = _tokenA;
        tokenB = _tokenB;
    }

    /// @notice Approves this contract to spend tokenA and tokenB on behalf of the caller
    function requestApproval(uint256 amountA, uint256 amountB) external {
        require(IERC20(tokenA).approve(address(this), amountA), "Approve A failed");
        require(IERC20(tokenB).approve(address(this), amountB), "Approve B failed");
    }

    /// @inheritdoc ISimpleSwap
    function addLiquidity(
        address _tokenA,
        address _tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external override nonReentrant returns (uint256 amountA, uint256 amountB, uint256 liquidityMinted) {
        require(deadline >= block.timestamp, "Deadline reached");
        require(_tokenA == tokenA && _tokenB == tokenB, "Invalid token pair");
        require(to != address(0), "Invalid 'to' address");

        uint256 _totalLiquidity = totalLiquidity;
        uint256 _reserveA = reserveA;
        uint256 _reserveB = reserveB;

        if (_totalLiquidity == 0) {
            amountA = amountADesired;
            amountB = amountBDesired;
        } else {
            uint256 ratioA = (amountADesired * _totalLiquidity) / _reserveA;
            uint256 ratioB = (amountBDesired * _totalLiquidity) / _reserveB;

            if (ratioA <= ratioB) {
                amountA = amountADesired;
                amountB = (ratioA * _reserveB) / _totalLiquidity;
            } else {
                amountB = amountBDesired;
                amountA = (ratioB * _reserveA) / _totalLiquidity;
            }
        }

        require(amountA >= amountAMin, "Insufficient amountA");
        require(amountB >= amountBMin, "Insufficient amountB");

        require(IERC20(tokenA).transferFrom(msg.sender, address(this), amountA), "Transfer A failed");
        require(IERC20(tokenB).transferFrom(msg.sender, address(this), amountB), "Transfer B failed");

        liquidityMinted = _totalLiquidity == 0 ? amountA : (amountA * _totalLiquidity) / _reserveA;

        totalLiquidity += liquidityMinted;
        liquidity[to] += liquidityMinted;
        reserveA += amountA;
        reserveB += amountB;

        emit LiquidityAdded(to, amountA, amountB, liquidityMinted);
    }

    /// @inheritdoc ISimpleSwap
    function removeLiquidity(
        address _tokenA,
        address _tokenB,
        uint256 liquidityAmount,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external override nonReentrant returns (uint256 amountA, uint256 amountB) {
        require(deadline >= block.timestamp, "Deadline reached");
        require(_tokenA == tokenA && _tokenB == tokenB, "Invalid token pair");
        require(to != address(0), "Invalid 'to' address");
        require(liquidity[msg.sender] >= liquidityAmount, "Insufficient liquidity");

        uint256 _totalLiquidity = totalLiquidity;
        uint256 _reserveA = reserveA;
        uint256 _reserveB = reserveB;

        amountA = (liquidityAmount * _reserveA) / _totalLiquidity;
        amountB = (liquidityAmount * _reserveB) / _totalLiquidity;

        require(amountA >= amountAMin, "Insufficient amountA");
        require(amountB >= amountBMin, "Insufficient amountB");

        liquidity[msg.sender] -= liquidityAmount;
        totalLiquidity -= liquidityAmount;
        reserveA -= amountA;
        reserveB -= amountB;

        require(IERC20(tokenA).transfer(to, amountA), "Transfer A failed");
        require(IERC20(tokenB).transfer(to, amountB), "Transfer B failed");

        emit LiquidityRemoved(to, amountA, amountB);
    }

    /// @inheritdoc ISimpleSwap
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external override nonReentrant {
        require(deadline >= block.timestamp, "Deadline reached");
        require(path.length == 2 && path[0] == tokenA && path[1] == tokenB, "Invalid path");
        require(to != address(0), "Invalid 'to' address");

        uint256 reserveIn = IERC20(tokenA).balanceOf(address(this));
        uint256 reserveOut = IERC20(tokenB).balanceOf(address(this));

        uint256 amountOut = (amountIn * reserveOut) / (reserveIn + amountIn);
        require(amountOut >= amountOutMin, "Insufficient output");

        require(IERC20(tokenA).transferFrom(msg.sender, address(this), amountIn), "Transfer A failed");
        require(IERC20(tokenB).transfer(to, amountOut), "Transfer B failed");

        reserveA += amountIn;
        reserveB -= amountOut;

        emit Swap(msg.sender, amountIn, amountOut);
    }

    /// @inheritdoc ISimpleSwap
    function getPrice(address _tokenA, address _tokenB) external view override returns (uint256 price) {
        require(_tokenA == tokenA && _tokenB == tokenB, "Invalid token pair");
        require(reserveA > 0 && reserveB > 0, "Insufficient liquidity");
        return (reserveB * 1e18) / reserveA;
    }

    /// @inheritdoc ISimpleSwap
    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut)
        external
        pure
        override
        returns (uint256 amountOut)
    {
        require(amountIn > 0 && reserveIn > 0 && reserveOut > 0, "Invalid input");
        amountOut = (amountIn * reserveOut) / (reserveIn + amountIn);
    }
}
