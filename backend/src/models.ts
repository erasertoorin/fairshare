export type UserId = string;

export interface User {
  id: UserId;
  name: string;
  email: string;
  avatarColor: string;
}

export type GroupRole = "admin" | "editor" | "viewer";

export interface GroupMember {
  userId: UserId;
  role: GroupRole;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  members: GroupMember[];
  createdAt: string;
}

export type SplitType = "equal" | "exact" | "percentage";

export interface ExpenseCategory {
  id: string;
  name: string;
  icon: string;
}

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  currency: string;
  paidBy: UserId;
  splitBetween: UserId[];
  splitType: SplitType;
  categoryId: string;
  date: string;
  createdAt: string;
}

export interface Settlement {
  id: string;
  groupId: string;
  fromUser: UserId;
  toUser: UserId;
  amount: number;
  date: string;
  createdAt: string;
}

export interface Balance {
  user: User;
  balance: number;
}

export interface Debt {
  from: User;
  to: User;
  amount: number;
}

export interface Database {
  users: User[];
  groups: Group[];
  categories: ExpenseCategory[];
  expenses: Expense[];
  settlements: Settlement[];
}
