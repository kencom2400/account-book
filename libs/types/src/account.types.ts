/**
 * 口座タイプ
 * 金融機関の口座種別を表すEnum
 */
export enum AccountType {
  /** 普通預金・当座預金 */
  SAVINGS = 'SAVINGS',
  /** 定期預金 */
  TIME_DEPOSIT = 'TIME_DEPOSIT',
  /** クレジットカード */
  CREDIT_CARD = 'CREDIT_CARD',
  /** 株式口座 */
  STOCK = 'STOCK',
  /** 投資信託 */
  MUTUAL_FUND = 'MUTUAL_FUND',
  /** その他 */
  OTHER = 'OTHER',
}
