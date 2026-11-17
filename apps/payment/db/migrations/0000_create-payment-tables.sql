-- SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
--
-- SPDX-License-Identifier: Apache-2.0

CREATE TABLE IF NOT EXISTS "Checkouts" (
	"id" serial PRIMARY KEY NOT NULL,
	"publicId" uuid DEFAULT gen_random_uuid() NOT NULL,
	"tenantId" integer NOT NULL,
	"stripeAccountId" varchar(255) NOT NULL,
	"flow" varchar(255) NOT NULL,
	"status" varchar(255) NOT NULL,
	"connectorId" integer,
	"tariffId" integer,
	"tariffSnapshot" jsonb NOT NULL,
	"transactionDatabaseId" integer,
	"currency" char(3) NOT NULL,
	"authorizedAmount" integer,
	"capturedAmount" integer,
	"paymentIntentId" varchar(255),
	"remoteStartStatus" varchar(255),
	"qrDisplayMessageId" integer,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL,
	CONSTRAINT "Checkouts_publicId_key" UNIQUE("publicId"),
	CONSTRAINT "Checkouts_paymentIntentId_key" UNIQUE("paymentIntentId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "PaymentAccounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenantId" integer NOT NULL,
	"stripeAccountId" varchar(255) NOT NULL,
	"scanAndChargeEnabled" boolean DEFAULT false NOT NULL,
	"termsUrl" varchar(2048),
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL,
	CONSTRAINT "PaymentAccounts_tenantId_key" UNIQUE("tenantId"),
	CONSTRAINT "PaymentAccounts_stripeAccountId_key" UNIQUE("stripeAccountId")
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "Checkouts" ADD CONSTRAINT "Checkouts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenants"("id") ON DELETE restrict ON UPDATE cascade;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "Checkouts" ADD CONSTRAINT "Checkouts_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "public"."Connectors"("id") ON DELETE set null ON UPDATE cascade;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "Checkouts" ADD CONSTRAINT "Checkouts_tariffId_fkey" FOREIGN KEY ("tariffId") REFERENCES "public"."Tariffs"("id") ON DELETE set null ON UPDATE cascade;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "PaymentAccounts" ADD CONSTRAINT "PaymentAccounts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenants"("id") ON DELETE restrict ON UPDATE cascade;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "checkouts_tenant_transaction" ON "Checkouts" USING btree ("tenantId","transactionDatabaseId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "checkouts_status_updated" ON "Checkouts" USING btree ("status","updatedAt");