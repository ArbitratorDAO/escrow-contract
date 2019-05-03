pragma solidity ^0.5.0;
import "../EscrowContract.sol";

contract TEscrowContract is EscrowContract {

    function makepayout(bytes32 contractDetailHash, uint serviceePayout, uint payeePayout, uint arbitratorPayout, bytes memory data) public {
        _makepayout(contractDetailHash, serviceePayout,payeePayout,arbitratorPayout, data);
    }
    function makepayoutRegular(bytes32 contractDetailHash, uint jobFulfillment, bytes memory data) public {
        _makepayoutRegular(contractDetailHash, jobFulfillment,data);
    }
    function makepayoutWithArbitrationFee(bytes32 contractDetailHash, uint jobFulfillment, bytes memory data) public {
        _makepayoutWithArbitrationFee(contractDetailHash, jobFulfillment, data);
    }
}