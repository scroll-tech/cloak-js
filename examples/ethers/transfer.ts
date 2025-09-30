import { abis, cloak } from '../../src/index.js';

import { Contract, FetchRequest, JsonRpcProvider, parseEther, Wallet } from 'ethers';

// We use an Anvil test private key in this example. In production, never hardcode this value.
const ANVIL_TEST_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

async function main() {
  // Select the Cloak instance.
  // This will configure the correct endpoints and contract addresses.
  // The SDK is stateless, so it is fine to instantiate it multiple times.
  const c = cloak('local-devnet');

  // Set up the L3 account.
  const l3PrivateKey = ANVIL_TEST_KEY;

  // Set up the Cloak access token.
  // It can be an unlimited admin token, or a limited user token.
  // The Cloak SDK only provides test tokens for devnets.
  const accessToken = c.testToken()!;

  // Create the L3 public and wallet clients.
  // A valid access token must be configured, otherwise some queries will fail with `unauthorized`.
  const request = new FetchRequest(c.l3Endpoint());
  request.setHeader('Authorization', `Bearer ${accessToken}`);
  const l3Provider = new JsonRpcProvider(request, undefined, { pollingInterval: 500 });
  const l3Wallet = new Wallet(l3PrivateKey, l3Provider);

  // Set up the transfer recipient address on L3.
  const recipient = Wallet.createRandom();

  // Set the ETH transfer amount.
  let amount = parseEther('0.0000001');

  // Execute the transfer transaction on L3.
  // On L3, ETH is represented as WETH, and behaves like any other ERC20 token.
  // By default, gas is free, so the user does not need any gas tokens.
  console.log(`Initiating transfer from ${l3Wallet.address} (L3) to ${recipient.address} (L3)`);

  const validiumWeth = new Contract(c.contracts().ValidiumWeth, abis.ERC20, l3Wallet);
  const tx = await validiumWeth.transfer(recipient.address, amount);

  const receipt = await l3Provider.waitForTransaction(tx.hash);
  console.log(`Transfer completed with transaction hash ${tx.hash} and status ${receipt?.status}`);
}

main().catch(console.error);
