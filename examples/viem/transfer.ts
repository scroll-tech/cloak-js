import { abis, cloak } from "../../src/index.js";

import { createPublicClient, createWalletClient, http, parseEther } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

async function main() {
  // Select the Cloak instance.
  // This will configure the correct endpoints and contract addresses.
  // The SDK is stateless, so it is fine to instantiate it multiple times.
  const c = cloak('local-devnet');

  // Set up the L3 account.
  // Here we use an Anvil test private key. In production, never hardcode this value.
  const l3PrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
  const l3Account = privateKeyToAccount(l3PrivateKey);

  // Set up the Cloak access token.
  // It can be an unlimited admin token, or a limited user token.
  // The Cloak SDK only provides test tokens for devnets.
  const accessToken = c.testToken()!;

  // Create the L3 public and wallet clients.
  // A valid access token must be configured, otherwise some queries will fail with `unauthorized`.
  const l3Opts = { fetchOptions: { headers: { Authorization: `Bearer ${accessToken}` }}};
  const l3Client = createPublicClient({ transport: http(c.l3Endpoint(), l3Opts) });
  const l3Wallet = createWalletClient({ transport: http(c.l3Endpoint(), l3Opts), account: l3Account });

  // Set up the transfer recipient address on L3.
  const recipient = privateKeyToAccount(generatePrivateKey());

  // Set the ETH transfer amount.
  let amount = parseEther('0.0000001');

  // Execute the transfer transaction on L3.
  // On L3, ETH is represented as WETH, and behaves like any other ERC20 token.
  // By default, gas is free, so the user does not need any gas tokens.
  console.log(`Initiating transfer from ${l3Wallet.account.address} (L3) to ${recipient.address} (L3)`);

  const hash = await l3Wallet.writeContract({
    chain: null,
    address: c.contracts().ValidiumWeth,
    abi: abis.ERC20,
    functionName: 'transfer',
    args: [recipient.address, amount],
  });

  const receipt = await l3Client.waitForTransactionReceipt({ hash, pollingInterval: 500 });
  console.log(`Transfer completed with transaction hash ${hash} and status ${receipt?.status}`);
}

main().catch(console.error);
