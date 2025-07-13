// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title ERC20Mock
 * @dev Mock token para testing basado en OpenZeppelin ERC20
 */
contract ERC20Mock is ERC20 {
    constructor(string memory name, string memory symbol, uint256 initialSupply)
        ERC20(name, symbol)
    {
        _mint(msg.sender, initialSupply);
    }

    /**
     * @dev Permite mintear tokens a una dirección (para pruebas)
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /**
     * @dev Permite quemar tokens desde una dirección (para pruebas)
     */
    function burn(address from, uint256 amount) external {
        _burn(from, amount);
    }
}
