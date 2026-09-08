export type UserId = string;

export enum GroupRole {
  VIEWER = 1,
  EDITOR = 2,
  ADMIN = 3,
}

export interface User {
  id: UserId;
  name: string;
  email: string;
  avatarColor: string;
}

export interface GroupMember {
  userId: UserId;
  role: GroupRole;
}

export interface GroupMemberDetail extends GroupMember {
  user: User;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  members: GroupMember[];
  createdAt: string;
}

export interface GroupDetail extends Group {
  memberDetails: GroupMemberDetail[];
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
