import { abis, cloak } from '../../src/index.js';

import { createPublicClient, createWalletClient, http, parseEther } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

async function main() {
  // Select the Cloak instance.
  // This will configure the correct endpoints and contract addresses.
  // The SDK is stateless, so it is fine to instantiate it multiple times.
  const c = cloak('local-devnet');

  // Set up the L2 account.
  // Here we use an Anvil test private key. In production, never hardcode this value.
  const l2PrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
  const l2Account = privateKeyToAccount(l2PrivateKey);

  // Set up the Cloak access token.
  // It can be an unlimited admin token, or a limited user token.
  // The Cloak SDK only provides test tokens for devnets.
  const accessToken = c.testToken()!;

  // Set up the L3 account.
  // Here, we generate a fresh deposit account for the user, decoupled from their L2 identity.
  // In production, the private key must be stored securely, and the user's L3 address might
  // be stored in a backend database.
  const l3PrivateKey = generatePrivateKey();
  const l3Account = privateKeyToAccount(l3PrivateKey);

  // Create the L2 public and wallet clients.
  // You can use any Scroll endpoint. The default for Scroll Sepolia is 'https://sepolia-rpc.scroll.io'.
  const l2Client = createPublicClient({ transport: http(c.l2Endpoint()) });
  const l2Wallet = createWalletClient({ transport: http(c.l2Endpoint()), account: l2Account });

  // Create the L3 public client.
  // A valid access token must be configured, otherwise some queries will fail with `unauthorized`.
  const l3Opts = { fetchOptions: { headers: { Authorization: `Bearer ${accessToken}` }}};
  const l3Client = createPublicClient({ transport: http(c.l3Endpoint(), l3Opts) });

  // Fetch the current active encryption key.
  // The key should be fetched regularly, in case it is rotated.
  const [keyId, encryptionKey] = await l2Client.readContract({
    address: c.contracts().HostValidium,
    abi: abis.HostValidium,
    functionName: 'getLatestEncryptionKey',
  });

  // Encrypt the recipient address.
  const recipient = c.encryptAddress(l3Account.address, encryptionKey);

  // Set the ETH deposit amount.
  let amount = parseEther('0.00001');

  // Execute the ETH deposit transaction on L2.
  console.log(`Initiating deposit from ${l2Wallet.account.address} (L2) to ${l3Account.address} (L3)`);

  const hash = await l2Wallet.writeContract({
    chain: null,
    address: c.contracts().HostWethGateway,
    value: amount,
    abi: abis.HostWethGateway,
    functionName: 'deposit',
    args: [recipient, amount, keyId],
  });

  // Wait for transaction receipt on L2.
  const l2Receipt = await l2Client.waitForTransactionReceipt({ hash, pollingInterval: 500 });

  // Process deposit: Extract the deposit details, and prepare for tracking L3 inclusion.
  let deposit = c.initDeposit(hash, l2Receipt, l3Account.address)

  // Possible L2 statuses: 'success' | 'reverted' | 'timeout'
  if (deposit.l2TxStatus !== 'success') throw 'Deposit transaction failed';

  // Wait until the deposit is processed on L3 (normally within a few seconds).
  // Note: If the recipient address is encrypted incorrectly, this will never resolve,
  // and deposit.possibleL3TxHashes.original will be included instead.
  console.log('Waiting for deposit to be processed...');
  const l3Receipt = await l3Client.waitForTransactionReceipt({ hash: deposit.possibleL3TxHashes.decrypted!, pollingInterval: 500 });

  // Update tracking with L3 information.
  deposit = c.completeDeposit(deposit, l3Receipt);
  console.log('Deposit completed', deposit);
}

main().catch(console.error);
