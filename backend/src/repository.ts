import type { User, Group, GroupRole, ExpenseCategory, Expense, Settlement, Database } from "./models.js";
import { seedData } from "./seed-data.js";

// Deep clone seed data so we can reset if needed
const db: Database = structuredClone(seedData);

function createId(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

// ─── Generic CRUD helpers ────────────────────────────────

function findById<T extends { id: string }>(collection: T[], id: string): T | undefined {
  return collection.find((item) => item.id === id);
}

function removeById<T extends { id: string }>(collection: T[], id: string): boolean {
  const idx = collection.findIndex((item) => item.id === id);
  if (idx === -1) return false;
  collection.splice(idx, 1);
  return true;
}

function updateById<T extends { id: string }>(collection: T[], id: string, data: Partial<T>): T | null {
  const idx = collection.findIndex((item) => item.id === id);
  if (idx === -1) return null;
  collection[idx] = { ...collection[idx], ...data, id };
  return collection[idx];
}

// ─── Users ───────────────────────────────────────────────

export const users = {
  getAll(): User[] {
    return db.users;
  },
  getById(id: string): User | undefined {
    return findById(db.users, id);
  },
  create(data: Omit<User, "id">): User {
    const user: User = { id: createId(), ...data };
    db.users.push(user);
    return user;
  },
  update(id: string, data: Partial<User>): User | null {
    return updateById(db.users, id, data);
  },
  delete(id: string): boolean {
    return removeById(db.users, id);
  },
};

// ─── Groups ──────────────────────────────────────────────

export const groups = {
  getAll(): Group[] {
    return db.groups;
  },
  getById(id: string): Group | undefined {
    return findById(db.groups, id);
  },
  getByUser(userId: string): Group[] {
    return db.groups.filter((g) => g.members.some((m) => m.userId === userId));
  },
  getMemberRole(groupId: string, userId: string): GroupRole | null {
    const group = findById(db.groups, groupId);
    if (!group) return null;
    const member = group.members.find((m) => m.userId === userId);
    return member?.role ?? null;
  },
  hasPermission(groupId: string, userId: string, minRole: GroupRole): boolean {
    const role = groups.getMemberRole(groupId, userId);
    if (!role) return false;
    const hierarchy: Record<GroupRole, number> = { admin: 3, editor: 2, viewer: 1 };
    return hierarchy[role] >= hierarchy[minRole];
  },
  create(data: Omit<Group, "id" | "createdAt">): Group {
    const group: Group = { id: createId(), createdAt: now(), ...data };
    db.groups.push(group);
    return group;
  },
  update(id: string, data: Partial<Group>): Group | null {
    return updateById(db.groups, id, data);
  },
  delete(id: string): boolean {
    return removeById(db.groups, id);
  },
};

// ─── Categories ──────────────────────────────────────────

export const categories = {
  getAll(): ExpenseCategory[] {
    return db.categories;
  },
  getById(id: string): ExpenseCategory | undefined {
    return findById(db.categories, id);
  },
  create(data: Omit<ExpenseCategory, "id">): ExpenseCategory {
    const category: ExpenseCategory = { id: createId(), ...data };
    db.categories.push(category);
    return category;
  },
  update(id: string, data: Partial<ExpenseCategory>): ExpenseCategory | null {
    return updateById(db.categories, id, data);
  },
  delete(id: string): boolean {
    return removeById(db.categories, id);
  },
};

// ─── Expenses ────────────────────────────────────────────

export const expenses = {
  getAll(): Expense[] {
    return db.expenses;
  },
  getById(id: string): Expense | undefined {
    return findById(db.expenses, id);
  },
  getByGroup(groupId: string): Expense[] {
    return db.expenses.filter((e) => e.groupId === groupId);
  },
  create(data: Omit<Expense, "id" | "createdAt">): Expense {
    const expense: Expense = { id: createId(), createdAt: now(), ...data };
    db.expenses.push(expense);
    return expense;
  },
  update(id: string, data: Partial<Expense>): Expense | null {
    return updateById(db.expenses, id, data);
  },
  delete(id: string): boolean {
    return removeById(db.expenses, id);
  },
};

// ─── Settlements ─────────────────────────────────────────

export const settlements = {
  getAll(): Settlement[] {
    return db.settlements;
  },
  getByGroup(groupId: string): Settlement[] {
    return db.settlements.filter((s) => s.groupId === groupId);
  },
  create(data: Omit<Settlement, "id" | "createdAt">): Settlement {
    const settlement: Settlement = { id: createId(), createdAt: now(), ...data };
    db.settlements.push(settlement);
    return settlement;
  },
  delete(id: string): boolean {
    return removeById(db.settlements, id);
  },
};

// ─── Balance calculation ─────────────────────────────────

export function calculateBalances(groupId: string): Record<string, number> | null {
  const group = groups.getById(groupId);
  if (!group) return null;

  const balances: Record<string, number> = {};
  for (const member of group.members) {
    balances[member.userId] = 0;
  }

  for (const expense of expenses.getByGroup(groupId)) {
    const share = expense.amount / expense.splitBetween.length;
    balances[expense.paidBy] += expense.amount;
    for (const userId of expense.splitBetween) {
      balances[userId] -= share;
    }
  }

  for (const s of settlements.getByGroup(groupId)) {
    balances[s.fromUser] += s.amount;
    balances[s.toUser] -= s.amount;
  }

  for (const id of Object.keys(balances)) {
    balances[id] = Math.round(balances[id] * 100) / 100;
  }

  return balances;
}

export interface SimplifiedDebt {
  from: string;
  to: string;
  amount: number;
}

export function simplifyDebts(groupId: string): SimplifiedDebt[] | null {
  const balances = calculateBalances(groupId);
  if (!balances) return null;

  const debtors: { userId: string; amount: number }[] = [];
  const creditors: { userId: string; amount: number }[] = [];

  for (const [userId, balance] of Object.entries(balances)) {
    if (balance < -0.01) debtors.push({ userId, amount: -balance });
    else if (balance > 0.01) creditors.push({ userId, amount: balance });
  }

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const transactions: SimplifiedDebt[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].amount, creditors[j].amount);
    transactions.push({
      from: debtors[i].userId,
      to: creditors[j].userId,
      amount: Math.round(amount * 100) / 100,
    });

    debtors[i].amount -= amount;
    creditors[j].amount -= amount;

    if (debtors[i].amount < 0.01) i++;
    if (creditors[j].amount < 0.01) j++;
  }

  return transactions;
}
