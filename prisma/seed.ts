import { PrismaClient } from "@prisma/client";
import { DRILLS, TRAINING_PLANS, HLH_TOURNAMENTS, CAMPS } from "./seed-data";

const prisma = new PrismaClient();

async function main() {
  console.log("🏒 Importowanie programu szkoleniowego SWH 2025/2026...\n");

  // 1. Znajdź lub utwórz admin usera (potrzebny jako createdBy)
  let admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: "admin@swh-siedlce.pl",
        passwordHash: "$2a$12$placeholder", // placeholder - zmienić po pierwszym logowaniu
        name: "Admin SWH",
        role: "ADMIN",
      },
    });
    console.log("✅ Utworzono konto admin: admin@swh-siedlce.pl");
  }

  // 2. Import ćwiczeń (drills)
  console.log(`\n📋 Importowanie ${DRILLS.length} ćwiczeń...`);
  let drillsCreated = 0;
  const drillMap = new Map<string, string>(); // name -> id

  for (const drill of DRILLS) {
    const existing = await prisma.drill.findFirst({ where: { name: drill.name } });
    if (existing) {
      drillMap.set(drill.name, existing.id);
      continue;
    }
    const created = await prisma.drill.create({
      data: {
        name: drill.name,
        category: drill.category as any,
        description: drill.description,
        difficulty: drill.difficulty,
        ageGroups: drill.ageGroups,
        duration: drill.duration,
        createdById: admin.id,
      },
    });
    drillMap.set(drill.name, created.id);
    drillsCreated++;
  }
  console.log(`  ✅ Utworzono ${drillsCreated} nowych ćwiczeń (${DRILLS.length - drillsCreated} już istniało)`);

  // 3. Import planów treningowych z sesjami
  console.log(`\n📚 Importowanie ${TRAINING_PLANS.length} planów treningowych...`);
  let plansCreated = 0;
  let sessionsCreated = 0;

  for (const plan of TRAINING_PLANS) {
    const existing = await prisma.trainingPlan.findFirst({ where: { name: plan.name } });
    if (existing) {
      console.log(`  ⏭️  Plan "${plan.name}" już istnieje — pomijam`);
      continue;
    }

    const createdPlan = await prisma.trainingPlan.create({
      data: {
        name: plan.name,
        description: plan.description,
        category: plan.category as any,
        createdById: admin.id,
      },
    });
    plansCreated++;

    // Utwórz sesje treningowe
    for (const session of plan.sessions) {
      await prisma.trainingSession.create({
        data: {
          planId: createdPlan.id,
          title: session.title,
          objectives: session.objectives,
          duration: session.duration,
          order: session.order,
        },
      });
      sessionsCreated++;
    }
    console.log(`  ✅ Plan "${plan.name}" — ${plan.sessions.length} sesji`);
  }
  console.log(`  📊 Łącznie: ${plansCreated} planów, ${sessionsCreated} sesji treningowych`);

  // 4. Import turniejów HLH
  console.log(`\n🏆 Importowanie ${HLH_TOURNAMENTS.length} turniejów HLH...`);
  let tournamentsCreated = 0;

  for (const tournament of HLH_TOURNAMENTS) {
    const existing = await prisma.tournament.findFirst({
      where: { name: tournament.name, startDate: new Date(tournament.startDate) },
    });
    if (existing) continue;

    await prisma.tournament.create({
      data: {
        name: tournament.name,
        location: tournament.location,
        startDate: new Date(tournament.startDate),
        endDate: tournament.endDate ? new Date(tournament.endDate) : null,
        category: tournament.category as any,
        description: tournament.description,
        status: new Date(tournament.startDate) < new Date() ? "COMPLETED" : "PLANNED",
        createdById: admin.id,
      },
    });
    tournamentsCreated++;
  }
  console.log(`  ✅ Utworzono ${tournamentsCreated} turniejów`);

  // 5. Import obozów
  console.log(`\n⛺ Importowanie ${CAMPS.length} obozów...`);
  let campsCreated = 0;

  for (const camp of CAMPS) {
    const existing = await prisma.camp.findFirst({ where: { name: camp.name } });
    if (existing) continue;

    await prisma.camp.create({
      data: {
        name: camp.name,
        type: camp.type as any,
        location: camp.location,
        startDate: new Date(camp.startDate),
        endDate: new Date(camp.endDate),
        category: camp.category as any,
        description: camp.description,
        maxSpots: camp.maxSpots,
        cost: camp.cost,
        status: "PLANNED",
        createdById: admin.id,
      },
    });
    campsCreated++;
  }
  console.log(`  ✅ Utworzono ${campsCreated} obozów`);

  // Podsumowanie
  console.log("\n" + "=".repeat(50));
  console.log("🏒 IMPORT ZAKOŃCZONY POMYŚLNIE!");
  console.log("=".repeat(50));
  console.log(`  Ćwiczenia:          ${drillsCreated}`);
  console.log(`  Plany treningowe:   ${plansCreated}`);
  console.log(`  Sesje treningowe:   ${sessionsCreated}`);
  console.log(`  Turnieje HLH:       ${tournamentsCreated}`);
  console.log(`  Obozy:              ${campsCreated}`);
  console.log("=".repeat(50));
}

main()
  .catch((e) => {
    console.error("❌ Błąd importu:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
