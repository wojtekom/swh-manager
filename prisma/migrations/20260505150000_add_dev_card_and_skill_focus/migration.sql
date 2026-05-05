-- CreateTable: skill_definitions (87 umiejętności wg Grutha)
CREATE TABLE "skill_definitions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "expectedU8" TEXT,
    "expectedU10" TEXT,
    "expectedU12" TEXT,
    "expectedU14" TEXT,

    CONSTRAINT "skill_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: player_skill_assessments (oceny W/T/D/O)
CREATE TABLE "player_skill_assessments" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "notes" TEXT,
    "assessedBy" TEXT,
    "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "player_skill_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable: player_fitness_tests (testy sprawnościowe / Test Rolkarza)
CREATE TABLE "player_fitness_tests" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "testType" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "testDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "player_fitness_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable: session_skill_focus (powiązanie sesji treningowej z umiejętnościami)
CREATE TABLE "session_skill_focus" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "intensity" TEXT NOT NULL DEFAULT 'TRAIN',

    CONSTRAINT "session_skill_focus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "skill_definitions_code_key" ON "skill_definitions"("code");
CREATE INDEX "skill_definitions_category_idx" ON "skill_definitions"("category");

CREATE INDEX "player_skill_assessments_playerId_idx" ON "player_skill_assessments"("playerId");
CREATE INDEX "player_skill_assessments_skillId_idx" ON "player_skill_assessments"("skillId");

CREATE INDEX "player_fitness_tests_playerId_idx" ON "player_fitness_tests"("playerId");
CREATE INDEX "player_fitness_tests_testType_idx" ON "player_fitness_tests"("testType");

CREATE INDEX "session_skill_focus_sessionId_idx" ON "session_skill_focus"("sessionId");
CREATE INDEX "session_skill_focus_skillId_idx" ON "session_skill_focus"("skillId");
CREATE UNIQUE INDEX "session_skill_focus_sessionId_skillId_key" ON "session_skill_focus"("sessionId", "skillId");

-- AddForeignKey
ALTER TABLE "player_skill_assessments" ADD CONSTRAINT "player_skill_assessments_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "player_skill_assessments" ADD CONSTRAINT "player_skill_assessments_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skill_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "player_fitness_tests" ADD CONSTRAINT "player_fitness_tests_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "session_skill_focus" ADD CONSTRAINT "session_skill_focus_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "training_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "session_skill_focus" ADD CONSTRAINT "session_skill_focus_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skill_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
