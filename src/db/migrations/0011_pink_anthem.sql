ALTER TABLE "banners" ALTER COLUMN "image_url" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "banners" ADD COLUMN "banner_type" text DEFAULT 'hero' NOT NULL;