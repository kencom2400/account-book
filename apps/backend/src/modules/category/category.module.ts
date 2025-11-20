import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryController } from './presentation/controllers/category.controller';
import { CategoryRepository } from './infrastructure/repositories/category.repository';
import { CategoryTypeOrmRepository } from './infrastructure/repositories/category-typeorm.repository';
import { CategoryOrmEntity } from './infrastructure/entities/category.orm-entity';
import { CategoryDomainService } from './domain/services/category-domain.service';
import { InitializeCategoriesUseCase } from './application/use-cases/initialize-categories.use-case';
import { GetCategoriesUseCase } from './application/use-cases/get-categories.use-case';
import { CATEGORY_REPOSITORY } from './domain/repositories/category.repository.interface';

@Module({
  imports: [TypeOrmModule.forFeature([CategoryOrmEntity])],
  controllers: [CategoryController],
  providers: [
    // Repository - TypeORM版を使用（JSON版は予備として残す）
    {
      provide: CATEGORY_REPOSITORY,
      useClass: CategoryTypeOrmRepository,
    },
    CategoryTypeOrmRepository,
    CategoryRepository, // JSONリポジトリは予備として残す
    // Domain Services
    CategoryDomainService,
    // Use Cases
    InitializeCategoriesUseCase,
    GetCategoriesUseCase,
  ],
  exports: [CATEGORY_REPOSITORY, CategoryDomainService],
})
export class CategoryModule {}
