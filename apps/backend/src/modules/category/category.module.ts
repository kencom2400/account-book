import { Module } from '@nestjs/common';
import { CategoryController } from './presentation/controllers/category.controller';
import { CategoryRepository } from './infrastructure/repositories/category.repository';
import { CategoryDomainService } from './domain/services/category-domain.service';
import { InitializeCategoriesUseCase } from './application/use-cases/initialize-categories.use-case';
import { GetCategoriesUseCase } from './application/use-cases/get-categories.use-case';
import { CATEGORY_REPOSITORY } from './domain/repositories/category.repository.interface';

@Module({
  controllers: [CategoryController],
  providers: [
    // Repository
    {
      provide: CATEGORY_REPOSITORY,
      useClass: CategoryRepository,
    },
    // Domain Services
    CategoryDomainService,
    // Use Cases
    InitializeCategoriesUseCase,
    GetCategoriesUseCase,
  ],
  exports: [CATEGORY_REPOSITORY, CategoryDomainService],
})
export class CategoryModule {}

