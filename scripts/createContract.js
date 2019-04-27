/* eslint-disable no-console */
const EscrowContract = artifacts.require("EscrowContract")
const getArgumentsHelper = require("./script_utilities.js")

module.exports = async (callback) => {
  try {
    const arguments = getArgumentsHelper()
    if (arguments.length != 2) {
      callback("Error: This script requires arguments - <payee> <servicee> <depositToken> <depositTokenAmount> <HashedInfo> ")
    }
    const [payee, servicee, depositToken, depositTokenAmount, HashedInfo] = arguments
    
    const escrow = await EscrowContract.deployed()
    const erc20 = await ERC20.at(DepositToken);
    

    const deposit_state = await instance.deposits.call(slot)
    if (deposit_state.appliedAccountStateIndex != 0) {
      callback("Error: Requested deposit slot has already been applied")
    }

    console.log("Current slot for: %d with curr_state %s and new_state %s", slot, curr_state, new_state)
    await instance.applyDeposits(slot, curr_state, new_state, deposit_state.shaHash)
    const updated_state = await instance.deposits.call(slot)
    console.log("Successfully applied Deposits!")
    console.log("New appliedAccountStateIndex is:", updated_state.appliedAccountStateIndex.toNumber())
    callback()
  } catch (error) {
    callback(error)
  }
  try {
    const escrow = await EscrowContract.deployed()
    console.log("Coordinator deployed at %s", coordinator.address)
    if (await coordinator.canParticipate()) {
      await coordinator.participateInAuction()
      console.log("Successfully called participateInAuction!")
      callback()
    } else {
      console.log("Can't participate in auction yet.")
      callback()  
    }
    
  } catch (error) {
    callback(error)
  }
}
