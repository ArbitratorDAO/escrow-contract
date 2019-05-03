const EscrowContract = artifacts.require("EscrowContract")
const ArbitratorContract = artifacts.require("Arbitrator")


const abi = require("ethereumjs-abi")
const secp256k1 = require('secp256k1')

const ERC20 = artifacts.require("ERC20")
const MockContract = artifacts.require("MockContract")

const truffleAssert = require("truffle-assertions")
const { increaseTimeBy, timestamp } = require("./utilities")
var { hashPersonalMessage, ecsign, keccak256, fromRpcSig } = require('ethereumjs-util');

contract("EscrowContract", (accounts) => {
  describe("initiateLegalContract()", () => {
    it("add legal contract and tests that hashes", async () => {
      const eC = await EscrowContract.new()
      const depositTokenMock = await MockContract.new()

      const payee = accounts[1]
      const servicee = accounts[2]
      const hashedInfo = "0x"+abi.soliditySHA3(["uint256"],[2]).toString('hex') 
      const depositAmount = 20;
      const depositToken = depositTokenMock.address
      const timeout =  await timestamp() + 60*60*3
      const arbitrator = accounts[0]                                                                     
      var msg = abi.rawEncode([ "address", "address", "bytes32", "uint256", "address", "uint256", "address" ], [ payee, servicee, hashedInfo, depositAmount, depositToken, timeout, arbitrator ]).toString('hex')
      message = web3.utils.sha3("0x"+msg);
      const signature = await web3.eth.sign(message, servicee);
      const { v, r, s } = fromRpcSig(signature);      

      await depositTokenMock.givenAnyReturnBool(true);
      await depositTokenMock.givenAnyReturnUint(42)
      
      await eC.initiateLegalContract(
        payee, servicee, hashedInfo, depositAmount, depositToken,
        timeout, arbitrator,
        v,
        r,
        s);
      msg = abi.rawEncode([ "address", "address", "bytes32", "uint256", "address", "uint256", "address" ], [ payee, servicee, hashedInfo, depositAmount, depositToken, timeout, arbitrator ])
      msgHash = "0x"+keccak256("0x"+msg.toString('hex')).toString('hex')
      assert.equal((await eC.getState.call(msgHash)).toNumber(), 1, "contract not in right state")
    })
    it("test failure in case of invalid signatureadd legal contract", async () => {
      const eC = await EscrowContract.new()
      const depositTokenMock = await MockContract.new()

      const payee = accounts[1]
      const servicee = accounts[2]
      const hashedInfo = "0x"+abi.soliditySHA3(["uint256"],[2]).toString('hex') 
      const depositAmount = 20;
      const depositToken = depositTokenMock.address
      const timeout =  await timestamp() + 60*60*3
      const arbitrator = accounts[0]                                                                     
      var msg = abi.rawEncode([ "address", "address", "bytes32", "uint256", "address", "uint256", "address" ], [ payee, servicee, hashedInfo, depositAmount, depositToken, timeout, arbitrator ]).toString('hex')
      //modifying message
      message = web3.utils.sha3("0xinvalid"+msg);
      const signature = await web3.eth.sign(message, servicee);
      const { v, r, s } = fromRpcSig(signature);      

      await depositTokenMock.givenAnyReturnBool(true);
      await depositTokenMock.givenAnyReturnUint(42)
      
      await truffleAssert.reverts(eC.initiateLegalContract(
        payee, servicee, hashedInfo, depositAmount, depositToken,
        timeout, arbitrator,
        v,
        r,
        s), "Signature is incorrect");
     })
     it("test failure in case of failing token transfer", async () => {
      const eC = await EscrowContract.new()
      const depositTokenMock = await MockContract.new()
  
      const payee = accounts[1]
      const servicee = accounts[2]
      const hashedInfo = "0x"+abi.soliditySHA3(["uint256"],[2]).toString('hex') 
      const depositAmount = 20;
      const depositToken = depositTokenMock.address
      const timeout =  await timestamp() + 60*60*3
      const arbitrator = accounts[0]                                                                     
      var msg = abi.rawEncode([ "address", "address", "bytes32", "uint256", "address", "uint256", "address" ], [ payee, servicee, hashedInfo, depositAmount, depositToken, timeout, arbitrator ]).toString('hex')
      message = web3.utils.sha3("0x"+msg);
      const signature = await web3.eth.sign(message, servicee);
      const { v, r, s } = fromRpcSig(signature);      
      
      await truffleAssert.reverts(eC.initiateLegalContract(
        payee, servicee, hashedInfo, depositAmount, depositToken,
        timeout, arbitrator,
        v,
        r,
        s));
    })
  })
  describe("reportJobFulfillment()", () => {
    it("report 100 percent jobfulfillment", async () => {
      const eC = await EscrowContract.new()
      const depositTokenMock = await MockContract.new()
      const maxJobFulfillment = 100000//(await eC.maxJobFulfillment.call()).toNumber()
      const maxJobFulfillmentPlusFee = 105000//(await eC.maxJobFulfillmentPlusFee.call()).toNumber()

      const payee = accounts[1]
      const servicee = accounts[2]
      const hashedInfo = "0x"+abi.soliditySHA3(["uint256"],[2]).toString('hex') 
      const depositAmount = maxJobFulfillmentPlusFee;
      const depositToken = depositTokenMock.address
      const timeout =  await timestamp() + 60*60*3
      const arbitrator = accounts[0]                                                                     
      var msg = abi.rawEncode([ "address", "address", "bytes32", "uint256", "address", "uint256", "address" ], [ payee, servicee, hashedInfo, depositAmount, depositToken, timeout, arbitrator ]).toString('hex')
      message = web3.utils.sha3("0x"+msg);
      const signature = await web3.eth.sign(message, servicee);
      const { v, r, s } = fromRpcSig(signature);      

      
      await depositTokenMock.givenAnyReturnBool(true);
      await depositTokenMock.givenAnyReturnUint(maxJobFulfillmentPlusFee)
      
      await eC.initiateLegalContract(
        payee, servicee, hashedInfo, depositAmount, depositToken,
        timeout, arbitrator,
        v,
        r,
        s);
      msg = abi.rawEncode([ "address", "address", "bytes32", "uint256", "address", "uint256", "address" ], [ payee, servicee, hashedInfo, depositAmount, depositToken, timeout, arbitrator ])
      msg = "0x"+msg.toString('hex')
      contractDetailHash = "0x"+keccak256(msg).toString('hex')
      assert.equal((await eC.getState.call(contractDetailHash)).toNumber(), 1, "contract not in right state")

      const token = await ERC20.new()

      await depositTokenMock.givenAnyReturnBool(true);
      await eC.reportJobFulfillment(maxJobFulfillment, msg, {from: payee})

      const TransferServicee = token.contract.methods.transfer(servicee, maxJobFulfillment).encodeABI()
      assert.equal(await depositTokenMock.invocationCountForCalldata.call(TransferServicee), 1)
      const TransferPayee = token.contract.methods.transfer(payee, maxJobFulfillmentPlusFee-maxJobFulfillment).encodeABI()
      assert.equal(await depositTokenMock.invocationCountForCalldata.call(TransferPayee), 1)
    })
    it("report 90 percent jobfulfillment and check the right state transtion from InProgress to ResolutionProposalSubmitted", async () => {
      const eC = await EscrowContract.new()
      const depositTokenMock = await MockContract.new()
      const maxJobFulfillment = 100000//(await eC.maxJobFulfillment.call()).toNumber()
      const maxJobFulfillmentPlusFee = 105000//(await eC.maxJobFulfillmentPlusFee.call()).toNumber()

      const payee = accounts[1]
      const servicee = accounts[2]
      const hashedInfo = "0x"+abi.soliditySHA3(["uint256"],[2]).toString('hex') 
      const depositAmount = maxJobFulfillmentPlusFee;
      const depositToken = depositTokenMock.address
      const timeout =  await timestamp() + 60*60*3
      const arbitrator = accounts[0]                                                                     
      var msg = abi.rawEncode([ "address", "address", "bytes32", "uint256", "address", "uint256", "address" ], [ payee, servicee, hashedInfo, depositAmount, depositToken, timeout, arbitrator ]).toString('hex')
      message = web3.utils.sha3("0x"+msg);
      const signature = await web3.eth.sign(message, servicee);
      const { v, r, s } = fromRpcSig(signature);      

      
      await depositTokenMock.givenAnyReturnBool(true);
      await depositTokenMock.givenAnyReturnUint(maxJobFulfillmentPlusFee)
      
      await eC.initiateLegalContract(
        payee, servicee, hashedInfo, depositAmount, depositToken,
        timeout, arbitrator,
        v,
        r,
        s);
      msg = abi.rawEncode([ "address", "address", "bytes32", "uint256", "address", "uint256", "address" ], [ payee, servicee, hashedInfo, depositAmount, depositToken, timeout, arbitrator ])
      contractDetailHash = "0x"+keccak256("0x"+msg.toString('hex')).toString('hex')
      assert.equal((await eC.getState.call(contractDetailHash)).toNumber(), 1, "contract not in right state")

      const token = await ERC20.new()

      await depositTokenMock.givenAnyReturnBool(true);
      await eC.reportJobFulfillment(maxJobFulfillment-1, "0x"+msg.toString('hex'),{from: payee})
      assert.equal((await eC.getState.call(contractDetailHash)).toNumber(),2, "state transition was not successful into ResolutionProposalSubmitted")
    })
    it("reverts, if transaction is not coming from payee", async () => {
      const eC = await EscrowContract.new()
      const depositTokenMock = await MockContract.new()
      const maxJobFulfillment = 100000//(await eC.maxJobFulfillment()).toNumber()
      const maxJobFulfillmentPlusFee = 105000//(await eC.maxJobFulfillmentPlusFee.call()).toNumber()

      const payee = accounts[1]
      const servicee = accounts[2]
      const hashedInfo = "0x"+abi.soliditySHA3(["uint256"],[2]).toString('hex') 
      const depositAmount = maxJobFulfillmentPlusFee;
      const depositToken = depositTokenMock.address
      const timeout =  await timestamp() + 60*60*3
      const arbitrator = accounts[0]                                                                     
      var msg = abi.rawEncode([ "address", "address", "bytes32", "uint256", "address", "uint256", "address" ], [ payee, servicee, hashedInfo, depositAmount, depositToken, timeout, arbitrator ]).toString('hex')
      message = web3.utils.sha3("0x"+msg);
      const signature = await web3.eth.sign(message, servicee);
      const { v, r, s } = fromRpcSig(signature);      

      
      await depositTokenMock.givenAnyReturnBool(true);
      await depositTokenMock.givenAnyReturnUint(maxJobFulfillmentPlusFee)
      
      await eC.initiateLegalContract(
        payee, servicee, hashedInfo, depositAmount, depositToken,
        timeout, arbitrator,
        v,
        r,
        s);
      msg = abi.rawEncode([ "address", "address", "bytes32", "uint256", "address", "uint256", "address" ], [ payee, servicee, hashedInfo, depositAmount, depositToken, timeout, arbitrator ])
      contractDetailHash = "0x"+keccak256("0x"+msg.toString('hex')).toString('hex')
      assert.equal((await eC.getState.call(contractDetailHash)).toNumber(), 1, "contract not in right state")

      const token = await ERC20.new()

      await depositTokenMock.givenAnyReturnBool(true);
      await truffleAssert.reverts(eC.reportJobFulfillment(maxJobFulfillment, "0x"+msg.toString('hex'),{from: servicee}), "only the payee is allowed to send the jobFulfillment judgement")
    })
  })
  describe("escalateToArbitrator()", () => {
    it("servicee escalates the proposal submitted by payee", async () => {
      const eC = await EscrowContract.new()
      const depositTokenMock = await MockContract.new()
      const ArbitratorMock = await MockContract.new()

      const maxJobFulfillment = 100000//(await eC.maxJobFulfillment.call()).toNumber()
      const maxJobFulfillmentPlusFee = 105000//(await eC.maxJobFulfillmentPlusFee.call()).toNumber()

      const payee = accounts[1]
      const servicee = accounts[2]
      const hashedInfo = "0x"+abi.soliditySHA3(["uint256"],[2]).toString('hex') 
      const depositAmount = maxJobFulfillmentPlusFee;
      const depositToken = depositTokenMock.address
      const timeout =  await timestamp() + 60*60*3
      const arbitrator = ArbitratorMock.address                                                                     
      var msg = abi.rawEncode([ "address", "address", "bytes32", "uint256", "address", "uint256", "address" ], [ payee, servicee, hashedInfo, depositAmount, depositToken, timeout, arbitrator ]).toString('hex')
      message = web3.utils.sha3("0x"+msg);
      const signature = await web3.eth.sign(message, servicee);
      const { v, r, s } = fromRpcSig(signature);      

      
      await depositTokenMock.givenAnyReturnBool(true);
      await depositTokenMock.givenAnyReturnUint(maxJobFulfillmentPlusFee)
      
      await eC.initiateLegalContract(
        payee, servicee, hashedInfo, depositAmount, depositToken,
        timeout, arbitrator,
        v,
        r,
        s);
      msg = abi.rawEncode([ "address", "address", "bytes32", "uint256", "address", "uint256", "address" ], [ payee, servicee, hashedInfo, depositAmount, depositToken, timeout, arbitrator ])
      contractDetailHash = "0x"+keccak256("0x"+msg.toString('hex')).toString('hex')
      assert.equal((await eC.getState.call(contractDetailHash)).toNumber(), 1, "contract not in right state")

      const token = await ERC20.new()

      await depositTokenMock.givenAnyReturnBool(true);
      await eC.reportJobFulfillment(maxJobFulfillment-1, "0x"+msg.toString('hex'),{from: payee})


      await ArbitratorMock.givenAnyReturnBool(true);
      await eC.escalateToArbitrator("0x"+msg.toString('hex'),{from: servicee})
      assert.equal((await eC.getState.call(contractDetailHash)).toNumber(),3, "state transition was not successful into ArbitrationRequested")
    })
    it("servicee escalates if payee has not made a proposal in time", async () => {
      const eC = await EscrowContract.new()
      const depositTokenMock = await MockContract.new()
      const ArbitratorMock = await MockContract.new()

      const maxJobFulfillment = 100000//(await eC.maxJobFulfillment.call()).toNumber()
      const maxJobFulfillmentPlusFee = 105000//(await eC.maxJobFulfillmentPlusFee.call()).toNumber()

      const payee = accounts[1]
      const servicee = accounts[2]
      const hashedInfo = "0x"+abi.soliditySHA3(["uint256"],[2]).toString('hex') 
      const depositAmount = maxJobFulfillmentPlusFee;
      const depositToken = depositTokenMock.address
      const timeout =  await timestamp() + 60*60*3
      const arbitrator = ArbitratorMock.address                                                                     
      var msg = abi.rawEncode([ "address", "address", "bytes32", "uint256", "address", "uint256", "address" ], [ payee, servicee, hashedInfo, depositAmount, depositToken, timeout, arbitrator ]).toString('hex')
      message = web3.utils.sha3("0x"+msg);
      const signature = await web3.eth.sign(message, servicee);
      const { v, r, s } = fromRpcSig(signature);      

      
      await depositTokenMock.givenAnyReturnBool(true);
      await depositTokenMock.givenAnyReturnUint(maxJobFulfillmentPlusFee)
      
      await eC.initiateLegalContract(
        payee, servicee, hashedInfo, depositAmount, depositToken,
        timeout, arbitrator,
        v,
        r,
        s);
      msg = abi.rawEncode([ "address", "address", "bytes32", "uint256", "address", "uint256", "address" ], [ payee, servicee, hashedInfo, depositAmount, depositToken, timeout, arbitrator ])
      contractDetailHash = "0x"+keccak256("0x"+msg.toString('hex')).toString('hex')
      assert.equal((await eC.getState.call(contractDetailHash)).toNumber(), 1, "contract not in right state")

      const token = await ERC20.new()

      await increaseTimeBy(60*60*3+5)
      
      await ArbitratorMock.givenAnyReturnBool(true);
      await eC.escalateToArbitrator("0x"+msg.toString('hex'),{from: servicee})
      assert.equal((await eC.getState.call(contractDetailHash)).toNumber(),3, "state transition was not successful into ArbitrationRequested")
    })
    it("servicee escalation fails, if contract is not in right state and timeout is not yet passed", async () => {
      const eC = await EscrowContract.new()
      const depositTokenMock = await MockContract.new()
      const ArbitratorMock = await MockContract.new()

      const maxJobFulfillment = 100000//(await eC.maxJobFulfillment.call()).toNumber()
      const maxJobFulfillmentPlusFee = 105000//(await eC.maxJobFulfillmentPlusFee.call()).toNumber()

      const payee = accounts[1]
      const servicee = accounts[2]
      const hashedInfo = "0x"+abi.soliditySHA3(["uint256"],[2]).toString('hex') 
      const depositAmount = maxJobFulfillmentPlusFee;
      const depositToken = depositTokenMock.address
      const timeout =  await timestamp() + 60*60*3
      const arbitrator = ArbitratorMock.address                                                                     
      var msg = abi.rawEncode([ "address", "address", "bytes32", "uint256", "address", "uint256", "address" ], [ payee, servicee, hashedInfo, depositAmount, depositToken, timeout, arbitrator ]).toString('hex')
      message = web3.utils.sha3("0x"+msg);
      const signature = await web3.eth.sign(message, servicee);
      const { v, r, s } = fromRpcSig(signature);      

      
      await depositTokenMock.givenAnyReturnBool(true);
      await depositTokenMock.givenAnyReturnUint(maxJobFulfillmentPlusFee)
      
      await eC.initiateLegalContract(
        payee, servicee, hashedInfo, depositAmount, depositToken,
        timeout, arbitrator,
        v,
        r,
        s);
      msg = abi.rawEncode([ "address", "address", "bytes32", "uint256", "address", "uint256", "address" ], [ payee, servicee, hashedInfo, depositAmount, depositToken, timeout, arbitrator ])
      contractDetailHash = "0x"+keccak256("0x"+msg.toString('hex')).toString('hex')
      assert.equal((await eC.getState.call(contractDetailHash)).toNumber(), 1, "contract not in right state")
      
      await ArbitratorMock.givenAnyReturnBool(true);
      await truffleAssert.reverts(eC.escalateToArbitrator("0x"+msg.toString('hex'),{from: servicee}), "contract not yet allowed to be arbitrated")
    })
    it("servicee escalation fails, if contract is not triggered by service", async () => {
      const eC = await EscrowContract.new()
      const depositTokenMock = await MockContract.new()
      const ArbitratorMock = await MockContract.new()

      const maxJobFulfillment = 100000//(await eC.maxJobFulfillment.call()).toNumber()
      const maxJobFulfillmentPlusFee = 105000//(await eC.maxJobFulfillmentPlusFee.call()).toNumber()

      const payee = accounts[1]
      const servicee = accounts[2]
      const hashedInfo = "0x"+abi.soliditySHA3(["uint256"],[2]).toString('hex') 
      const depositAmount = maxJobFulfillmentPlusFee;
      const depositToken = depositTokenMock.address
      const timeout =  await timestamp() + 60*60*3
      const arbitrator = ArbitratorMock.address                                                                     
      var msg = abi.rawEncode([ "address", "address", "bytes32", "uint256", "address", "uint256", "address" ], [ payee, servicee, hashedInfo, depositAmount, depositToken, timeout, arbitrator ]).toString('hex')
      message = web3.utils.sha3("0x"+msg);
      const signature = await web3.eth.sign(message, servicee);
      const { v, r, s } = fromRpcSig(signature);      

      
      await depositTokenMock.givenAnyReturnBool(true);
      await depositTokenMock.givenAnyReturnUint(maxJobFulfillmentPlusFee)
      
      await eC.initiateLegalContract(
        payee, servicee, hashedInfo, depositAmount, depositToken,
        timeout, arbitrator,
        v,
        r,
        s);
      msg = abi.rawEncode([ "address", "address", "bytes32", "uint256", "address", "uint256", "address" ], [ payee, servicee, hashedInfo, depositAmount, depositToken, timeout, arbitrator ])
      contractDetailHash = "0x"+keccak256("0x"+msg.toString('hex')).toString('hex')
      assert.equal((await eC.getState.call(contractDetailHash)).toNumber(), 1, "contract not in right state")
      
      await increaseTimeBy(60*60*3+5)

      await ArbitratorMock.givenAnyReturnBool(true);
      await truffleAssert.reverts(eC.escalateToArbitrator("0x"+msg.toString('hex'),{from: payee}), "sender is not the servicee")
    })
  })
  describe("submitArbitrationDecision()", () => {
    it("submits succesfully the arbitrator decision", async () => {
      const eC = await EscrowContract.new()
      const depositTokenMock = await MockContract.new()
      const arbitratorAccount = accounts[3]
      const arbitratorContract = await ArbitratorContract.new(arbitratorAccount)

      const maxJobFulfillment = 100000//(await eC.maxJobFulfillment.call()).toNumber()
      const maxJobFulfillmentPlusFee = 105000//(await eC.maxJobFulfillmentPlusFee.call()).toNumber()

      const payee = accounts[1]
      const servicee = accounts[2]
      const hashedInfo = "0x"+abi.soliditySHA3(["uint256"],[2]).toString('hex') 
      const depositAmount = maxJobFulfillmentPlusFee;
      const depositToken = depositTokenMock.address
      const timeout =  await timestamp() + 60*60*3
      const arbitrator = arbitratorContract.address                                                                     
      var msg = abi.rawEncode([ "address", "address", "bytes32", "uint256", "address", "uint256", "address" ], [ payee, servicee, hashedInfo, depositAmount, depositToken, timeout, arbitrator ]).toString('hex')
      message = web3.utils.sha3("0x"+msg);
      const signature = await web3.eth.sign(message, servicee);
      const { v, r, s } = fromRpcSig(signature);      

      await depositTokenMock.givenAnyReturnBool(true);
      await depositTokenMock.givenAnyReturnUint(maxJobFulfillmentPlusFee)
      
      await eC.initiateLegalContract(
        payee, servicee, hashedInfo, depositAmount, depositToken,
        timeout, arbitrator,
        v,
        r,
        s);
      msg = abi.rawEncode([ "address", "address", "bytes32", "uint256", "address", "uint256", "address" ], [ payee, servicee, hashedInfo, depositAmount, depositToken, timeout, arbitrator ])
      contractDetailHash = "0x"+keccak256("0x"+msg.toString('hex')).toString('hex')
      assert.equal((await eC.getState.call(contractDetailHash)).toNumber(), 1, "contract not in right state")

      const token = await ERC20.new()

      await depositTokenMock.givenAnyReturnBool(true);
      await eC.reportJobFulfillment(maxJobFulfillment-1, "0x"+msg.toString('hex'),{from: payee})

      await eC.escalateToArbitrator("0x"+msg.toString('hex') , {from: servicee})
      assert.equal((await eC.getState.call(contractDetailHash)).toNumber(),3, "state transition was not successful into ArbitrationRequested")
      var judgedInput = 1;
      await arbitratorContract.submitArbitration(contractDetailHash, judgedInput, {from: arbitratorAccount})
      await increaseTimeBy(60*60*24*7+1)
      await arbitratorContract.sendArbitrationDecision(contractDetailHash, "0x"+msg.toString('hex'))
      console.log("arbitration initiated")
      assert.equal(await eC.getState.call(contractDetailHash), 0 ,"Legal contract was not deleted")
    })
    it("non-arbitrators can not submit solutions", async () => {
      const eC = await EscrowContract.new()
      const depositTokenMock = await MockContract.new()
      const arbitratorAccount = accounts[3]
      const arbitratorContract = await ArbitratorContract.new(arbitratorAccount)

      const maxJobFulfillment = 100000//(await eC.maxJobFulfillment.call()).toNumber()
      const maxJobFulfillmentPlusFee = 105000//(await eC.maxJobFulfillmentPlusFee.call()).toNumber()

      const payee = accounts[1]
      const servicee = accounts[2]
      const hashedInfo = "0x"+abi.soliditySHA3(["uint256"],[2]).toString('hex') 
      const depositAmount = maxJobFulfillmentPlusFee;
      const depositToken = depositTokenMock.address
      const timeout =  await timestamp() + 60*60*3
      const arbitrator = arbitratorContract.address                                                                     
      var msg = abi.rawEncode([ "address", "address", "bytes32", "uint256", "address", "uint256", "address" ], [ payee, servicee, hashedInfo, depositAmount, depositToken, timeout, arbitrator ]).toString('hex')
      message = web3.utils.sha3("0x"+msg);
      const signature = await web3.eth.sign(message, servicee);
      const { v, r, s } = fromRpcSig(signature);      

      await depositTokenMock.givenAnyReturnBool(true);
      await depositTokenMock.givenAnyReturnUint(maxJobFulfillmentPlusFee)
      
      await eC.initiateLegalContract(
        payee, servicee, hashedInfo, depositAmount, depositToken,
        timeout, arbitrator,
        v,
        r,
        s);
      msg = abi.rawEncode([ "address", "address", "bytes32", "uint256", "address", "uint256", "address" ], [ payee, servicee, hashedInfo, depositAmount, depositToken, timeout, arbitrator ])
      contractDetailHash = "0x"+keccak256("0x"+msg.toString('hex')).toString('hex')
      assert.equal((await eC.getState.call(contractDetailHash)).toNumber(), 1, "contract not in right state")

      const token = await ERC20.new()

      await depositTokenMock.givenAnyReturnBool(true);
      await eC.reportJobFulfillment(maxJobFulfillment-1, "0x"+msg.toString('hex'),{from: payee})

      await eC.escalateToArbitrator("0x"+msg.toString('hex') , {from: servicee})
      assert.equal((await eC.getState.call(contractDetailHash)).toNumber(),3, "state transition was not successful into ArbitrationRequested")
      var judgedInput = 1;
      await arbitratorContract.submitArbitration(contractDetailHash, judgedInput, {from: arbitratorAccount})
      await increaseTimeBy(60*60*24*7+1)
      await truffleAssert.reverts(eC.submitArbitrationDecision(0, "0x"+msg.toString('hex')),"only arbitrator can submit arbitration")
    })
    it("submits succesfully the arbitrator decision", async () => {
      const eC = await EscrowContract.new()
      const depositTokenMock = await MockContract.new()
      const arbitratorAccount = accounts[3]
      const arbitratorContract = await ArbitratorContract.new(arbitratorAccount)

      const maxJobFulfillment = 100000//(await eC.maxJobFulfillment.call()).toNumber()
      const maxJobFulfillmentPlusFee = 105000//(await eC.maxJobFulfillmentPlusFee.call()).toNumber()

      const payee = accounts[1]
      const servicee = accounts[2]
      const hashedInfo = "0x"+abi.soliditySHA3(["uint256"],[2]).toString('hex') 
      const depositAmount = maxJobFulfillmentPlusFee;
      const depositToken = depositTokenMock.address
      const timeout =  await timestamp() + 60*60*3
      const arbitrator = arbitratorContract.address                                                                     
      var msg = abi.rawEncode([ "address", "address", "bytes32", "uint256", "address", "uint256", "address" ], [ payee, servicee, hashedInfo, depositAmount, depositToken, timeout, arbitrator ]).toString('hex')
      message = web3.utils.sha3("0x"+msg);
      const signature = await web3.eth.sign(message, servicee);
      const { v, r, s } = fromRpcSig(signature);      

      await depositTokenMock.givenAnyReturnBool(true);
      await depositTokenMock.givenAnyReturnUint(maxJobFulfillmentPlusFee)
      
      await eC.initiateLegalContract(
        payee, servicee, hashedInfo, depositAmount, depositToken,
        timeout, arbitrator,
        v,
        r,
        s);
      msg = abi.rawEncode([ "address", "address", "bytes32", "uint256", "address", "uint256", "address" ], [ payee, servicee, hashedInfo, depositAmount, depositToken, timeout, arbitrator ])
      contractDetailHash = "0x"+keccak256("0x"+msg.toString('hex')).toString('hex')
      assert.equal((await eC.getState.call(contractDetailHash)).toNumber(), 1, "contract not in right state")

      const token = await ERC20.new()

      await depositTokenMock.givenAnyReturnBool(true);
      await eC.reportJobFulfillment(maxJobFulfillment-1, "0x"+msg.toString('hex'),{from: payee})

      await truffleAssert.reverts(eC.submitArbitrationDecision(0, "0x"+msg.toString('hex')),"State of contract must be ArbitrationRequest")
    })
  })
})
