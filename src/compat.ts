import type { Log } from 'viem';
import type { AnyReceipt, NormalizedReceipt } from './types.js';

export function normalizeReceipt(r: AnyReceipt): NormalizedReceipt {
  if ('transactionHash' in r) {
    // viem
    return {
      hash: r.transactionHash,
      status: r.status === 'success' ? 'success' : 'failed',
      logs: r.logs.map(
        (l) =>
          ({
            address: l.address,
            data: l.data,
            topics: l.topics,
          }) as Log, // we only keep fields that we use
      ),
      transactionHash: r.transactionHash,
    };
  } else {
    // ethers v6
    return {
      hash: r.hash,
      status: r.status === 1 ? 'success' : r.status === 0 ? 'failed' : 'pending',
      logs: r.logs.map(
        (l) =>
          ({
            address: l.address,
            data: l.data,
            topics: l.topics,
          }) as Log, // we only keep fields that we use
      ),
      transactionHash: r.hash,
    };
  }
}
