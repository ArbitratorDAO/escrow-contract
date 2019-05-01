const timestamp = async (block = "latest") => {
  const b = await web3.eth.getBlock(block)
  return b.timestamp
}

const increaseTimeBy = async (seconds) => {
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
  toHex,
  increaseTimeBy,
  timestamp,
}