CREATE TABLE IF NOT EXISTS "stock_notifications" (
  "id"          text PRIMARY KEY NOT NULL,
  "product_id"  text NOT NULL,
  "name"        text NOT NULL,
  "email"       text NOT NULL,
  "phone"       text,
  "notified_at" timestamp,
  "created_at"  timestamp DEFAULT now() NOT NULL
);
