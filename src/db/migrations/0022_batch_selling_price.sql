ALTER TABLE "inventory_batches" ADD COLUMN "selling_price" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "price" SET DEFAULT '0';--> statement-breakpoint
UPDATE "inventory_batches" ib SET "selling_price" = p."price" FROM "products" p WHERE p.id = ib.product_id;
