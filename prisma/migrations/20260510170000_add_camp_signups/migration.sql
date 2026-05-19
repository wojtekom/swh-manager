-- CreateEnum: TransportType (autokar SWH / własny transport)
CREATE TYPE "TransportType" AS ENUM ('BUS', 'OWN');

-- AlterTable: camps — nowe pola dla zapisów rodziców
ALTER TABLE "camps" ADD COLUMN "priceAthleteBus" DOUBLE PRECISION;
ALTER TABLE "camps" ADD COLUMN "priceAthleteOwn" DOUBLE PRECISION;
ALTER TABLE "camps" ADD COLUMN "priceCompanionBus" DOUBLE PRECISION;
ALTER TABLE "camps" ADD COLUMN "priceCompanionOwn" DOUBLE PRECISION;
ALTER TABLE "camps" ADD COLUMN "signupOpen" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "camps" ADD COLUMN "signupDeadline" TIMESTAMP(3);
ALTER TABLE "camps" ADD COLUMN "maxCompanionsPerFamily" INTEGER NOT NULL DEFAULT 3;
ALTER TABLE "camps" ADD COLUMN "bankAccount" TEXT;
ALTER TABLE "camps" ADD COLUMN "bankAccountHolder" TEXT;
ALTER TABLE "camps" ADD COLUMN "paymentTitleTemplate" TEXT;
ALTER TABLE "camps" ADD COLUMN "depositAmount" DOUBLE PRECISION;
ALTER TABLE "camps" ADD COLUMN "depositDeadlineDays" INTEGER NOT NULL DEFAULT 7;
ALTER TABLE "camps" ADD COLUMN "fullPaymentDeadline" TIMESTAMP(3);

-- AlterTable: camp_registrations — dane z formularza rodzica
ALTER TABLE "camp_registrations" ADD COLUMN "transportType" "TransportType" NOT NULL DEFAULT 'BUS';
ALTER TABLE "camp_registrations" ADD COLUMN "totalCost" DOUBLE PRECISION;

-- CreateTable: camp_family_signups (zapis rodziny — towarzysze + transport rodziny)
CREATE TABLE "camp_family_signups" (
    "id" TEXT NOT NULL,
    "campId" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "companionsCount" INTEGER NOT NULL DEFAULT 0,
    "companionNames" TEXT,
    "transportType" "TransportType" NOT NULL DEFAULT 'BUS',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "camp_family_signups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "camp_family_signups_campId_parentId_key" ON "camp_family_signups"("campId", "parentId");
CREATE INDEX "camp_family_signups_campId_idx" ON "camp_family_signups"("campId");

-- AddForeignKey
ALTER TABLE "camp_family_signups" ADD CONSTRAINT "camp_family_signups_campId_fkey" FOREIGN KEY ("campId") REFERENCES "camps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "camp_family_signups" ADD CONSTRAINT "camp_family_signups_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
