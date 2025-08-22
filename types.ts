

export interface CustomerTierDetails {
  label: string;
  minVolume: number;
  commissionDiscount: number;
  color: string;
  icon: React.FC<{className?: string}>;
}

export type CustomerTierConfig = Record<CustomerTier, CustomerTierDetails>;


export enum CustomerTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  VIP = 'vip',
}

export enum UserRole {
  ADMIN = 'admin',
  ACCOUNTANT = 'accountant',
}

export type Permission =
  | 'view_dashboard'
  | 'view_transactions'
  | 'manage_transactions'
  | 'view_customers'
  | 'manage_customers'
  | 'manage_customer_ledger'
  | 'view_reports'
  | 'manage_internal_accounts'
  | 'manage_users'
  | 'manage_currencies'
  | 'reset_application_data'
  | 'view_audit_log'
  | 'view_tasks'
  | 'manage_tasks'
  | 'view_ornamental_gold'
  | 'manage_ornamental_gold';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  permissions: Permission[];
  password?: string;
}

export interface Currency {
  id: string;
  code: string; // e.g., USD, EUR, IRT
  name: string; // e.g., US Dollar, Euro, Iranian Toman
  symbol: string; // e.g., $, €, تومان
  type?: 'fiat' | 'commodity'; // To distinguish between currencies and goods like gold
}

export interface Transaction {
  id: string;
  transactionNumber: number;
  sourceCurrencyId: string;
  sourceAmount: number;
  sourceAccountId?: string; // Optional: ID of the managed account for source currency
  exchangeRate: number; // Rate of source currency to target currency. (1 SourceUnit = X TargetUnit)
  targetCurrencyId: string;
  targetAmount: number;
  targetAccountId?: string; // Optional: ID of the managed account for target currency
  date: string; // ISO string
  createdByUserId: string; // ID of the user who recorded the transaction
  lastModifiedByUserId?: string;
  lastModifiedDate?: string;
  customerId?: string; // Optional: ID of the customer involved
  notes?: string;
  receiptImage?: string; // base64 encoded image data

  verifiedByUserId?: string;
  verifiedAt?: string; // ISO string

  // For commodity sales (e.g., gold)
  wagePercentage?: number; // e.g., 7 for 7%
  wageAmount?: number; // The calculated wage in IRT

  // For currency exchange transactions
  commissionPercentage?: number; // e.g., 0.5 for 0.5%
  commissionAmount?: number; // The calculated commission in IRT
  
  // For ornamental gold sales
  soldOrnamentalGoldId?: string;
}

export interface Customer {
  id: string;
  name: string;
  phoneNumber: string;
  nationalId?: string;
  membershipDate: string; // ISO string
  referrerId?: string; // ID of another customer who introduced this one
  referralSource?: string; // Free text for how the customer was referred (e.g., Instagram)
  address?: string;
  notes?: string;
  isFavorite?: boolean;
  tier: CustomerTier;
  points: number;
}

export interface ManagedAccount {
  id:string;
  name: string;
  currencyId: string; // Links to an existing Currency
  balance: number;
  accountNumber?: string;
  description?: string;
  isCashAccount?: boolean;
}

export interface CustomerLedgerEntry {
  id: string;
  customerId: string;
  date: string; // ISO string
  currencyId: string;
  amount: number; // Positive for credit (we owe customer), negative for debit (customer owes us)
  description: string;
  transactionId?: string; // Link to the originating transaction
  paymentMethod?: 'cash' | 'account';
  managedAccountId?: string; // If a payment was made from/to an internal account, this is the ID
  createdByUserId: string;
  lastModifiedByUserId?: string;
  lastModifiedDate?: string;
  verifiedByUserId?: string;
  verifiedAt?: string;
  receiptImage?: string; // base64 encoded image data for manual entries
  settlementGroupId?: string; // To link customer-to-customer settlements
}

export interface PersonalExpense {
    id: string;
    userId: string;
    date: string; // ISO string
    amount: number;
    managedAccountId: string;
    currencyId: string;
    category: string;
    description: string;
    lastModifiedByUserId?: string;
    lastModifiedDate?: string;
}

export interface AuditLogEntry {
    id: string;
    timestamp: string; // ISO string
    userId: string;
    action: 'create' | 'update' | 'delete' | 'reset' | 'login' | 'logout' | 'favorite' | 'tier_upgrade';
    entity: 'Transaction' | 'Customer' | 'User' | 'Currency' | 'ManagedAccount' | 'CustomerLedger' | 'PersonalExpense' | 'Task' | 'Application' | 'OrnamentalGold' | 'AccountAdjustment' | 'CustomerTierConfig';
    details: string; // e.g., "User 'admin' created new transaction #101 for customer 'John Doe'."
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'inprogress',
  DONE = 'done'
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string;
  dueDate: string; // ISO string
  createdByUserId: string;
  createdAt: string; // ISO string
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  relatedTaskId?: string;
  isRead: boolean;
  createdAt: string; // ISO string
}

export interface OrnamentalGold {
  id: string;
  code: string; // Unique code for the item
  name: string;
  weight: number; // in grams
  description?: string;
  imageUrl: string; // base64 encoded image
  purchaseInvoiceUrl?: string; // base64 encoded image
  costPrice?: number; // Purchase price in IRT
  status: 'available' | 'sold';
  addedByUserId: string;
  addedAt: string; // ISO string
  soldAt?: string; // ISO string
  soldTransactionId?: string; // Link to the sale transaction
  purchasedFromCustomerId?: string;
  purchaseWagePercentage?: number; // Purchase wage as a percentage of costPrice
  purchaseWageAmount?: number; // Calculated purchase wage in IRT
}

export interface TourStep {
  element: string;
  intro: string;
}

export type ExchangeSettlementPayload = {
  type: 'exchange';
  amount: number; // Positive for exchange receive from customer, negative for exchange pay to customer
  managedAccountId: string;
  notes?: string;
  receiptImage?: string; // base64 encoded image
};

export type C2CSettlementPayload = {
  type: 'c2c';
  amount: number; // Always positive
  otherCustomerId: string;
  currencyId: string;
  mainCustomerIsPayer: boolean; // True if the transaction's main customer is the payer
  notes?: string;
  receiptImage?: string; // base64 encoded image
};

export type SettlementPayload = ExchangeSettlementPayload | C2CSettlementPayload;

export interface AccountAdjustment {
  id: string;
  accountId: string;
  timestamp: string; // ISO string
  userId: string;
  previousBalance: number;
  newBalance: number;
  adjustmentAmount: number; // newBalance - previousBalance
  reason: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}