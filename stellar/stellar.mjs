// stellar.mjs

import * as StellarSdk from "@stellar/stellar-sdk";
import fetch from "node-fetch";

// Create server instance
const server = new StellarSdk.Horizon.Server("https://horizon-testnet.stellar.org");

const NETWORK =
  process.env.NETWORK === "PUBLIC"
    ? StellarSdk.Networks.PUBLIC
    : StellarSdk.Networks.TESTNET;

// Create random keypair
export function createKeypair() {
  const pair = StellarSdk.Keypair.random();
  return { publicKey: pair.publicKey(), secret: pair.secret() };
}

// Fund with friendbot (only works on testnet)
export async function fundWithFriendbot(publicKey) {
  const resp = await fetch(
    `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`
  );
  if (!resp.ok) throw new Error(`Friendbot failed: ${await resp.text()}`);
  return resp.json();
}

// Get account balances
export async function getBalance(publicKey) {
  const account = await server.loadAccount(publicKey);
  return account.balances;
}

// Send XLM payment
export async function sendXLM({ sourceSecret, destinationPublic, amount }) {
  const sourceKP = StellarSdk.Keypair.fromSecret(sourceSecret);
  const account = await server.loadAccount(sourceKP.publicKey());
  const fee = await server.fetchBaseFee();

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee,
    networkPassphrase: NETWORK,
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination: destinationPublic,
        asset: StellarSdk.Asset.native(),
        amount: amount.toString(),
      })
    )
    .setTimeout(30)
    .build();

  tx.sign(sourceKP);
  return server.submitTransaction(tx);
}

// Get paginated payment history
export async function getPayments(publicKey, { limit = 20, cursor } = {}) {
  let builder = server.payments().forAccount(publicKey).limit(limit);
  if (cursor) builder = builder.cursor(cursor);
  return builder.order("desc").call();
}

export { server, NETWORK };