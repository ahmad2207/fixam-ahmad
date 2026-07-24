-- Replace Flutterwave with Paystack as the online payment provider
ALTER TABLE "payment_transactions" RENAME COLUMN "flutterwave_tx_ref" TO "paystack_reference";--> statement-breakpoint
ALTER TABLE "payment_transactions" RENAME COLUMN "flutterwave_transaction_id" TO "paystack_transaction_id";
