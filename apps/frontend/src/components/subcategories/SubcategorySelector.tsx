'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { CategoryType, Subcategory } from '@account-book/types';
import { useSubcategoryStore } from '@/stores/subcategory.store';

/**
 * サブカテゴリ選択コンポーネントのProps
 */
interface SubcategorySelectorProps {
  categoryType: CategoryType;
  selectedSubcategoryId?: string;
  onSelect: (subcategoryId: string) => void;
  disabled?: boolean;
}

/**
 * サブカテゴリ選択コンポーネント
 * FR-009: 詳細費目分類機能
 */
export function SubcategorySelector({
  categoryType,
  selectedSubcategoryId,
  onSelect,
  disabled = false,
}: SubcategorySelectorProps): React.JSX.Element {
  const { isLoading, fetchSubcategories, buildTree } = useSubcategoryStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // サブカテゴリ一覧を取得
  useEffect(() => {
    void fetchSubcategories(categoryType);
  }, [categoryType, fetchSubcategories]);

  // 階層構造を構築（ストアのbuildTreeを使用）
  const tree = useMemo(() => {
    // ストアから階層構造を取得
    const fullTree = buildTree(categoryType);

    // 検索クエリでフィルタリング
    if (!searchQuery) {
      return fullTree;
    }

    const searchLower = searchQuery.toLowerCase();

    // 検索にマッチするノードとその親ノードを含める
    const filterTree = (nodes: Subcategory[]): Subcategory[] => {
      const result: Subcategory[] = [];
      for (const node of nodes) {
        const matchesSearch = node.name.toLowerCase().includes(searchLower);
        const filteredChildren = node.children ? filterTree(node.children) : [];

        // ノード自体がマッチするか、子がマッチする場合は含める
        if (matchesSearch || filteredChildren.length > 0) {
          result.push({
            ...node,
            children: filteredChildren.length > 0 ? filteredChildren : node.children,
          });
        }
      }
      return result;
    };

    return filterTree(fullTree);
  }, [buildTree, categoryType, searchQuery]);

  // ノードの展開/折りたたみ
  const toggleNode = (nodeId: string): void => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  // サブカテゴリノードのレンダリング
  const renderNode = (node: Subcategory & { children?: Subcategory[] }): React.JSX.Element => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedSubcategoryId === node.id;

    return (
      <div key={node.id} className="mb-1">
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors ${
            isSelected ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => {
            if (!disabled) {
              onSelect(node.id);
            }
          }}
          onKeyDown={(e) => {
            if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              onSelect(node.id);
            }
          }}
        >
          {hasChildren && (
            <button
              type="button"
              className="w-4 h-4 flex items-center justify-center"
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
              aria-label={isExpanded ? '折りたたむ' : '展開する'}
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          )}
          {!hasChildren && <span className="w-4" />}
          {node.icon && <span className="text-lg">{node.icon}</span>}
          <span className="flex-1">{node.name}</span>
          {node.color && (
            <span className="w-4 h-4 rounded-full" style={{ backgroundColor: node.color }} />
          )}
        </div>
        {hasChildren && isExpanded && (
          <div className="ml-6 mt-1">{node.children?.map((child) => renderNode(child))}</div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return <div className="p-4 text-center text-gray-500">読み込み中...</div>;
  }

  return (
    <div className="w-full max-w-md">
      {/* 検索ボックス */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="サブカテゴリを検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={disabled}
        />
      </div>

      {/* サブカテゴリツリー */}
      <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md p-2">
        {tree.length === 0 ? (
          <div className="p-4 text-center text-gray-500">サブカテゴリが見つかりません</div>
        ) : (
          tree.map((node) => renderNode(node))
        )}
      </div>
    </div>
  );
}
