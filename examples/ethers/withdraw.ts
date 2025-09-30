import { abis, cloak } from '../../src/index.js';
import type { Withdrawal } from '../../src/index.js';

import { Contract, FetchRequest, JsonRpcProvider, parseEther, Wallet } from 'ethers';

// We use an Anvil test private key in this example. In production, never hardcode this value.
const ANVIL_TEST_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForFinalization(
  l3Provider: JsonRpcProvider,
  txHash: string,
): Promise<Withdrawal> {
  while (true) {
    // This RPC returns Merkle proofs for finalized withdrawals.
    const ws = await l3Provider.send('scroll_withdrawalsByTransaction', [txHash]);
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

  // Set up the L3 account.
  const l3PrivateKey = ANVIL_TEST_KEY;

  // Set up the Cloak access token.
  // It can be an unlimited admin token, or a limited user token.
  // The Cloak SDK only provides test tokens for devnets.
  const accessToken = c.testToken()!;

  // Create the L2 public and wallet clients.
  // You can use any Scroll endpoint. The default for Scroll Sepolia is 'https://sepolia-rpc.scroll.io'.
  const l2Provider = new JsonRpcProvider(c.l2Endpoint(), undefined, { pollingInterval: 500 });
  const l2Wallet = new Wallet(l2PrivateKey, l2Provider);

  // Create the L3 public and wallet clients.
  // A valid access token must be configured, otherwise some queries will fail with `unauthorized`.
  const request = new FetchRequest(c.l3Endpoint());
  request.setHeader('Authorization', `Bearer ${accessToken}`);
  const l3Provider = new JsonRpcProvider(request, undefined, { pollingInterval: 500 });
  const l3Wallet = new Wallet(l3PrivateKey, l3Provider);

  // Set the token address and the ETH withdrawal amount.
  const l3Token = c.contracts().ValidiumWeth;
  const amount = parseEther('0.0000001');

  // Execute the withdrawal transaction on L3.
  // On L3, ETH is represented as WETH, and behaves like any other ERC20 token.
  // By default, gas is free, so the user does not need any gas tokens.
  console.log(`Initiating withdrawal from ${l3Wallet.address} (L3) to ${l2Wallet.address} (L2)`);

  const validiumERC20Gateway = new Contract(
    c.contracts().ValidiumERC20Gateway,
    abis.ValidiumERC20Gateway,
    l3Wallet,
  );

  const withdrawalTx = await validiumERC20Gateway.withdrawERC20AndCall(
    l3Token,
    l2Wallet.address,
    amount,
    '0x',
    0n,
  );

  const withdrawalHash = withdrawalTx.hash;
  const withdrawalReceipt = await l3Provider.waitForTransaction(withdrawalHash);
  console.log(
    `Withdrawal initiated with transaction hash ${withdrawalHash} and status ${withdrawalReceipt?.status}`,
  );

  // Wait for the withdrawal to be finalized (zk-proven).
  // Depending on the configurations, this could take a few minutes to tens of minutes.
  console.log('Waiting for finalization...');
  const w = await waitForFinalization(l3Provider, withdrawalHash);

  // Execute the claim transaction on L2.
  console.log('Claiming withdrawal on L2...');

  const hostMessenger = new Contract(c.contracts().HostMessenger, abis.HostMessenger, l2Wallet);

  const claimTx = await hostMessenger.relayMessageWithProof(
    w.from,
    w.to,
    BigInt(w.value),
    BigInt(w.nonce),
    w.message,
    { batchIndex: BigInt(w.batch_index), merkleProof: w.proof },
  );

  const claimHash = claimTx.hash;
  const claimReceipt = await l2Provider.waitForTransaction(claimHash);
  console.log(
    `Claim completed with transaction hash ${claimHash} and status ${claimReceipt?.status}`,
  );

  // L3 WETH has been converted to L2 WETH.
  // Now we unwrap the WETH to get ETH on L2.
  console.log('Unwrapping WETH on L2...');

  const hostWeth = new Contract(c.contracts().HostWeth, abis.WrappedETH, l2Wallet);
  const unwrapTx = await hostWeth.withdraw(amount);
  const unwrapHash = unwrapTx.hash;
  const unwrapReceipt = await l2Provider.waitForTransaction(unwrapHash);
  console.log(
    `Unwrap ETH completed with transaction hash ${unwrapHash} and status ${unwrapReceipt?.status}`,
  );
}

main().catch(console.error);
