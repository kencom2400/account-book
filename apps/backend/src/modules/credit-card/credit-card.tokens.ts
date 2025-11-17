/**
 * Dependency Injection Tokens for Credit Card Module
 */

export const CREDIT_CARD_REPOSITORY = Symbol('ICreditCardRepository');
export const CREDIT_CARD_TRANSACTION_REPOSITORY = Symbol(
  'ICreditCardTransactionRepository',
);
export const PAYMENT_REPOSITORY = Symbol('IPaymentRepository');
export const CREDIT_CARD_API_CLIENT = Symbol('ICreditCardAPIClient');
