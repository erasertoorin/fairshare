import { describe, it, expect } from "vitest";
import { users, groups, categories, expenses, payments, calculateBalances, simplifyDebts } from "../repository.js";
import { GroupRole } from "../models.js";

// ─── Users ───────────────────────────────────────────────

describe("users", () => {
  it("should return all seed users", () => {
    const all = users.getAll();
    expect(all.length).toBeGreaterThanOrEqual(4);
    expect(all[0]).toHaveProperty("id");
    expect(all[0]).toHaveProperty("name");
    expect(all[0]).toHaveProperty("email");
  });

  it("should find user by id", () => {
    const user = users.getById("u1");
    expect(user).toBeDefined();
    expect(user!.name).toBe("Alice Müller");
  });

  it("should return undefined for unknown user", () => {
    expect(users.getById("unknown")).toBeUndefined();
  });

  it("should create a new user", () => {
    const before = users.getAll().length;
    const user = users.create({ name: "Test User", email: "test@example.com", avatarColor: "#000" });
    expect(user.id).toBeDefined();
    expect(user.name).toBe("Test User");
    expect(users.getAll().length).toBe(before + 1);
  });

  it("should update an existing user", () => {
    const updated = users.update("u2", { name: "Bob Updated" });
    expect(updated).not.toBeNull();
    expect(updated!.name).toBe("Bob Updated");
    expect(updated!.id).toBe("u2");
  });

  it("should return null when updating non-existent user", () => {
    expect(users.update("nope", { name: "x" })).toBeNull();
  });

  it("should delete a user", () => {
    const user = users.create({ name: "ToDelete", email: "del@test.com", avatarColor: "#fff" });
    expect(users.delete(user.id)).toBe(true);
    expect(users.getById(user.id)).toBeUndefined();
  });

  it("should return false when deleting non-existent user", () => {
    expect(users.delete("nope")).toBe(false);
  });
});

// ─── Groups ──────────────────────────────────────────────

describe("groups", () => {
  it("should return all seed groups", () => {
    const all = groups.getAll();
    expect(all.length).toBeGreaterThanOrEqual(2);
  });

  it("should find group by id", () => {
    const group = groups.getById("g1");
    expect(group).toBeDefined();
    expect(group!.name).toContain("WG");
  });

  it("should filter groups by user", () => {
    const userGroups = groups.getByUser("u4");
    expect(userGroups.length).toBeGreaterThanOrEqual(1);
    expect(userGroups.every((g) => g.members.some((m) => m.userId === "u4"))).toBe(true);
  });

  it("should return empty array for user not in any group", () => {
    expect(groups.getByUser("nonexistent")).toEqual([]);
  });

  describe("roles & permissions", () => {
    it("should return correct member role", () => {
      expect(groups.getMemberRole("g1", "u1")).toBe(GroupRole.ADMIN);
      expect(groups.getMemberRole("g1", "u2")).toBe(GroupRole.EDITOR);
      expect(groups.getMemberRole("g1", "u3")).toBe(GroupRole.VIEWER);
    });

    it("should return null for non-member", () => {
      expect(groups.getMemberRole("g1", "u4")).toBeNull();
    });

    it("should return null for non-existent group", () => {
      expect(groups.getMemberRole("nope", "u1")).toBeNull();
    });

    it("should check admin has all permissions", () => {
      expect(groups.hasPermission("g1", "u1", GroupRole.ADMIN)).toBe(true);
      expect(groups.hasPermission("g1", "u1", GroupRole.EDITOR)).toBe(true);
      expect(groups.hasPermission("g1", "u1", GroupRole.VIEWER)).toBe(true);
    });

    it("should check editor has editor and viewer permissions", () => {
      expect(groups.hasPermission("g1", "u2", GroupRole.ADMIN)).toBe(false);
      expect(groups.hasPermission("g1", "u2", GroupRole.EDITOR)).toBe(true);
      expect(groups.hasPermission("g1", "u2", GroupRole.VIEWER)).toBe(true);
    });

    it("should check viewer only has viewer permission", () => {
      expect(groups.hasPermission("g1", "u3", GroupRole.ADMIN)).toBe(false);
      expect(groups.hasPermission("g1", "u3", GroupRole.EDITOR)).toBe(false);
      expect(groups.hasPermission("g1", "u3", GroupRole.VIEWER)).toBe(true);
    });

    it("should deny permission for non-member", () => {
      expect(groups.hasPermission("g1", "u4", GroupRole.VIEWER)).toBe(false);
    });
  });

  it("should create a group", () => {
    const group = groups.create({
      name: "Test Group",
      description: "test",
      members: [{ userId: "u1", role: GroupRole.ADMIN }],
    });
    expect(group.id).toBeDefined();
    expect(group.createdAt).toBeDefined();
    expect(group.name).toBe("Test Group");
  });
});

// ─── Categories ──────────────────────────────────────────

describe("categories", () => {
  it("should return all seed categories", () => {
    const all = categories.getAll();
    expect(all.length).toBeGreaterThanOrEqual(9);
    expect(all[0]).toHaveProperty("icon");
  });

  it("should create and delete a category", () => {
    const cat = categories.create({ name: "TestCat", icon: "test_icon" });
    expect(cat.id).toBeDefined();
    expect(categories.getById(cat.id)).toBeDefined();
    expect(categories.delete(cat.id)).toBe(true);
    expect(categories.getById(cat.id)).toBeUndefined();
  });

  it("should update a category", () => {
    const updated = categories.update("cat1", { name: "Allgemein" });
    expect(updated).not.toBeNull();
    expect(updated!.name).toBe("Allgemein");
  });
});

// ─── Expenses ────────────────────────────────────────────

describe("expenses", () => {
  it("should return expenses by group", () => {
    const g1Expenses = expenses.getByGroup("g1");
    expect(g1Expenses.length).toBeGreaterThanOrEqual(3);
    expect(g1Expenses.every((e) => e.groupId === "g1")).toBe(true);
  });

  it("should find expense by id", () => {
    const expense = expenses.getById("e1");
    expect(expense).toBeDefined();
    expect(expense!.description).toBe("Wocheneinkauf REWE");
  });

  it("should create an expense", () => {
    const expense = expenses.create({
      groupId: "g1",
      description: "Test Expense",
      amount: 42.0,
      currency: "EUR",
      paidBy: "u1",
      splitBetween: ["u1", "u2"],
      categoryId: "cat1",
      date: new Date().toISOString(),
    });
    expect(expense.id).toBeDefined();
    expect(expense.amount).toBe(42.0);
  });

  it("should update an expense", () => {
    const updated = expenses.update("e1", { description: "REWE Updated" });
    expect(updated).not.toBeNull();
    expect(updated!.description).toBe("REWE Updated");
  });
});

// ─── Settlements ─────────────────────────────────────────

describe("payments", () => {
  it("should return payments by group", () => {
    const g1Settlements = payments.getByGroup("g1");
    expect(g1Settlements.length).toBeGreaterThanOrEqual(1);
  });

  it("should create a payment", () => {
    const payment = payments.create({
      groupId: "g1",
      fromUser: "u2",
      toUser: "u1",
      amount: 5.0,
      date: new Date().toISOString(),
    });
    expect(payment.id).toBeDefined();
    expect(payment.amount).toBe(5.0);
  });
});

// ─── Balance calculation ─────────────────────────────────

describe("calculateBalances", () => {
  it("should return null for non-existent group", () => {
    expect(calculateBalances("nope")).toBeNull();
  });

  it("should return balances for all members", () => {
    const balances = calculateBalances("g2");
    expect(balances).not.toBeNull();
    expect(Object.keys(balances!)).toContain("u1");
    expect(Object.keys(balances!)).toContain("u2");
    expect(Object.keys(balances!)).toContain("u3");
    expect(Object.keys(balances!)).toContain("u4");
  });

  it("should have balances that sum to approximately zero", () => {
    const balances = calculateBalances("g2")!;
    const sum = Object.values(balances).reduce((a, b) => a + b, 0);
    expect(Math.abs(sum)).toBeLessThan(0.02);
  });

  it("should reflect who paid more gets positive balance", () => {
    // u2 paid 1200 for hotel in g2 - should have high positive balance
    const balances = calculateBalances("g2")!;
    expect(balances["u2"]).toBeGreaterThan(0);
  });
});

// ─── Simplified debts ────────────────────────────────────

describe("simplifyDebts", () => {
  it("should return null for non-existent group", () => {
    expect(simplifyDebts("nope")).toBeNull();
  });

  it("should return simplified transactions", () => {
    const debts = simplifyDebts("g2");
    expect(debts).not.toBeNull();
    expect(debts!.length).toBeGreaterThan(0);
  });

  it("should have all positive amounts", () => {
    const debts = simplifyDebts("g2")!;
    expect(debts.every((d) => d.amount > 0)).toBe(true);
  });

  it("should have from/to as valid user ids", () => {
    const debts = simplifyDebts("g2")!;
    const validIds = users.getAll().map((u) => u.id);
    for (const d of debts) {
      expect(validIds).toContain(d.from);
      expect(validIds).toContain(d.to);
    }
  });

  it("should produce debts that sum to total owed", () => {
    const balances = calculateBalances("g2")!;
    const totalOwed = Object.values(balances)
      .filter((b) => b > 0)
      .reduce((a, b) => a + b, 0);
    const debts = simplifyDebts("g2")!;
    const debtSum = debts.reduce((a, d) => a + d.amount, 0);
    expect(Math.abs(totalOwed - debtSum)).toBeLessThan(0.02);
  });
});
