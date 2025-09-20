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

// Send XLM payment with company fee bridge
export async function sendXLMWithBridge({ 
    sourceSecret, 
    destinationPublic, 
    amount, 
    companyWallet,
    feePercentage = 25 // Default 25% fee
}) {
    try {
        if (!companyWallet) {
            throw new Error('Company wallet address is required')
        }

        // Calculate amounts
        const totalAmount = parseFloat(amount)
        const companyFee = (totalAmount * feePercentage) / 100
        const instructorAmount = totalAmount - companyFee

        console.log(`Payment breakdown:`)
        console.log(`Total: ${totalAmount} XLM`)
        console.log(`Company fee (${feePercentage}%): ${companyFee} XLM`)
        console.log(`Instructor receives: ${instructorAmount} XLM`)

        const sourceKP = StellarSdk.Keypair.fromSecret(sourceSecret)
        const account = await server.loadAccount(sourceKP.publicKey())
        const fee = await server.fetchBaseFee()

        // Create transaction with two payment operations
        const transaction = new StellarSdk.TransactionBuilder(account, {
            fee: fee * 2, // Double the fee since we have 2 operations
            networkPassphrase: NETWORK,
        })
        // First payment: Company fee
        .addOperation(
            StellarSdk.Operation.payment({
                destination: companyWallet,
                asset: StellarSdk.Asset.native(),
                amount: companyFee.toFixed(7), // Stellar supports 7 decimal places
            })
        )
        // Second payment: Remaining amount to instructor
        .addOperation(
            StellarSdk.Operation.payment({
                destination: destinationPublic,
                asset: StellarSdk.Asset.native(),
                amount: instructorAmount.toFixed(7),
            })
        )
        .setTimeout(30)
        .build()

        // Sign and submit transaction
        transaction.sign(sourceKP)
        const result = await server.submitTransaction(transaction)

        return {
            success: true,
            transactionHash: result.hash,
            totalAmount,
            companyFee,
            instructorAmount,
            feePercentage,
            companyWallet,
            destinationPublic,
            stellarResponse: result
        }

    } catch (error) {
        console.error('Payment bridge error:', error)
        return {
            success: false,
            error: error.message || 'Payment failed',
            details: error
        }
    }
}

// Get paginated payment history
export async function getPayments(publicKey, { limit = 20, cursor } = {}) {
  let builder = server.payments().forAccount(publicKey).limit(limit);
  if (cursor) builder = builder.cursor(cursor);
  return builder.order("desc").call();
}

export async function getPaymentsWithFees(publicKey, { limit = 20, cursor } = {}) {
  let builder = server.payments().forAccount(publicKey).limit(limit);
  if (cursor) builder = builder.cursor(cursor);

  const payments = await builder.order("desc").call();

  const results = await Promise.all(
    payments.records.map(async (payment) => {
      try {
        const tx = await server.transactions().transaction(payment.transaction_hash).call();

        // Convert stroops → XLM
        const feeInXLM = (parseFloat(tx.fee_charged) / 1e7).toFixed(6);
        const maxFeeInXLM = (parseFloat(tx.max_fee) / 1e7).toFixed(6);

        return {
          fee_charged: feeInXLM,
          fee_account: tx.fee_account,
          max_fee: maxFeeInXLM,
          ...payment, // now Horizon values won't overwrite yours
        };
      } catch (err) {
        return { fee_charged: null, ...payment };
      }
    })
  );

  return results;
}


export { server, NETWORK };