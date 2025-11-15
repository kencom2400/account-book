'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center max-w-2xl px-6">
        <h1 className="text-5xl font-bold mb-4 text-gray-900">
          Account Book
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          個人資産管理アプリケーション
        </p>
        <p className="text-gray-500 mb-12">
          複数の金融機関の資産を一元管理し、収支を可視化・分析します
        </p>

        <div className="space-y-4">
          <Link
            href="/dashboard"
            className="inline-block px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            ダッシュボードを開く
          </Link>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-3xl mb-2">📊</div>
              <h3 className="font-semibold text-gray-900 mb-2">収支の可視化</h3>
              <p className="text-sm text-gray-600">
                月次・年次での収支バランスをグラフで確認
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-3xl mb-2">🏦</div>
              <h3 className="font-semibold text-gray-900 mb-2">一元管理</h3>
              <p className="text-sm text-gray-600">
                複数の金融機関の資産を一箇所で管理
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-3xl mb-2">📁</div>
              <h3 className="font-semibold text-gray-900 mb-2">自動分類</h3>
              <p className="text-sm text-gray-600">
                取引を自動的にカテゴリ分類して集計
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
