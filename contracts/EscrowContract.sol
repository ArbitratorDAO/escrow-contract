pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./Arbitrator.sol";
import "./Verifier.sol";


contract EscrowContract is Verifier {
    using SafeMath for uint;

    event NewJobFulfillmentReport(bytes32 contractDetailHash, uint JobFulFilment);
    event NewLegalContract(
        bytes32 detailHash,
        address payee,
        address servicee,
        bytes32 hashedInfo, 
        uint depositAmount,
        address depositToken,
        uint timeout,
        address arbitrator
    );
    event Log32(bytes32 prefixedHash);
    event LogBytes(bytes data);
    event LogAddress (address a);
    event Transfer (address to, uint amount);


    uint public maxJobFulfillment = 100000;
    uint public maxJobFulfillmentPlusFee = 105000;

    enum States {
        NotExistant,
        InProgress,
        ResolutionProposalSubmitted,
        ArbitrationRequested,
        Arbitrated
    }

    struct Contract {
        States state;
        uint jobFulfillment;
        uint jobFulfillmentTimestamp;
        uint arbitrationRequestTimestamp;
    }

    mapping (bytes32 => Contract) public contracts;

    /**
     * Public interface
     */
    function initiateLegalContract(
        address payee,
        address servicee,
        bytes32 hashedInfo, 
        uint depositAmount,
        address depositToken,
        uint timeout,
        address arbitrator,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public
    {      
        require(payee != address(0), "Receipient must be specified");
        bytes memory prefix = "\x19Ethereum Signed Message:\n32";
        bytes32 contractDetailHash = keccak256(abi.encode(payee, servicee, hashedInfo, depositAmount, depositToken, timeout, arbitrator));
        bytes32 prefixedHash = keccak256(abi.encodePacked(prefix, contractDetailHash));

        require(uint(contracts[contractDetailHash].state) == 0,"Contract already exists");

        // verify signature of servicee
        require(isSigned(servicee, prefixedHash, v, r, s),"Signature is incorrect");
        // store funds in contract
        require(ERC20(depositToken).transferFrom(msg.sender, address(this), depositAmount));

        contracts[contractDetailHash].state = States.InProgress;
        emit NewLegalContract(contractDetailHash, payee, servicee, hashedInfo, depositAmount, depositToken, timeout, arbitrator);
    }

    function reportJobFulfillment(uint jobFulfillment, bytes memory data) public {
        bytes32 contractDetailHash = keccak256(data);
        require(contracts[contractDetailHash].state != States.NotExistant, "contract must exist");
        address payee = getPayee(data);
        require(msg.sender == payee, "only the payee is allowed to send the jobFulfillment judgement");
        require(jobFulfillment <= maxJobFulfillment, "jobFulfillment is not allowed to be bigger than the max value");
        
        if (jobFulfillment == maxJobFulfillment) {
            _makepayoutRegular(contractDetailHash, jobFulfillment, data);
        } else {
            contracts[contractDetailHash].state = States.ResolutionProposalSubmitted;
            contracts[contractDetailHash].jobFulfillment = jobFulfillment;
            contracts[contractDetailHash].jobFulfillmentTimestamp = now;
        }
        emit NewJobFulfillmentReport(contractDetailHash, jobFulfillment);
    }
    
    function escalateToArbitrator(bytes memory data) public {
        bytes32 contractDetailHash = keccak256(data);
        require(contracts[contractDetailHash].state != States.NotExistant, "contract must exist");
        address arbitrator = getArbitrator(data);
        address servicee = getServicee(data);
        uint timeout = getTimeout(data);
        require(servicee == msg.sender, "sender is not the servicee");
        require(timeout < now || contracts[contractDetailHash].state == States.ResolutionProposalSubmitted, 
            "contract not yet allowed to be arbitrated");
        contracts[contractDetailHash].state = States.ArbitrationRequested;
        Arbitrator(arbitrator).arbitrationRequest(contractDetailHash);
    }

    function submitArbitrationDecision(uint jobFulfillment, bytes memory data) public {
        bytes32 contractDetailHash = keccak256(data);
        require(States.ArbitrationRequested == contracts[contractDetailHash].state, "State of contract must be ArbitrationRequest");
        address arbitrator = getArbitrator(data);
        require(msg.sender == arbitrator, "only arbitrator can submit arbitration");
        _makepayoutWithArbitrationFee(contractDetailHash, jobFulfillment, data);
    }

    function triggerPayout(bytes32 contractDetailHash, bytes memory data) public {
        require(contracts[contractDetailHash].jobFulfillmentTimestamp + 7 days < now,"not yet ready for payout");
        require(contracts[contractDetailHash].state == States.ResolutionProposalSubmitted, "contract was escalted to judges");
    
        _makepayoutRegular(contractDetailHash, contracts[contractDetailHash].jobFulfillment, data);
    }
     /**
     * Public pure Functions
     */
    
    /**
     * Internal Helpers
     */
     function _makepayoutWithArbitrationFee(bytes32 contractDetailHash, uint jobFulfillment, bytes memory data) internal {
        uint depositAmount = getDepositAmount(data); 
        uint serviceePayout = depositAmount.mul(jobFulfillment)/maxJobFulfillmentPlusFee;
        uint payeePayout = depositAmount.mul(maxJobFulfillment.sub(jobFulfillment))/maxJobFulfillmentPlusFee;
        uint arbitratorPayout = depositAmount.mul(maxJobFulfillmentPlusFee.sub(maxJobFulfillment))/maxJobFulfillmentPlusFee;

        _makepayout(contractDetailHash, serviceePayout, payeePayout,arbitratorPayout, data);
     }
    function _makepayoutRegular(bytes32 contractDetailHash, uint jobFulfillment, bytes memory data) internal {
        uint depositAmount = getDepositAmount(data); 
        uint serviceePayout = depositAmount.mul(jobFulfillment)/maxJobFulfillmentPlusFee;
        uint payeePayout = depositAmount.mul(maxJobFulfillmentPlusFee.sub(jobFulfillment))/maxJobFulfillmentPlusFee;
        uint arbitratorPayout = 0;
        _makepayout(contractDetailHash, serviceePayout, payeePayout,arbitratorPayout, data);
     }
    
    function _makepayout(bytes32 contractDetailHash, uint serviceePayout, uint payeePayout, uint arbitratorPayout, bytes memory data) internal {
        require(contractDetailHash ==keccak256(data), "info bytes are not matching with contractDetailHash");

        address depositToken = getDepositToken(data);
        address payee = getPayee(data);
        address servicee = getServicee(data);
        ERC20(depositToken).transfer(servicee, serviceePayout);
        ERC20(depositToken).transfer(payee, payeePayout);
        delete contracts[contractDetailHash];
     }

     function getPayee(bytes memory data) public pure returns(address payee){
        address servicee;
        bytes32 hashedInfo; 
        uint depositAmount;
        address depositToken;
        uint timeout;
        address arbitrator;
        (payee, servicee, hashedInfo, depositAmount, depositToken, timeout, arbitrator) = 
        abi.decode(data, (address, address, bytes32, uint, address, uint, address));
    }
    function getServicee(bytes memory data) public pure returns(address servicee){
        address payee;
        bytes32 hashedInfo; 
        uint depositAmount;
        address depositToken;
        uint timeout;
        address arbitrator;
        (payee, servicee, hashedInfo, depositAmount, depositToken, timeout, arbitrator) = 
        abi.decode(data, (address, address, bytes32, uint, address, uint, address));
    }
    function getDepositAmount(bytes memory data) public pure returns(uint depositAmount){
        address payee;
        bytes32 hashedInfo;
        address servicee; 
        address depositToken;
        uint timeout;
        address arbitrator;
        (payee, servicee, hashedInfo, depositAmount, depositToken, timeout, arbitrator) = 
        abi.decode(data, (address, address, bytes32, uint, address, uint, address));
    }
    function getDepositToken(bytes memory data) public pure returns(address depositToken){
        address payee;
        bytes32 hashedInfo;
        address servicee; 
        uint depositAmount;
        uint timeout;
        address arbitrator;
        (payee, servicee, hashedInfo, depositAmount, depositToken, timeout, arbitrator) = 
        abi.decode(data, (address, address, bytes32, uint, address, uint, address));
    }
    function getTimeout(bytes memory data) public pure returns(uint timeout){
        address payee;
        bytes32 hashedInfo;
        address servicee; 
        uint depositAmount;
        address depositToken;
        address arbitrator;
        (payee, servicee, hashedInfo, depositAmount, depositToken, timeout, arbitrator) = 
        abi.decode(data, (address, address, bytes32, uint, address, uint, address));
    }
    function getArbitrator(bytes memory data) public pure returns(address arbitrator){
        address payee;
        bytes32 hashedInfo;
        address servicee; 
        uint depositAmount;
        address depositToken;
        uint timeout;
        (payee, servicee, hashedInfo, depositAmount, depositToken, timeout, arbitrator) = 
        abi.decode(data, (address, address, bytes32, uint, address, uint, address));
    }
    function getState(bytes32 hash) public view returns (uint){
        return uint(contracts[hash].state);
    }
}
