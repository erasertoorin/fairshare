export type UserId = string;

export interface User {
  id: UserId;
  name: string;
  email: string;
  avatarColor: string;
}

export enum GroupRole {
  VIEWER = 1,
  EDITOR = 2,
  ADMIN = 3,
}

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
  categoryId: string;
  date: string;
  createdAt: string;
}

export interface Payment {
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
  payments: Payment[];
}
