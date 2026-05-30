ALTER TABLE "receipts" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "receipts" ADD COLUMN "sales_rep" text;--> statement-breakpoint
ALTER TABLE "receipts" DROP COLUMN "printed_by";