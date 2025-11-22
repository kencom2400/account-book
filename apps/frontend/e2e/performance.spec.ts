import { test, expect } from '@playwright/test';

/**
 * フロントエンドレンダリングパフォーマンステスト
 *
 * 目標:
 * - ページ初期表示: 3秒以内
 * - ページ遷移: 1秒以内
 * - データテーブルレンダリング: 2秒以内
 *
 * 参照: docs/test-design.md, docs/requirements-specification.md - NFR-005
 *
 * Note: これらのテストは実際のデータが蓄積された後に実行されることを想定しています。
 * 現在は開発初期段階のため、skipに設定しています。
 */

test.describe.skip('Frontend Rendering Performance', () => {
  test.beforeEach(async ({ page }) => {
    // パフォーマンス測定を有効化
    await page.goto('/');
  });

  test.describe('Page Load Performance', () => {
    test('Home page should load within 3 seconds', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/', { waitUntil: 'networkidle' });

      const duration = Date.now() - startTime;

      // ページコンテンツが表示されることを確認
      await expect(page.locator('h1')).toBeVisible();

      console.log(`\nHome page load time: ${duration}ms`);
      expect(duration).toBeLessThan(3000);

      // パフォーマンスメトリクスを取得
      const metrics = await page.evaluate(() => {
        const perfData = window.performance.timing;
        const navigationStart = perfData.navigationStart;
        return {
          domContentLoaded: perfData.domContentLoadedEventEnd - navigationStart,
          loadComplete: perfData.loadEventEnd - navigationStart,
          domInteractive: perfData.domInteractive - navigationStart,
        };
      });

      console.log('Performance Metrics:');
      console.log(`  DOM Interactive: ${metrics.domInteractive}ms`);
      console.log(`  DOM Content Loaded: ${metrics.domContentLoaded}ms`);
      console.log(`  Load Complete: ${metrics.loadComplete}ms`);

      expect(metrics.domInteractive).toBeLessThan(2000);
      expect(metrics.domContentLoaded).toBeLessThan(3000);
    });

    test('Dashboard page should load within 3 seconds', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/dashboard', { waitUntil: 'networkidle' });

      const duration = Date.now() - startTime;

      // ダッシュボードコンテンツが表示されることを確認
      await expect(page.locator('h1:has-text("ダッシュボード")')).toBeVisible();

      console.log(`\nDashboard page load time: ${duration}ms`);
      expect(duration).toBeLessThan(3000);
    });

    test('Classification page should load within 3 seconds', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/classification', { waitUntil: 'networkidle' });

      const duration = Date.now() - startTime;

      // 分類ページコンテンツが表示されることを確認
      await expect(page.locator('h1:has-text("データ分類")')).toBeVisible();

      console.log(`\nClassification page load time: ${duration}ms`);
      expect(duration).toBeLessThan(3000);
    });
  });

  test.describe('Page Navigation Performance', () => {
    test('Navigation between pages should be fast', async ({ page }) => {
      await page.goto('/', { waitUntil: 'networkidle' });

      const navigationTimes: Record<string, number> = {};

      // Home -> Dashboard
      const startDashboard = Date.now();
      await page.click('a[href="/dashboard"]');
      await expect(page.locator('h1:has-text("ダッシュボード")')).toBeVisible();
      navigationTimes['Home -> Dashboard'] = Date.now() - startDashboard;

      // Dashboard -> Classification
      const startClassification = Date.now();
      await page.click('a[href="/classification"]');
      await expect(page.locator('h1:has-text("データ分類")')).toBeVisible();
      navigationTimes['Dashboard -> Classification'] = Date.now() - startClassification;

      // Classification -> Home
      const startHome = Date.now();
      await page.click('a[href="/"]');
      await expect(page.locator('h1')).toBeVisible();
      navigationTimes['Classification -> Home'] = Date.now() - startHome;

      console.log('\nNavigation Performance:');
      Object.entries(navigationTimes).forEach(([route, time]) => {
        console.log(`  ${route}: ${time}ms`);
        expect(time).toBeLessThan(1000);
      });
    });
  });

  test.describe('Data Rendering Performance', () => {
    test('Should render institutions list efficiently', async ({ page }) => {
      await page.goto('/dashboard', { waitUntil: 'networkidle' });

      const startTime = Date.now();

      // 金融機関リストが表示されるまで待機
      await page.waitForSelector('[data-testid="institutions-list"], .institutions-container', {
        timeout: 5000,
        state: 'visible',
      });

      const duration = Date.now() - startTime;

      console.log(`\nInstitutions list render time: ${duration}ms`);
      expect(duration).toBeLessThan(2000);

      // リストアイテムが表示されることを確認
      const items = await page
        .locator('[data-testid="institution-item"], .institution-card')
        .count();
      console.log(`  Items rendered: ${items}`);
    });

    test('Should render categories list efficiently', async ({ page }) => {
      await page.goto('/classification', { waitUntil: 'networkidle' });

      const startTime = Date.now();

      // カテゴリリストが表示されるまで待機
      await page.waitForSelector('[data-testid="categories-list"], .categories-container', {
        timeout: 5000,
        state: 'visible',
      });

      const duration = Date.now() - startTime;

      console.log(`\nCategories list render time: ${duration}ms`);
      expect(duration).toBeLessThan(2000);
    });
  });

  test.describe('Interaction Performance', () => {
    test('Button clicks should respond quickly', async ({ page }) => {
      await page.goto('/dashboard', { waitUntil: 'networkidle' });

      // ボタンクリックのレスポンスタイムを測定
      const buttons = await page.locator('button').all();

      if (buttons.length > 0) {
        const startTime = Date.now();
        await buttons[0].click();
        // クリック後の何らかの変化を待つ（モーダル表示など）
        await page.waitForTimeout(100);
        const duration = Date.now() - startTime;

        console.log(`\nButton click response time: ${duration}ms`);
        expect(duration).toBeLessThan(500);
      }
    });

    test('Form input should not cause lag', async ({ page }) => {
      await page.goto('/dashboard', { waitUntil: 'networkidle' });

      // フォーム入力がある場合
      const inputs = await page.locator('input[type="text"]').all();

      if (inputs.length > 0) {
        const startTime = Date.now();
        await inputs[0].fill('Test input');
        const duration = Date.now() - startTime;

        console.log(`\nForm input response time: ${duration}ms`);
        expect(duration).toBeLessThan(500);
      }
    });
  });

  test.describe('Large Dataset Rendering', () => {
    test.skip('Should handle rendering 100+ items efficiently', async ({ page }) => {
      // このテストは大量データがある場合にのみ実行
      await page.goto('/dashboard', { waitUntil: 'networkidle' });

      const startTime = Date.now();

      // 大量のアイテムが表示されるのを待機
      await page.waitForSelector('[data-testid="institution-item"]', {
        timeout: 5000,
        state: 'visible',
      });

      const duration = Date.now() - startTime;
      const itemCount = await page.locator('[data-testid="institution-item"]').count();

      console.log(`\nLarge dataset rendering (${itemCount} items): ${duration}ms`);

      if (itemCount >= 100) {
        expect(duration).toBeLessThan(3000);
      }
    });
  });

  test.describe('Resource Loading Performance', () => {
    test('Should load JavaScript bundles efficiently', async ({ page }) => {
      const resourceTimings: Array<{ name: string; duration: number; size: number }> = [];

      // リソースタイミングをキャプチャ
      page.on('response', async (response) => {
        const url = response.url();
        const timing = response.timing();

        if (url.includes('.js') && timing) {
          const buffer = await response.body().catch(() => null);
          const size = buffer ? buffer.length : 0;

          resourceTimings.push({
            name: url.split('/').pop() || url,
            duration: timing.responseEnd,
            size: size,
          });
        }
      });

      await page.goto('/', { waitUntil: 'networkidle' });

      console.log('\nJavaScript Bundle Loading:');
      resourceTimings.forEach((resource) => {
        console.log(`  ${resource.name}`);
        console.log(`    Duration: ${resource.duration.toFixed(2)}ms`);
        console.log(`    Size: ${(resource.size / 1024).toFixed(2)}KB`);
      });

      // 各バンドルが3秒以内にロードされること
      resourceTimings.forEach((resource) => {
        expect(resource.duration).toBeLessThan(3000);
      });
    });

    test('Should load CSS efficiently', async ({ page }) => {
      const cssTimings: Array<{ name: string; duration: number }> = [];

      page.on('response', async (response) => {
        const url = response.url();
        const timing = response.timing();

        if (url.includes('.css') && timing) {
          cssTimings.push({
            name: url.split('/').pop() || url,
            duration: timing.responseEnd,
          });
        }
      });

      await page.goto('/', { waitUntil: 'networkidle' });

      console.log('\nCSS Loading:');
      cssTimings.forEach((resource) => {
        console.log(`  ${resource.name}: ${resource.duration.toFixed(2)}ms`);
      });

      // CSSが1秒以内にロードされること
      cssTimings.forEach((resource) => {
        expect(resource.duration).toBeLessThan(1000);
      });
    });
  });

  test.describe('Performance over Multiple Loads', () => {
    test('Should maintain consistent performance across multiple page loads', async ({ page }) => {
      const loadTimes: number[] = [];

      for (let i = 0; i < 5; i++) {
        const startTime = Date.now();
        await page.goto('/', { waitUntil: 'networkidle' });
        await expect(page.locator('h1')).toBeVisible();
        const duration = Date.now() - startTime;
        loadTimes.push(duration);

        console.log(`  Load ${i + 1}: ${duration}ms`);

        // ページをリロード前に少し待機
        await page.waitForTimeout(100);
      }

      const avgLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length;
      const minLoadTime = Math.min(...loadTimes);
      const maxLoadTime = Math.max(...loadTimes);
      const variance = maxLoadTime - minLoadTime;

      console.log('\nMultiple Load Performance:');
      console.log(`  Average: ${avgLoadTime.toFixed(2)}ms`);
      console.log(`  Min: ${minLoadTime}ms`);
      console.log(`  Max: ${maxLoadTime}ms`);
      console.log(`  Variance: ${variance}ms`);

      expect(avgLoadTime).toBeLessThan(3000);
      // パフォーマンスの一貫性: 最大と最小の差が2秒以内
      expect(variance).toBeLessThan(2000);
    });
  });

  test.describe('Client-Side Performance Metrics', () => {
    test('Should have good Core Web Vitals', async ({ page }) => {
      await page.goto('/', { waitUntil: 'networkidle' });

      // Core Web Vitalsを取得
      const webVitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          const metrics: Record<string, number> = {};

          // First Contentful Paint (FCP)
          new PerformanceObserver((entryList) => {
            const entries = entryList.getEntriesByName('first-contentful-paint');
            if (entries.length > 0) {
              metrics.fcp = entries[0].startTime;
            }
          }).observe({ entryTypes: ['paint'] });

          // Largest Contentful Paint (LCP)
          new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
              renderTime?: number;
              loadTime?: number;
            };
            if (lastEntry) {
              metrics.lcp = lastEntry.renderTime || lastEntry.loadTime || 0;
            }
          }).observe({ entryTypes: ['largest-contentful-paint'] });

          // First Input Delay (FID) の代わりに、基本的なタイミング情報を取得
          setTimeout(() => {
            const navigation = performance.getEntriesByType(
              'navigation'
            )[0] as PerformanceNavigationTiming;
            if (navigation) {
              metrics.domInteractive = navigation.domInteractive;
              metrics.domContentLoaded =
                navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
              metrics.loadComplete = navigation.loadEventEnd - navigation.loadEventStart;
            }
            resolve(metrics);
          }, 3000);
        });
      });

      interface WebVitalsMetrics {
        fcp?: number;
        lcp?: number;
        domInteractive?: number;
        domContentLoaded?: number;
        loadComplete?: number;
      }

      const metrics = webVitals as WebVitalsMetrics;

      console.log('\nCore Web Vitals:');
      console.log(`  First Contentful Paint (FCP): ${metrics.fcp?.toFixed(2) || 'N/A'}ms`);
      console.log(`  Largest Contentful Paint (LCP): ${metrics.lcp?.toFixed(2) || 'N/A'}ms`);
      console.log(`  DOM Interactive: ${metrics.domInteractive?.toFixed(2) || 'N/A'}ms`);
      console.log(`  DOM Content Loaded: ${metrics.domContentLoaded?.toFixed(2) || 'N/A'}ms`);

      // Web Vitalsの推奨値
      // FCP: < 1800ms (Good), < 3000ms (Needs Improvement)
      // LCP: < 2500ms (Good), < 4000ms (Needs Improvement)
      if (metrics.fcp) {
        expect(metrics.fcp).toBeLessThan(3000);
      }
      if (metrics.lcp) {
        expect(metrics.lcp).toBeLessThan(4000);
      }
    });
  });
});
