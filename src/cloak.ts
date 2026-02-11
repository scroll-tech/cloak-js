import type { Address, Hex } from 'viem';

import type {
  AnyReceipt,
  ChainConfig,
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
import { normalizeReceipt } from './compat.js';
import { xDomainCalldataHash, l1MessageHash } from './utils.js';

export default function cloak(chainOrConfig: CloakChainName | ChainConfig) {
  // Set chain configuration
  const config: ChainConfig =
    typeof chainOrConfig === 'string' ? chains[chainOrConfig] : chainOrConfig;

  if (!config) {
    throw new Error(`Unknown chain configuration: ${String(chainOrConfig)}`);
  }

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

    // encryptAddress encrypts the 20-byte address using the provided encryption key.
    // The address parameter is a hex string, but it is encrypted as a byte array.
    encryptAddress(address: string, encryptionKey: string): Hex {
      const plaintext = Buffer.from(address.replace(/^0x/, ''), 'hex');
      const ciphertext = encrypt(encryptionKey, plaintext);
      return ('0x' + ciphertext.toString('hex')) as Hex;
    },

    trackDeposit(l2Receipt: AnyReceipt, l3Address: Address): DepositFailed | DepositInitiated {
      // Normalize receipt to common format
      const receipt = normalizeReceipt(l2Receipt);

      // Check if the L2 deposit transaction succeeded.
      if (receipt.status !== 'success')
        return { l2TxHash: receipt.transactionHash, l2TxStatus: receipt.status } as DepositFailed;

      // Find the QueueTransaction event.
      const logs = parseEventLogs({ abi: abis.HostMessageQueue, logs: receipt.logs });

      const event = logs.find(
        (l) =>
          l.address.toLowerCase() === config.contracts.HostMessageQueue.toLowerCase() &&
          l.eventName === 'QueueTransaction',
      );

      if (!event) {
        return { l2TxHash: receipt.transactionHash, l2TxStatus: 'failed' } as DepositFailed;
      }

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
        l2TxHash: receipt.transactionHash,
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

    completeDeposit(deposit: DepositInitiated, l3Receipt: AnyReceipt | null): DepositCompleted {
      if (!l3Receipt) return { ...deposit, l3TxStatus: 'timeout' } as DepositCompleted;

      // Normalize receipt to common format
      const receipt = normalizeReceipt(l3Receipt);

      return {
        ...deposit,
        l3TxHash: receipt.transactionHash,
        l3TxStatus:
          receipt.transactionHash === deposit.possibleL3TxHashes.decrypted
            ? receipt.status
            : 'decryption-failed',
      } as DepositCompleted;
    },
  };
}
