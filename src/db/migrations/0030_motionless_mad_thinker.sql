CREATE TABLE "fixember_prizes" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"image_url" text,
	"is_prize" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fixember_spins" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"user_id" text,
	"guest_email" text,
	"customer_name" text,
	"customer_phone" text,
	"prize_id" text,
	"prize_label" text NOT NULL,
	"is_win" boolean NOT NULL,
	"fulfillment_status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "fixember_spins_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
ALTER TABLE "fixember_spins" ADD CONSTRAINT "fixember_spins_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixember_spins" ADD CONSTRAINT "fixember_spins_prize_id_fixember_prizes_id_fk" FOREIGN KEY ("prize_id") REFERENCES "public"."fixember_prizes"("id") ON DELETE set null ON UPDATE no action;