import { AlertAction } from './alert-action.vo';
import { ActionType } from '../enums/action-type.enum';

describe('AlertAction Value Object', () => {
  const createMockAlertAction = (
    overrides?: Partial<{
      id: string;
      label: string;
      action: ActionType;
      isPrimary: boolean;
    }>,
  ): AlertAction => {
    const defaults = {
      id: 'action-001',
      label: '詳細を確認',
      action: ActionType.VIEW_DETAILS,
      isPrimary: false,
      ...overrides,
    };

    return new AlertAction(
      defaults.id,
      defaults.label,
      defaults.action,
      defaults.isPrimary,
    );
  };

  describe('constructor', () => {
    it('正常に作成できる', () => {
      const action = createMockAlertAction();

      expect(action.id).toBe('action-001');
      expect(action.label).toBe('詳細を確認');
      expect(action.action).toBe(ActionType.VIEW_DETAILS);
      expect(action.isPrimary).toBe(false);
    });

    it('必須フィールドが欠けている場合エラー', () => {
      expect(() => {
        new AlertAction('', 'ラベル', ActionType.VIEW_DETAILS, false);
      }).toThrow('Action ID is required');

      expect(() => {
        new AlertAction('id', '', ActionType.VIEW_DETAILS, false);
      }).toThrow('Action label is required');

      expect(() => {
        new AlertAction('id', 'ラベル', null as unknown as ActionType, false);
      }).toThrow('Action type is required');
    });
  });

  describe('toPlain', () => {
    it('プレーンオブジェクトに変換できる', () => {
      const action = createMockAlertAction({
        id: 'action-002',
        label: '手動で照合',
        action: ActionType.MANUAL_MATCH,
        isPrimary: true,
      });

      const plain = action.toPlain();

      expect(plain.id).toBe('action-002');
      expect(plain.label).toBe('手動で照合');
      expect(plain.action).toBe(ActionType.MANUAL_MATCH);
      expect(plain.isPrimary).toBe(true);
    });
  });

  describe('fromPlain', () => {
    it('プレーンオブジェクトから復元できる', () => {
      const action = createMockAlertAction({
        id: 'action-003',
        label: '解決済みにする',
        action: ActionType.MARK_RESOLVED,
        isPrimary: false,
      });

      const plain = action.toPlain();
      const restored = AlertAction.fromPlain(plain);

      expect(restored.id).toBe(action.id);
      expect(restored.label).toBe(action.label);
      expect(restored.action).toBe(action.action);
      expect(restored.isPrimary).toBe(action.isPrimary);
    });
  });
});
