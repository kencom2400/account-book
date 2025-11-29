import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { CategoryType } from '@account-book/types';

describe('Category CRUD (e2e)', () => {
  let app: INestApplication;
  let createdCategoryId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /categories', () => {
    it('新しい費目を作成できる', () => {
      return request(app.getHttpServer())
        .post('/categories')
        .send({
          name: 'E2Eテスト費目',
          type: CategoryType.EXPENSE,
          icon: '🧪',
          color: '#4CAF50',
        })
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty('id');
          expect(response.body.name).toBe('E2Eテスト費目');
          expect(response.body.type).toBe(CategoryType.EXPENSE);
          expect(response.body.icon).toBe('🧪');
          expect(response.body.color).toBe('#4CAF50');
          expect(response.body.isSystemDefined).toBe(false);
          createdCategoryId = response.body.id;
        });
    });

    it('必須項目が不足している場合は400エラーを返す', () => {
      return request(app.getHttpServer())
        .post('/categories')
        .send({
          // nameが不足
          type: CategoryType.EXPENSE,
        })
        .expect(400);
    });

    it('無効なカラーコードの場合は400エラーを返す', () => {
      return request(app.getHttpServer())
        .post('/categories')
        .send({
          name: '無効カラー',
          type: CategoryType.EXPENSE,
          color: 'invalid-color',
        })
        .expect(400);
    });

    it('同名の費目は作成できない', () => {
      return request(app.getHttpServer())
        .post('/categories')
        .send({
          name: 'E2Eテスト費目', // 既に作成済み
          type: CategoryType.EXPENSE,
        })
        .expect(409);
    });
  });

  describe('GET /categories/:id', () => {
    it('IDで費目を取得できる', () => {
      return request(app.getHttpServer())
        .get(`/categories/${createdCategoryId}`)
        .expect(200)
        .then((response) => {
          expect(response.body.id).toBe(createdCategoryId);
          expect(response.body.name).toBe('E2Eテスト費目');
        });
    });

    it('存在しないIDの場合は404エラーを返す', () => {
      return request(app.getHttpServer())
        .get('/categories/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  describe('PUT /categories/:id', () => {
    it('費目を更新できる', () => {
      return request(app.getHttpServer())
        .put(`/categories/${createdCategoryId}`)
        .send({
          name: 'E2Eテスト費目（更新）',
          icon: '🔬',
          color: '#2196F3',
        })
        .expect(200)
        .then((response) => {
          expect(response.body.id).toBe(createdCategoryId);
          expect(response.body.name).toBe('E2Eテスト費目（更新）');
          expect(response.body.icon).toBe('🔬');
          expect(response.body.color).toBe('#2196F3');
        });
    });

    it('存在しないIDの場合は404エラーを返す', () => {
      return request(app.getHttpServer())
        .put('/categories/00000000-0000-0000-0000-000000000000')
        .send({
          name: '更新',
        })
        .expect(404);
    });
  });

  describe('GET /categories/:id/usage', () => {
    it('費目の使用状況を確認できる', () => {
      return request(app.getHttpServer())
        .get(`/categories/${createdCategoryId}/usage`)
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('isUsed');
          expect(response.body).toHaveProperty('usageCount');
          expect(response.body).toHaveProperty('transactionSamples');
          expect(Array.isArray(response.body.transactionSamples)).toBe(true);
        });
    });

    it('存在しないIDの場合は404エラーを返す', () => {
      return request(app.getHttpServer())
        .get('/categories/00000000-0000-0000-0000-000000000000/usage')
        .expect(404);
    });
  });

  describe('DELETE /categories/:id', () => {
    it('費目を削除できる', () => {
      return request(app.getHttpServer())
        .delete(`/categories/${createdCategoryId}`)
        .expect(200)
        .then((response) => {
          expect(response.body.success).toBe(true);
          expect(response.body).toHaveProperty('replacedCount');
          expect(response.body).toHaveProperty('message');
        });
    });

    it('削除済みの費目は取得できない', () => {
      return request(app.getHttpServer())
        .get(`/categories/${createdCategoryId}`)
        .expect(404);
    });

    it('存在しないIDの場合は404エラーを返す', () => {
      return request(app.getHttpServer())
        .delete('/categories/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  describe('カラーコードバリデーション', () => {
    it('#RGB形式を受け入れる', async () => {
      const response = await request(app.getHttpServer())
        .post('/categories')
        .send({
          name: 'RGB形式テスト',
          type: CategoryType.EXPENSE,
          color: '#FFF',
        })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/categories/${response.body.id}`)
        .expect(200);
    });

    it('#RRGGBB形式を受け入れる', async () => {
      const response = await request(app.getHttpServer())
        .post('/categories')
        .send({
          name: 'RRGGBB形式テスト',
          type: CategoryType.EXPENSE,
          color: '#FFFFFF',
        })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/categories/${response.body.id}`)
        .expect(200);
    });

    it('#RRGGBBAA形式を受け入れる', async () => {
      const response = await request(app.getHttpServer())
        .post('/categories')
        .send({
          name: 'RRGGBBAA形式テスト',
          type: CategoryType.EXPENSE,
          color: '#FFFFFFFF',
        })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/categories/${response.body.id}`)
        .expect(200);
    });
  });

  describe('NFKC正規化による重複チェック', () => {
    let testCategoryId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/categories')
        .send({
          name: 'testcategory',
          type: CategoryType.EXPENSE,
        })
        .expect(201);

      testCategoryId = response.body.id;
    });

    afterAll(async () => {
      if (testCategoryId) {
        await request(app.getHttpServer())
          .delete(`/categories/${testCategoryId}`)
          .expect(200);
      }
    });

    it('大文字小文字の違いを無視する', () => {
      return request(app.getHttpServer())
        .post('/categories')
        .send({
          name: 'TESTCATEGORY', // 大文字
          type: CategoryType.EXPENSE,
        })
        .expect(409);
    });
  });
});
