CREATE TABLE "combo_deals" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"image_url" text,
	"price" numeric(12, 2) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "combo_deals_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "combo_deal_items" (
	"id" text PRIMARY KEY NOT NULL,
	"combo_deal_id" text NOT NULL,
	"product_id" text,
	"quantity" integer DEFAULT 1 NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "combo_deal_id" text;
--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "combo_deal_name" text;
--> statement-breakpoint
ALTER TABLE "combo_deal_items" ADD CONSTRAINT "combo_deal_items_combo_deal_id_combo_deals_id_fk" FOREIGN KEY ("combo_deal_id") REFERENCES "public"."combo_deals"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "combo_deal_items" ADD CONSTRAINT "combo_deal_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_combo_deal_id_combo_deals_id_fk" FOREIGN KEY ("combo_deal_id") REFERENCES "public"."combo_deals"("id") ON DELETE set null ON UPDATE no action;
