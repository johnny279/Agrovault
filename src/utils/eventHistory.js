// Fetches on-chain event logs in safe chunks (avoids "block range too large" RPC errors)
export async function queryEventsChunked(contract, filter, fromBlock, toBlock, chunkSize = 9000) {
  const allLogs = [];
  let start = fromBlock;
  while (start <= toBlock) {
    const end = Math.min(start + chunkSize, toBlock);
    try {
      const logs = await contract.queryFilter(filter, start, end);
      allLogs.push(...logs);
    } catch (err) {
      console.error(`Failed to fetch logs for blocks ${start}-${end}:`, err);
    }
    start = end + 1;
  }
  return allLogs;
}

// Attaches a block timestamp to each log, caching per block number to avoid duplicate calls
export async function attachTimestamps(provider, logs) {
  const cache = {};
  const results = [];
  for (const log of logs) {
    if (!cache[log.blockNumber]) {
      const block = await provider.getBlock(log.blockNumber);
      cache[log.blockNumber] = block.timestamp;
    }
    results.push({ ...log, timestamp: cache[log.blockNumber] });
  }
  return results;
}