/* eslint-disable @typescript-eslint/no-explicit-any */

import { encodeFunctionData, keccak256, concatHex, toHex, toRlp } from 'viem';
import abis from './abi.js';

// xDomainCalldataHash computes cross-domain calldata hash for the given arguments.
// This hash is used in the messenger contracts.
export function xDomainCalldataHash(args: any) {
  return keccak256(
    encodeFunctionData({
      abi: abis.ValidiumMessenger,
      functionName: 'relayMessage',
      args,
    }),
  );
}

// l1MessageHash computes the L1 message hash for the given transaction arguments.
export function l1MessageHash(txArgs: any) {
  const { queueIndex, gasLimit, target, value, data, sender } = txArgs;

  // Make sure 0 value is represented as '0x',
  // see https://github.com/wevm/viem/issues/382.
  const args = [queueIndex, gasLimit, target, value, data, sender].map((arg) =>
    arg === 0 || arg === 0n ? '0x' : typeof arg === 'string' ? arg : toHex(arg),
  );

  const encoded = toRlp(args as any);
  return keccak256(concatHex(['0x7e', encoded]));
}
