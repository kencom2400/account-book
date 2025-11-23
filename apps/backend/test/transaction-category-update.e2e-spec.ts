import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { CategoryType, TransactionStatus } from '@account-book/types';
import { TransactionModule } from '../src/modules/transaction/transaction.module';
import { CategoryModule } from '../src/modules/category/category.module';
import { ConfigModule } from '@nestjs/config';

describe('Transaction Category Update (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        TransactionModule,
        CategoryModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    // 各テストで作成したトランザクションと変更履歴をクリーンアップ
    // TODO: 実際のデータベースクリーンアップ処理を実装
    // - トランザクションの削除
    // - 変更履歴の削除
    // 現時点では、テストごとにユニークなIDを使用することで回避
  });

  afterAll(async () => {
    await app.close();
  });

  describe('PATCH /transactions/:id/category', () => {
    it('取引のカテゴリを更新できる', async () => {
      // まず取引を作成
      const createResponse = await request(app.getHttpServer())
        .post('/transactions')
        .send({
          date: '2025-01-15',
          amount: -1500,
          category: {
            id: 'cat-001',
            name: '食費',
            type: CategoryType.EXPENSE,
          },
          description: 'スターバックス',
          institutionId: 'inst-001',
          accountId: 'acc-001',
          status: TransactionStatus.COMPLETED,
        })
        .expect(201);

      const transactionId = createResponse.body.data.id;

      // カテゴリを更新
      const updateResponse = await request(app.getHttpServer())
        .patch(`/transactions/${transactionId}/category`)
        .send({
          category: {
            id: 'cat-002',
            name: '交通費',
            type: CategoryType.EXPENSE,
          },
        })
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.category.id).toBe('cat-002');
      expect(updateResponse.body.data.category.name).toBe('交通費');
      expect(updateResponse.body.data.category.type).toBe(CategoryType.EXPENSE);
    });

    it('存在しない取引IDでエラーが返される', async () => {
      await request(app.getHttpServer())
        .patch('/transactions/non-existent/category')
        .send({
          category: {
            id: 'cat-002',
            name: '交通費',
            type: CategoryType.EXPENSE,
          },
        })
        .expect(404);
    });

    it('無効なカテゴリでバリデーションエラーが返される', async () => {
      // まず取引を作成
      const createResponse = await request(app.getHttpServer())
        .post('/transactions')
        .send({
          date: '2025-01-15',
          amount: -1500,
          category: {
            id: 'cat-001',
            name: '食費',
            type: CategoryType.EXPENSE,
          },
          description: 'スターバックス',
          institutionId: 'inst-001',
          accountId: 'acc-001',
          status: TransactionStatus.COMPLETED,
        })
        .expect(201);

      const transactionId = createResponse.body.data.id;

      // カテゴリなしで更新を試みる
      await request(app.getHttpServer())
        .patch(`/transactions/${transactionId}/category`)
        .send({})
        .expect(400);
    });
  });
});
