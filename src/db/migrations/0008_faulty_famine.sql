ALTER TABLE "profiles" DROP CONSTRAINT "profiles_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_unique" UNIQUE("user_id");