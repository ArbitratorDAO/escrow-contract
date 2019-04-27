pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "./interfaces/IDutchExchange.sol";

//implements all trading functions for the dX. Enables a dedicated person to trade with MGN discount
contract MFManager {
    address public tradeManager;
    IDutchExchange public dx;
    mapping(address => uint) tMHoldings;

    constructor(address _tradeManager, IDutchExchange _dx) public{
        tradeManager = _tradeManager;
        dx = _dx;
    }
}
