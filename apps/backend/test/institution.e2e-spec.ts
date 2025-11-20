import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { InstitutionType, BankCategory } from '@account-book/types';
import { E2ETestDatabaseHelper } from './helpers/database-helper';

describe('Institution Controller (e2e)', () => {
  let app: INestApplication;
  let dbHelper: E2ETestDatabaseHelper;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Global pipes
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    // API prefix
    app.setGlobalPrefix('api');

    await app.init();

    // データベースヘルパーの初期化
    dbHelper = new E2ETestDatabaseHelper(app);

    // データベース接続確認
    const isConnected: boolean = await dbHelper.checkConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // 各テスト前にデータベースをクリーンアップ
    await dbHelper.cleanDatabase();
  });

  describe('/api/institutions/banks/supported (GET)', () => {
    it('should return supported banks', () => {
      return request(app.getHttpServer())
        .get('/api/institutions/banks/supported')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toBeInstanceOf(Array);
          expect(res.body.count).toBeGreaterThan(0);
          expect(res.body.data[0]).toHaveProperty('id');
          expect(res.body.data[0]).toHaveProperty('code');
          expect(res.body.data[0]).toHaveProperty('name');
          expect(res.body.data[0]).toHaveProperty('category');
        });
    });

    it('should filter by category', () => {
      return request(app.getHttpServer())
        .get('/api/institutions/banks/supported')
        .query({ category: BankCategory.MEGA_BANK })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toBeInstanceOf(Array);
          res.body.data.forEach((bank: any) => {
            expect(bank.category).toBe(BankCategory.MEGA_BANK);
          });
        });
    });

    it('should search by term', () => {
      return request(app.getHttpServer())
        .get('/api/institutions/banks/supported')
        .query({ searchTerm: '三菱' })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toBeInstanceOf(Array);
          expect(res.body.data.length).toBeGreaterThan(0);
          const hasMatchingBank = res.body.data.some((bank: any) =>
            bank.name.includes('三菱'),
          );
          expect(hasMatchingBank).toBe(true);
        });
    });

    it('should return 400 for invalid category', () => {
      return request(app.getHttpServer())
        .get('/api/institutions/banks/supported')
        .query({ category: 'invalid_category' })
        .expect(400);
    });
  });

  describe('/api/institutions/banks/test-connection (POST)', () => {
    it('should return success for valid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/institutions/banks/test-connection')
        .send({
          bankCode: '0000',
          branchCode: '001',
          accountNumber: '1234567',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toBeDefined();
          expect(res.body.data.message).toBeDefined();
          expect(res.body.data.accountInfo).toBeDefined();
        });
    });

    it('should return failure for invalid bank code', () => {
      return request(app.getHttpServer())
        .post('/api/institutions/banks/test-connection')
        .send({
          bankCode: 'invalid',
          branchCode: '001',
          accountNumber: '1234567',
        })
        .expect(400)
        .expect((res) => {
          const message = Array.isArray(res.body.message)
            ? res.body.message.join(' ')
            : res.body.message;
          expect(message).toContain('銀行コードは4桁の数字');
        });
    });

    it('should return failure for invalid branch code', () => {
      return request(app.getHttpServer())
        .post('/api/institutions/banks/test-connection')
        .send({
          bankCode: '0000',
          branchCode: 'ab',
          accountNumber: '1234567',
        })
        .expect(400)
        .expect((res) => {
          const message = Array.isArray(res.body.message)
            ? res.body.message.join(' ')
            : res.body.message;
          expect(message).toContain('支店コードは3桁の数字');
        });
    });

    it('should return failure for invalid account number', () => {
      return request(app.getHttpServer())
        .post('/api/institutions/banks/test-connection')
        .send({
          bankCode: '0000',
          branchCode: '001',
          accountNumber: '123',
        })
        .expect(400)
        .expect((res) => {
          const message = Array.isArray(res.body.message)
            ? res.body.message.join(' ')
            : res.body.message;
          expect(message).toContain('口座番号は7桁の数字');
        });
    });

    it('should accept optional API credentials', () => {
      return request(app.getHttpServer())
        .post('/api/institutions/banks/test-connection')
        .send({
          bankCode: '0000',
          branchCode: '001',
          accountNumber: '1234567',
          apiKey: 'test-api-key',
          apiSecret: 'test-api-secret',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });

    it('should return 400 for missing required fields', () => {
      return request(app.getHttpServer())
        .post('/api/institutions/banks/test-connection')
        .send({
          bankCode: '0000',
          // branchCode missing
          accountNumber: '1234567',
        })
        .expect(400);
    });

    it('should return 400 for extra unexpected fields', () => {
      return request(app.getHttpServer())
        .post('/api/institutions/banks/test-connection')
        .send({
          bankCode: '0000',
          branchCode: '001',
          accountNumber: '1234567',
          unexpectedField: 'value',
        })
        .expect(400);
    });
  });

  describe('/api/institutions (POST)', () => {
    it('should create institution with valid data', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/institutions')
        .send({
          name: 'テスト銀行',
          type: InstitutionType.BANK,
          credentials: {
            bankCode: '0000',
            branchCode: '001',
            accountNumber: '1234567',
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.name).toBe('テスト銀行');
      expect(res.body.data.type).toBe(InstitutionType.BANK);
      expect(res.body.data.isConnected).toBe(false);
      expect(res.body.data.credentials).toBeDefined();
    });

    it('should return 400 for missing name', () => {
      return request(app.getHttpServer())
        .post('/api/institutions')
        .send({
          type: InstitutionType.BANK,
          credentials: {
            bankCode: '0000',
            branchCode: '001',
            accountNumber: '1234567',
          },
        })
        .expect(400);
    });

    it('should return 400 for invalid type', () => {
      return request(app.getHttpServer())
        .post('/api/institutions')
        .send({
          name: 'テスト銀行',
          type: 'invalid_type',
          credentials: {
            bankCode: '0000',
            branchCode: '001',
            accountNumber: '1234567',
          },
        })
        .expect(400);
    });

    it('should return 400 for missing credentials', () => {
      return request(app.getHttpServer())
        .post('/api/institutions')
        .send({
          name: 'テスト銀行',
          type: InstitutionType.BANK,
        })
        .expect(400);
    });

    it('should handle credit card type', () => {
      return request(app.getHttpServer())
        .post('/api/institutions')
        .send({
          name: 'テストカード',
          type: InstitutionType.CREDIT_CARD,
          credentials: {
            cardNumber: '1234567890123456',
            apiKey: 'test-key',
          },
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.data.type).toBe(InstitutionType.CREDIT_CARD);
        });
    });

    it('should handle securities type', () => {
      return request(app.getHttpServer())
        .post('/api/institutions')
        .send({
          name: 'テスト証券',
          type: InstitutionType.SECURITIES,
          credentials: {
            accountId: 'test-account',
            apiKey: 'test-key',
          },
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.data.type).toBe(InstitutionType.SECURITIES);
        });
    });
  });

  describe('/api/institutions (GET)', () => {
    it('should return all institutions', () => {
      return request(app.getHttpServer())
        .get('/api/institutions')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toBeInstanceOf(Array);
          expect(res.body.count).toBeDefined();
        });
    });

    it('should filter by type', () => {
      return request(app.getHttpServer())
        .get('/api/institutions')
        .query({ type: InstitutionType.BANK })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          res.body.data.forEach((institution: any) => {
            expect(institution.type).toBe(InstitutionType.BANK);
          });
        });
    });

    it('should filter by connection status', () => {
      return request(app.getHttpServer())
        .get('/api/institutions')
        .query({ isConnected: 'false' })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          res.body.data.forEach((institution: any) => {
            expect(institution.isConnected).toBe(false);
          });
        });
    });

    it('should return 400 for invalid type', () => {
      return request(app.getHttpServer())
        .get('/api/institutions')
        .query({ type: 'invalid_type' })
        .expect(400);
    });
  });
});
