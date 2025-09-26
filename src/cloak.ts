import type { Address, Hash, Hex, TransactionReceipt } from 'viem';

import type {
  CloakChainName,
  ContractConfig,
  DepositFailed,
  DepositInitiated,
  DepositCompleted,
} from './types.js';

import { encrypt } from 'eciesjs';
import { encodeFunctionData, parseEventLogs, decodeFunctionData } from 'viem';

import abis from './abi.js';
import chains from './chains.js';
import { xDomainCalldataHash, l1MessageHash } from './utils.js';

export default function cloak(name: CloakChainName) {
  // Set chain configuration
  if (!chains[name]) throw new Error(`Unknown chain configuration: ${name}`);
  const config = chains[name];

  return {
    l2Endpoint(): string {
      return config.l2Endpoint;
    },

    l3Endpoint(): string {
      return config.l3Endpoint;
    },

    testToken(): string | null {
      return config.testToken;
    },

    contracts(): ContractConfig {
      return config.contracts;
    },

    initDeposit(
      hash: Hash,
      l2Receipt: TransactionReceipt,
      l3Address: Address,
    ): DepositFailed | DepositInitiated {
      // Check if the L2 deposit transaction succeeded.
      const status = l2Receipt?.status || 'timeout';
      if (status !== 'success') return { l2TxHash: hash, l2TxStatus: status } as DepositFailed;

      // Find the QueueTransaction event.
      const logs = parseEventLogs({ abi: abis.HostMessageQueue, logs: l2Receipt.logs });
      const event = logs.find(
        (l) =>
          l.address.toLowerCase() === config.contracts.HostMessageQueue.toLowerCase() &&
          l.eventName === 'QueueTransaction',
      );
      if (!event) return { l2TxHash: hash, l2TxStatus: 'failed' } as DepositFailed;

      // ABI-decode the outer call
      const calldata = event.args.data;

      const relayMessageArgs = decodeFunctionData({
        abi: abis.ValidiumMessenger,
        data: calldata,
      }).args;

      // ABI-decode the inner call
      const finalizeDepositERC20EncryptedArgs = decodeFunctionData({
        abi: abis.ValidiumERC20Gateway,
        data: relayMessageArgs[4] as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      }).args;

      // "Decrypt" by replacing encrypted address with plaintext
      const finalizeDepositERC20Args = [...finalizeDepositERC20EncryptedArgs];
      finalizeDepositERC20Args[3] = l3Address;

      // Re-encode the inner call
      const message = encodeFunctionData({
        abi: abis.ValidiumERC20Gateway,
        functionName: 'finalizeDepositERC20',
        args: finalizeDepositERC20Args as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      });

      // Replace inner message with decrypted message
      const relayMessageDecoded = [...relayMessageArgs];
      relayMessageDecoded[4] = message;

      // Re-encode the outer call
      const calldataDecrypted = encodeFunctionData({
        abi: abis.ValidiumMessenger,
        functionName: 'relayMessage',
        args: relayMessageDecoded as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      });

      return {
        l2TxHash: hash,
        l2TxStatus: 'success',
        queueIndex: event.args.queueIndex,
        l2XDomainCalldataHash: xDomainCalldataHash(relayMessageArgs),
        l3XDomainCalldataHash: xDomainCalldataHash(relayMessageDecoded),
        l2Token: finalizeDepositERC20Args[0],
        l3Token: finalizeDepositERC20Args[1],
        possibleL3TxHashes: {
          // The sequencer will relay the original hash if decryption fails.
          original: l1MessageHash(event.args),
          // The sequencer will relay the decrypted hash if decryption succeeds.
          decrypted: l1MessageHash({ ...event.args, data: calldataDecrypted }),
        },
      } as DepositInitiated;
    },

    completeDeposit(deposit: DepositInitiated, l3Receipt: TransactionReceipt): DepositCompleted {
      if (!l3Receipt) {
        return { ...deposit, l3TxStatus: 'timeout' } as DepositCompleted;
      }
      return {
        ...deposit,
        l3TxHash: l3Receipt.transactionHash,
        l3TxStatus:
          l3Receipt.transactionHash === deposit.possibleL3TxHashes.decrypted
            ? l3Receipt.status
            : 'decryption-failed',
      } as DepositCompleted;
    },

    // encryptAddress encrypts the 20-byte address using the provided encryption key.
    // The address parameter is a hex string, but it is encrypted as a byte array.
    encryptAddress(address: string, encryptionKey: string): Hex {
      const plaintext = Buffer.from(address.replace(/^0x/, ''), 'hex');
      const ciphertext = encrypt(encryptionKey, plaintext);
      return ('0x' + ciphertext.toString('hex')) as Hex;
    },
  };
}
