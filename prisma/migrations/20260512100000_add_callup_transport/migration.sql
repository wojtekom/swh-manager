-- CreateEnum: TransportChoice (wybór transportu przez rodzica)
CREATE TYPE "TransportChoice" AS ENUM ('UNDECIDED', 'BUS', 'OWN', 'NONE');

-- AlterTable: tournaments — nowe pola dla powołań z opłatą i zbiórką
ALTER TABLE "tournaments" ADD COLUMN "transportFee" DOUBLE PRECISION;
ALTER TABLE "tournaments" ADD COLUMN "meetingTime" TIMESTAMP(3);
ALTER TABLE "tournaments" ADD COLUMN "meetingLocation" TEXT;
ALTER TABLE "tournaments" ADD COLUMN "parentDeadline" TIMESTAMP(3);

-- AlterTable: callups — wybór transportu przez rodzica + timestamp powiadomienia
ALTER TABLE "callups" ADD COLUMN "transportChoice" "TransportChoice" NOT NULL DEFAULT 'UNDECIDED';
ALTER TABLE "callups" ADD COLUMN "notifiedAt" TIMESTAMP(3);
