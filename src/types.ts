import type { Address, Hash, Hex, Log, TransactionReceipt as ViemReceipt } from 'viem';
import type { TransactionReceipt as EthersReceipt } from 'ethers';

export type CloakChainName = 'local-devnet';

export interface ContractConfig {
  HostWethGateway: `0x${string}`;
  HostERC20Gateway: `0x${string}`;
  HostMessenger: `0x${string}`;
  HostMessageQueue: `0x${string}`;
  HostValidium: `0x${string}`;
  HostWeth: `0x${string}`;
  HostFastWithdrawVault: `0x${string}`;
  ValidiumERC20Gateway: `0x${string}`;
  ValidiumWeth: `0x${string}`;
}

export interface ChainConfig {
  l2Endpoint: string;
  l3Endpoint: string;
  contracts: ContractConfig;
  testToken: string | null;
}

export interface Withdrawal {
  tx_hash: Hash;
  message_hash: Hash;
  from: Address;
  to: Address;
  value: Hex;
  nonce: number;
  message: Hex;
  batch_index: number;
  proof: Hex;
}

export type ScrollRpcSchema = [
  {
    Method: 'scroll_withdrawalsByTransaction';
    Parameters: [string];
    ReturnType: [Withdrawal];
  },
  {
    Method: 'scroll_withdrawalByMessageHash';
    Parameters: [string];
    ReturnType: Withdrawal | null;
  },
];

export interface DepositFailed {
  l2TxHash: Hash;
  l2TxStatus: 'reverted' | 'failed' | 'timeout';
}

export interface DepositInitiated {
  l2TxHash: Hash;
  l2TxStatus: 'success';
  queueIndex: bigint;
  l2XDomainCalldataHash: Hash;
  l3XDomainCalldataHash: Hash;
  l2Token: Address;
  l3Token: Address;
  possibleL3TxHashes: {
    original: Hash;
    decrypted: Hash;
  };
}

export interface DepositCompleted extends DepositInitiated {
  l3TxHash?: Hash;
  l3TxStatus: 'success' | 'reverted' | 'timeout' | 'decryption-failed';
}

export type AnyReceipt = EthersReceipt | ViemReceipt;

export interface NormalizedReceipt {
  transactionHash: string;
  status: 'success' | 'reverted' | 'pending';
  logs: Log[];
}
