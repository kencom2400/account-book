import { DataSource } from 'typeorm';
import { SubcategoryOrmEntity } from '../entities/subcategory.orm-entity';
import { MerchantOrmEntity } from '../entities/merchant.orm-entity';
import { subcategorySeedData } from './subcategories.seed';
import { merchantSeedData } from './merchants.seed';

/**
 * シードデータ投入スクリプト
 * サブカテゴリと店舗マスタの初期データをデータベースに投入
 */
export async function seedCategoryData(dataSource: DataSource): Promise<void> {
  const subcategoryRepository = dataSource.getRepository(SubcategoryOrmEntity);
  const merchantRepository = dataSource.getRepository(MerchantOrmEntity);

  console.log('🌱 Seeding subcategories...');
  // サブカテゴリのシードデータ投入
  for (const data of subcategorySeedData) {
    const existing = await subcategoryRepository.findOne({
      where: { id: data.id },
    });

    if (!existing) {
      const entity = subcategoryRepository.create({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await subcategoryRepository.save(entity);
      console.log(`  ✓ Created subcategory: ${data.name} (${data.id})`);
    } else {
      console.log(`  - Skipped subcategory: ${data.name} (already exists)`);
    }
  }

  console.log('🌱 Seeding merchants...');
  // 店舗マスタのシードデータ投入
  for (const data of merchantSeedData) {
    const existing = await merchantRepository.findOne({
      where: { id: data.id },
    });

    if (!existing) {
      const entity = merchantRepository.create({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await merchantRepository.save(entity);
      console.log(`  ✓ Created merchant: ${data.name} (${data.id})`);
    } else {
      console.log(`  - Skipped merchant: ${data.name} (already exists)`);
    }
  }

  console.log('✅ Seeding completed!');
}
