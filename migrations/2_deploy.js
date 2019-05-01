/* global process, artifacts, web3 */
const EscrowContract = artifacts.require("./EscrowContract.sol")

module.exports = async function (deployer) {
  await deployer.deploy(EscrowContract)
}

