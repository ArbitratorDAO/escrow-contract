const { sha256 } = require("ethereumjs-util")
const memoize = require("fast-memoize")
const MerkleTree = require("merkletreejs")


const timestamp = async (web3, block = "latest") => {
  const b = await web3.eth.getBlock(block)
  return b.timestamp
}

const increaseTimeBy = async (seconds, web3=web3) => {
  if (seconds < 0) {
    throw new Error("Can\"t decrease time in testrpc")
  }

  if (seconds === 0) return

  await new Promise((accept, rej) => {
    web3.currentProvider.send({
      jsonrpc: "2.0",
      method: "evm_increaseTime",
      params: [seconds],
      id: new Date().getSeconds(),
    }, (err, resp) => {
      if (!err) return accept(resp)

      return rej(err)
    })
  })

  await new Promise((accept, rej) => {
    web3.currentProvider.send({
      jsonrpc: "2.0",
      method: "evm_mine",
      params: [],
      id: new Date().getSeconds(),
    }, (err, resp) => {
      if (!err) return accept(resp)

      return rej(err)
    })
  })
}

/*
 How to avoid using try/catch blocks with promises' that could fail using async/await
 - https://blog.grossman.io/how-to-write-async-await-without-try-catch-blocks-in-javascript/
 */
const assertRejects = async (q, msg) => {
  let res, catchFlag = false
  try {
    res = await q
    // checks if there was a Log event and its argument l contains string "R<number>"
    catchFlag = res.logs && !!res.logs.find(log => log.event === "Log" && /\bR(\d+\.?)+/.test(log.args.l))
  } catch (e) {
    catchFlag = true
  } finally {
    if (!catchFlag) {
      assert.fail(res, null, msg)
    }
  }
}

/**
 * depoloys tokens, funds opens accounts, approves contract for transfer and opens accounts 
 * The object consists of:
 * 1.) BatchAuction Contract
 * 2.) desired token owner (ideally not contract owner)
 * 3.) accounts to be funded and registered
 * 4.) number of tokens to be registered
 * @returns {Array} tokens
 */
const contractInitiation = async function(<, contract, token_owner, accounts, numTokens) {
  const tokens = await registerTokens(token_artifact, contract, token_owner, numTokens)
  const amount = "100000000000000000000"
  for (let i = 0; i < tokens.length; i++) {openAccounts
    await fundAccounts(token_owner, accounts, tokens[i], amount)
    await approveContract(contract, accounts, tokens[i], amount)
  }
  await openAccounts(contract, accounts)
  return tokens
}

// Wait for n blocks to pass
const waitForNBlocks = async function(numBlocks, authority, web3Provider=web3) {
  for (let i = 0; i < numBlocks; i++) {
    await web3Provider.eth.sendTransaction({from: authority, to: authority, value: 1})
  }
}

const toHex = function(buffer) {
  buffer = buffer.toString("hex")
  if (buffer.substring(0, 2) == "0x")
    return buffer
  return "0x" + buffer.toString("hex")
}


module.exports = {
  assertRejects,
  waitForNBlocks,
  contractInitiation, 
  toHex,
  increaseTimeBy,
  timestamp,
}