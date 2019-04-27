pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./Arbitrator.sol";
import "./Verifier.sol";
import "@daostack/arc/contracts/libs/SafeERC20.sol";


contract EscrowContract is Verifier {
    using SafeMath for uint;

    address public arbitrator;
    uint maxJobFullfillment = 100000;
    uint oneHundertPrecent = 105000;

    enum States{
        InProgress,
        ResolutionProposalSubmitted,
        ArbitrationRequested,
        Arbitrated
    }

    struct Contract{
        States state;
        ERC20 depositToken;
        uint depositAmount;
        address arbitrator;
        address payee;
        bool accepted;
        address receipient;
        bytes32 hashedInfo;
        uint timeout;
        uint jobFullfillment;
        bool accepted;
        uint arbitrationRequestTimestamp;
    }

    mapping (bytes32 => Contract) public contracts;

    /**
     * Public interface
     */
    function initiate_contract(
        address receipient,
        address payee,
        ERC20 _depositToken, 
        uint depositAmount,
        bytes32 signature,
        bytes32 hashedInfo,
        uint timeout,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public
    {      
        require(receipient != address(0), "Receipient must be specified");
        bytes32 contractDetailHash = sha3(abi.encodePacked(payee, recepient, hashedInfo, depositAmount, _depositToken, timeout));
        require(contracts[contractDetailHash].receipient != address(0),"Contract already exists");
        contracts[contractDetailHash].payee = payee;
        contracts[contractDetailHash].receipient = recepient;
        contracts[contractDetailHash].depositToken = _depositToken;
        contracts[contractDetailHash].depositAmount = depositAmount;
        contracts[contractDetailHash].hashedInfo = hashedInfo;
        contracts[contractDetailHash].timeout = timeout;
        // verify signature of receipient
        isSigned(_receipient, contractDetailHash, v, r, s);

        // store funds in contract
        _depositToken.transferFrom(msg.sender, this, depositAmount);
    }

    function reportJobFullfillment(uint id, uint jobFullFillment) public {
        require(msg.sender == contracts[msg.sender][id].payee, "only the payee is allowed to send the jobFullFillment judgement");
        require(jobFullFillment <= maxJobFullFillment, "jobFullFillment is not allowed to be bigger than the max value");
        contracts[msg.sender][id].jobFullFillment = jobFullFillment;
        contracts[msg.sender][id].jobFullFillmentTimestamp = jobFullFillmentTimestamp;

        if(jobFullFillment == maxJobFullFillment){
            contracts[msg.sender][id].depositToken.transfer(contracts[msg.sender][id].receipient, contracts[hash].depositAmount.mul(maxJobFullFillment)/oneHundertPrecent);
            contracts[msg.sender][id].depositToken.transfer(contracts[msg.sender][id].payee, contracts[hash].depositAmount.mul(oneHundertPrecent.sub(maxJobFullFillment))/oneHundertPrecent);
            delete contracts[msg.sender][id];
        }
    }
    
    function escalatedToArbitrator(address payee, uint id) public {

    }
    
    function requestForJobFullfillmentGrade(uint id, address sender) public {

    }
     /**
     * Public View Functions
     */
    
    /**
     * Internal Helpers
     */
}
