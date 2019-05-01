pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

//implements all trading functions for the dX. Enables a dedicated person to trade with MGN discount
contract Arbitrator {
    address [] public arbitrators;

    struct Request{
        uint requestTimestamp;
        uint escalationEndTimestamp;
        address sender;
        uint vote;
    }
    mapping (bytes32 => Request) public requests;

    constructor (address _arbitrators) public {
        arbitrators[0] = _arbitrators;
    }
    function arbitrationRequest(bytes32 hash) public {
        require(requests[hash].requestTimestamp ==0, "request already made");
        requests[hash].requestTimestamp = now;
        requests[hash].sender = msg.sender;
    }

     function submitArbitration(bytes32 hash, uint vote) public {
        require(msg.sender == arbitrators[0], "Only the arbitrator can submit arbitrations");
        require(requests[hash].requestTimestamp > 0, "request must exist");
        requests[hash].vote = vote;
        requests[hash].escalationEndTimestamp = now + 7 days;
    }
    function escalate(bytes32 hash) public {
        // to be implemented
    }

    function sendArbitrationDecision(bytes32 hash, bytes memory data) public {
        require(requests[hash].escalationEndTimestamp < now, "Escalation period is still running");
        requests[hash].sender.call(abi.encodeWithSignature("submitArbitrationDecision(bytes32, uint, bytes", hash, requests[hash].vote, data));
    }
}
