import { PrismaClient } from "@prisma/client";
import {
  CCM_LOD_CATALOG, CCM_LOD_PRODUCTS,
  CCM_ROLKI_CATALOG, CCM_ROLKI_PRODUCTS,
  SPORTREBEL_LOD_CATALOG, SPORTREBEL_LOD_PRODUCTS,
  SPORTREBEL_ROLKI_CATALOG, SPORTREBEL_ROLKI_PRODUCTS,
  TRAINING_AIDS_CATALOG, TRAINING_AIDS_PRODUCTS,
} from "./seed-catalogs";

const prisma = new PrismaClient();

interface CatalogDef {
  name: string;
  supplier: string;
  description: string;
}

interface ProductDef {
  name: string;
  description: string;
  brand: string;
  equipmentCategory: string;
  productCode: string;
  ageGroup: string | null;
  level: string;
  price: number;
  sizes: string[];
}

async function importCatalog(catalogDef: CatalogDef, products: ProductDef[]) {
  // Sprawdź czy katalog już istnieje
  const existing = await prisma.catalog.findFirst({
    where: { name: catalogDef.name },
  });

  if (existing) {
    console.log(`  ⏭️  Katalog "${catalogDef.name}" już istnieje (${existing.id}) - pomijam`);
    return existing;
  }

  // Utwórz katalog
  const catalog = await prisma.catalog.create({
    data: {
      name: catalogDef.name,
      supplier: catalogDef.supplier,
      description: catalogDef.description,
      status: "DRAFT",
    },
  });

  console.log(`  ✅ Utworzono katalog: "${catalog.name}" (${catalog.id})`);

  // Import produktów
  let created = 0;
  for (const product of products) {
    await prisma.product.create({
      data: {
        catalogId: catalog.id,
        name: product.name,
        description: product.description,
        brand: product.brand,
        equipmentCategory: product.equipmentCategory as any,
        productCode: product.productCode,
        ageGroup: product.ageGroup,
        level: product.level,
        price: product.price,
        sizes: product.sizes,
        isActive: true,
      },
    });
    created++;
  }

  console.log(`     📦 Zaimportowano ${created} produktów`);
  return catalog;
}

async function main() {
  console.log("🏒 Importowanie katalogów sprzętu hokejowego SWH...\n");

  // 1. CCM 2026 - Lód
  console.log("📘 Katalog CCM 2026 - Lód:");
  await importCatalog(CCM_LOD_CATALOG, CCM_LOD_PRODUCTS);

  // 2. CCM 2026 - Rolki
  console.log("\n📙 Katalog CCM 2026 - Rolki:");
  await importCatalog(CCM_ROLKI_CATALOG, CCM_ROLKI_PRODUCTS);

  // 3. SportRebel - Lód
  console.log("\n📗 Katalog SportRebel - Lód:");
  await importCatalog(SPORTREBEL_LOD_CATALOG, SPORTREBEL_LOD_PRODUCTS);

  // 4. SportRebel - Rolki
  console.log("\n📕 Katalog SportRebel - Rolki:");
  await importCatalog(SPORTREBEL_ROLKI_CATALOG, SPORTREBEL_ROLKI_PRODUCTS);

  // 5. Pomoce treningowe
  console.log("\n📓 Katalog Pomoce treningowe:");
  await importCatalog(TRAINING_AIDS_CATALOG, TRAINING_AIDS_PRODUCTS);

  console.log("\n✅ Import katalogów zakończony!\n");

  // Podsumowanie
  const catalogCount = await prisma.catalog.count();
  const productCount = await prisma.product.count();
  console.log(`📊 Podsumowanie:`);
  console.log(`   Katalogi: ${catalogCount}`);
  console.log(`   Produkty: ${productCount}`);
}

main()
  .catch((e) => {
    console.error("❌ Błąd importu:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
