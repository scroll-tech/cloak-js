import type { Address } from '../../src/index.js';
import { abis, cloak } from '../../src/index.js';

import { Contract, FetchRequest, JsonRpcProvider, parseEther, Wallet } from 'ethers';

// We use an Anvil test private key in this example. In production, never hardcode this value.
const ANVIL_TEST_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

async function main() {
  // Select the Cloak instance.
  // This will configure the correct endpoints and contract addresses.
  // The SDK is stateless, so it is fine to instantiate it multiple times.
  const c = cloak('local-devnet');

  // Set up the L2 account.
  const l2PrivateKey = ANVIL_TEST_KEY;

  // Set up the Cloak access token.
  // It can be an unlimited admin token, or a limited user token.
  // The Cloak SDK only provides test tokens for devnets.
  const accessToken = c.testToken()!;

  // Set up the L3 account.
  // Here, we generate a fresh deposit account for the user, decoupled from their L2 identity.
  // In production, the private key must be stored securely, and the user's L3 address might
  // be stored in a backend database.
  const l3Wallet = Wallet.createRandom();

  // Create the L2 public and wallet clients.
  // You can use any Scroll endpoint. The default for Scroll Sepolia is 'https://sepolia-rpc.scroll.io'.
  const l2Provider = new JsonRpcProvider(c.l2Endpoint(), undefined, { pollingInterval: 500 });
  const l2Wallet = new Wallet(l2PrivateKey, l2Provider);

  // Create the L3 public client.
  // A valid access token must be configured, otherwise some queries will fail with `unauthorized`.
  const request = new FetchRequest(c.l3Endpoint());
  request.setHeader('Authorization', `Bearer ${accessToken}`);
  const l3Provider = new JsonRpcProvider(request, undefined, { pollingInterval: 500 });

  // Fetch the current active encryption key.
  // The key should be fetched regularly, in case it is rotated.
  const hostValidium = new Contract(c.contracts().HostValidium, abis.HostValidium, l2Provider);
  const [keyId, encryptionKey] = await hostValidium.getLatestEncryptionKey();

  // Encrypt the recipient address.
  const recipient = c.encryptAddress(l3Wallet.address, encryptionKey);

  // Set the token address and the deposit amount.
  // For simplicity, we use the WETH ERC20 token in this example, but it works the same way for any ERC20.
  const l2Token = c.contracts().HostWeth;
  const amount = parseEther('0.00001'); // assumes 18 decimals

  // Query the deterministic L2 -> L3 token mapping via the ERC20 gateway contract.
  const hostERC20Gateway = new Contract(
    c.contracts().HostERC20Gateway,
    abis.HostERC20Gateway,
    l2Wallet,
  );

  const l3Token = await hostERC20Gateway.getL2ERC20Address(l2Token);

  console.log(`L2 token: ${l2Token}, L3 token: ${l3Token}`);

  // Approve Cloak bridge to spend ERC20.
  const erc20 = new Contract(l2Token, abis.ERC20, l2Wallet);
  const approveTx = await erc20.approve(c.contracts().HostERC20Gateway, amount);
  await l2Provider.waitForTransaction(approveTx.hash);

  // Set the deposit gas limit.
  // Note: For the first deposit with a token, a higher gas limit might be required for the
  // corresponding ERC20 contract deployment on L3, otherwise the transaction might fail.
  const gasLimit = 200_000n;

  // Execute the ETH deposit transaction on L2.
  console.log(`Initiating deposit from ${l2Wallet.address} (L2) to ${l3Wallet.address} (L3)`);

  // Wait for transaction receipt on L2.
  const depositTx = await hostERC20Gateway.depositERC20(
    l2Token,
    recipient,
    amount,
    gasLimit,
    keyId,
  );

  const depositHash = depositTx.hash;
  const depositReceipt = await l2Provider.waitForTransaction(depositHash);
  if (!depositReceipt) throw 'Deposit transaction timeout';

  // Process deposit: Extract the deposit details, and prepare for tracking L3 inclusion.
  let deposit = c.trackDeposit(depositReceipt, l3Wallet.address as Address);

  // Possible L2 statuses: 'success' | 'reverted' | 'timeout'
  if (deposit.l2TxStatus !== 'success') throw 'Deposit transaction failed';

  // Wait until the deposit is processed on L3 (normally within a few seconds).
  // Note: If the recipient address is encrypted incorrectly, this will never resolve,
  // and deposit.possibleL3TxHashes.original will be included instead.
  console.log('Waiting for deposit to be processed...');
  const l3Hash = deposit.possibleL3TxHashes.decrypted;
  const l3Receipt = await l3Provider.waitForTransaction(l3Hash);

  // Update tracking with L3 information.
  deposit = c.completeDeposit(deposit, l3Receipt);
  console.log('Deposit completed', deposit);
}

main().catch(console.error);
