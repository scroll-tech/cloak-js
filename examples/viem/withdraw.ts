import { abis, cloak } from '../../src/index.js';
import type { Withdrawal, ScrollRpcSchema } from '../../src/index.js';

import { createPublicClient, createWalletClient, http, parseEther, rpcSchema } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// We use an Anvil test private key in this example. In production, never hardcode this value.
const ANVIL_TEST_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForFinalization(l3Client: any, txHash: string): Promise<Withdrawal> {
  while (true) {
    const ws = await l3Client.request({
      // This RPC returns Merkle proofs for finalized withdrawals.
      method: 'scroll_withdrawalsByTransaction',
      params: [txHash],
    });
    if (ws.length > 0) return ws[0];
    await sleep(5000);
  }
}

async function main() {
  // Select the Cloak instance.
  // This will configure the correct endpoints and contract addresses.
  // The SDK is stateless, so it is fine to instantiate it multiple times.
  const c = cloak('local-devnet');

  // Set up the L2 account.
  const l2PrivateKey = ANVIL_TEST_KEY;
  const l2Account = privateKeyToAccount(l2PrivateKey);

  // Set up the L3 account.
  const l3PrivateKey = ANVIL_TEST_KEY;
  const l3Account = privateKeyToAccount(l3PrivateKey);

  // Set up the Cloak access token.
  // It can be an unlimited admin token, or a limited user token.
  // The Cloak SDK only provides test tokens for devnets.
  const accessToken = c.testToken()!;

  // Create the L2 public and wallet clients.
  // You can use any Scroll endpoint. The default for Scroll Sepolia is 'https://sepolia-rpc.scroll.io'.
  const l2Client = createPublicClient({ transport: http(c.l2Endpoint()) });
  const l2Wallet = createWalletClient({ transport: http(c.l2Endpoint()), account: l2Account });

  // Create the L3 public client.
  // A valid access token must be configured, otherwise some queries will fail with `unauthorized`.
  const l3Opts = { fetchOptions: { headers: { Authorization: `Bearer ${accessToken}` } } };
  const l3Client = createPublicClient({
    transport: http(c.l3Endpoint(), l3Opts),
    rpcSchema: rpcSchema<ScrollRpcSchema>(),
  });
  const l3Wallet = createWalletClient({
    transport: http(c.l3Endpoint(), l3Opts),
    account: l3Account,
  });

  // Set the token address and the ETH withdrawal amount.
  const l3Token = c.contracts().ValidiumWeth;
  const amount = parseEther('0.0000001');

  // Execute the withdrawal transaction on L3.
  // On L3, ETH is represented as WETH, and behaves like any other ERC20 token.
  // By default, gas is free, so the user does not need any gas tokens.
  console.log(
    `Initiating withdrawal from ${l3Wallet.account.address} (L3) to ${l2Account.address} (L2)`,
  );

  const withdrawalHash = await l3Wallet.writeContract({
    chain: null,
    address: c.contracts().ValidiumERC20Gateway,
    abi: abis.ValidiumERC20Gateway,
    functionName: 'withdrawERC20AndCall',
    args: [l3Token, l2Account.address, amount, '0x', 0n],
  });

  const withdrawalReceipt = await l3Client.waitForTransactionReceipt({
    hash: withdrawalHash,
    pollingInterval: 500,
  });
  console.log(
    `Withdrawal initiated with transaction hash ${withdrawalHash} and status ${withdrawalReceipt?.status}`,
  );

  // Wait for the withdrawal to be finalized (zk-proven).
  // Depending on the configurations, this could take a few minutes to tens of minutes.
  console.log('Waiting for finalization...');
  const w = await waitForFinalization(l3Client, withdrawalHash);

  // Execute the claim transaction on L2.
  console.log('Claiming withdrawal on L2...');

  const claimHash = await l2Wallet.writeContract({
    chain: null,
    address: c.contracts().HostMessenger,
    abi: abis.HostMessenger,
    functionName: 'relayMessageWithProof',
    args: [
      w.from,
      w.to,
      BigInt(w.value),
      BigInt(w.nonce),
      w.message,
      { batchIndex: BigInt(w.batch_index), merkleProof: w.proof },
    ],
  });

  const claimReceipt = await l2Client.waitForTransactionReceipt({
    hash: claimHash,
    pollingInterval: 500,
  });
  console.log(
    `Claim completed with transaction hash ${claimHash} and status ${claimReceipt?.status}`,
  );

  // L3 WETH has been converted to L2 WETH.
  // Now we unwrap the WETH to get ETH on L2.
  console.log('Unwrapping WETH on L2...');

  const unwrapHash = await l2Wallet.writeContract({
    chain: null,
    address: c.contracts().HostWeth,
    abi: abis.WrappedETH,
    functionName: 'withdraw',
    args: [amount],
  });

  const unwrapReceipt = await l2Client.waitForTransactionReceipt({
    hash: unwrapHash,
    pollingInterval: 500,
  });
  console.log(
    `Unwrap ETH completed with transaction hash ${unwrapHash} and status ${unwrapReceipt?.status}`,
  );
}

main().catch(console.error);
