pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "./interfaces/IEscrowContract.sol";
//implements all trading functions for the dX. Enables a dedicated person to trade with MGN discount
contract Arbitrator {

    address [] public arbitrators;

    event NewArbitrationRequest(bytes32 contractHash, address from);
    event NewArbitrationSubmission(bytes32 hash, uint vote);

    struct Request{
        uint requestTimestamp;
        uint escalationEndTimestamp;
        address sender;
        uint vote;
    }

    mapping (bytes32 => Request) public requests;

    constructor(address _arbitrators) public {
        arbitrators.push(_arbitrators);
    }

    function arbitrationRequest(bytes32 hash) public {
        require(requests[hash].requestTimestamp == 0, "request already made");
        requests[hash].requestTimestamp = now;
        requests[hash].sender = msg.sender;
        emit NewArbitrationRequest(hash, msg.sender);
    }

    function submitArbitration(bytes32 hash, uint vote) public {
        require(msg.sender == arbitrators[0], "Only the arbitrator can submit arbitrations");
        require(requests[hash].requestTimestamp > 0, "request must exist");
        requests[hash].vote = vote;
        requests[hash].escalationEndTimestamp = now + 7 days;
        emit NewArbitrationSubmission(hash, vote);
    }

    function escalate(bytes32 hash) public {
        // to be implemented
    }

    function sendArbitrationDecision(bytes32 hash, bytes memory data) public {
        require(requests[hash].escalationEndTimestamp < now, "Escalation period is still running");
        IEscrowContract(requests[hash].sender).submitArbitrationDecision(requests[hash].vote, data);
    }
}
