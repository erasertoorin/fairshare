import express, { type Request, type Response } from "express";
import cors from "cors";
import { users, groups, categories, expenses, settlements, calculateBalances, simplifyDebts } from "./repository.js";
import type { SplitType } from "./models.js";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

function param(req: Request, name: string): string {
  const val = req.params[name];
  return Array.isArray(val) ? val[0] : val;
}

function currentUserId(req: Request): string | undefined {
  const header = req.headers["x-user-id"];
  return Array.isArray(header) ? header[0] : header;
}

function requireRole(req: Request, res: Response, groupId: string, minRole: "admin" | "editor" | "viewer"): boolean {
  const userId = currentUserId(req);
  if (!userId) {
    res.status(401).json({ error: "X-User-Id header is required" });
    return false;
  }
  if (!groups.hasPermission(groupId, userId, minRole)) {
    res.status(403).json({ error: `Requires at least '${minRole}' role in this group` });
    return false;
  }
  return true;
}

// ─── Users ───────────────────────────────────────────────

app.get("/api/users", (_req: Request, res: Response) => {
  res.json(users.getAll());
});

app.get("/api/users/:id", (req: Request, res: Response) => {
  const user = users.getById(param(req, "id"));
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

app.post("/api/users", (req: Request, res: Response) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ error: "name and email are required" });
  const user = users.create({ name, email, avatarColor: req.body.avatarColor || "#9E9E9E" });
  res.status(201).json(user);
});

app.put("/api/users/:id", (req: Request, res: Response) => {
  const user = users.update(param(req, "id"), req.body);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

app.delete("/api/users/:id", (req: Request, res: Response) => {
  if (!users.delete(param(req, "id"))) return res.status(404).json({ error: "User not found" });
  res.status(204).end();
});

// ─── Groups ──────────────────────────────────────────────

app.get("/api/groups", (req: Request, res: Response) => {
  const userId = req.query.userId as string | undefined;
  const result = userId ? groups.getByUser(userId) : groups.getAll();
  res.json(result);
});

app.get("/api/groups/:id", (req: Request, res: Response) => {
  const group = groups.getById(param(req, "id"));
  if (!group) return res.status(404).json({ error: "Group not found" });
  const memberDetails = group.members.map((m) => ({
    ...m,
    user: users.getById(m.userId),
  }));
  res.json({ ...group, memberDetails });
});

app.post("/api/groups", (req: Request, res: Response) => {
  const { name, members } = req.body;
  if (!name || !members?.length) return res.status(400).json({ error: "name and members are required" });
  const group = groups.create({ name, description: req.body.description || "", members });
  res.status(201).json(group);
});

app.put("/api/groups/:id", (req: Request, res: Response) => {
  const groupId = param(req, "id");
  if (!requireRole(req, res, groupId, "admin")) return;
  const group = groups.update(groupId, req.body);
  if (!group) return res.status(404).json({ error: "Group not found" });
  res.json(group);
});

app.delete("/api/groups/:id", (req: Request, res: Response) => {
  const groupId = param(req, "id");
  if (!requireRole(req, res, groupId, "admin")) return;
  if (!groups.delete(groupId)) return res.status(404).json({ error: "Group not found" });
  res.status(204).end();
});

// ─── Categories ──────────────────────────────────────────

app.get("/api/categories", (_req: Request, res: Response) => {
  res.json(categories.getAll());
});

app.post("/api/categories", (req: Request, res: Response) => {
  const { name, icon } = req.body;
  if (!name || !icon) return res.status(400).json({ error: "name and icon are required" });
  const category = categories.create({ name, icon });
  res.status(201).json(category);
});

app.put("/api/categories/:id", (req: Request, res: Response) => {
  const category = categories.update(param(req, "id"), req.body);
  if (!category) return res.status(404).json({ error: "Category not found" });
  res.json(category);
});

app.delete("/api/categories/:id", (req: Request, res: Response) => {
  if (!categories.delete(param(req, "id"))) return res.status(404).json({ error: "Category not found" });
  res.status(204).end();
});

// ─── Expenses ────────────────────────────────────────────

app.get("/api/groups/:groupId/expenses", (req: Request, res: Response) => {
  res.json(expenses.getByGroup(param(req, "groupId")));
});

app.get("/api/expenses/:id", (req: Request, res: Response) => {
  const expense = expenses.getById(param(req, "id"));
  if (!expense) return res.status(404).json({ error: "Expense not found" });
  res.json(expense);
});

app.post("/api/groups/:groupId/expenses", (req: Request, res: Response) => {
  const groupId = param(req, "groupId");
  if (!requireRole(req, res, groupId, "editor")) return;
  const { description, amount, paidBy, splitBetween } = req.body;
  if (!description || !amount || !paidBy || !splitBetween?.length) {
    return res.status(400).json({ error: "description, amount, paidBy, and splitBetween are required" });
  }
  const expense = expenses.create({
    groupId,
    description,
    amount: Number(amount),
    currency: req.body.currency || "EUR",
    paidBy,
    splitBetween,
    splitType: (req.body.splitType as SplitType) || "equal",
    categoryId: req.body.categoryId || "cat1",
    date: req.body.date || new Date().toISOString(),
  });
  res.status(201).json(expense);
});

app.put("/api/expenses/:id", (req: Request, res: Response) => {
  const expenseId = param(req, "id");
  const expense = expenses.getById(expenseId);
  if (!expense) return res.status(404).json({ error: "Expense not found" });
  if (!requireRole(req, res, expense.groupId, "editor")) return;
  const updated = expenses.update(expenseId, req.body);
  res.json(updated);
});

app.delete("/api/expenses/:id", (req: Request, res: Response) => {
  const expenseId = param(req, "id");
  const expense = expenses.getById(expenseId);
  if (!expense) return res.status(404).json({ error: "Expense not found" });
  if (!requireRole(req, res, expense.groupId, "admin")) return;
  expenses.delete(expenseId);
  res.status(204).end();
});

// ─── Settlements ─────────────────────────────────────────

app.get("/api/groups/:groupId/settlements", (req: Request, res: Response) => {
  res.json(settlements.getByGroup(param(req, "groupId")));
});

app.post("/api/groups/:groupId/settlements", (req: Request, res: Response) => {
  const groupId = param(req, "groupId");
  if (!requireRole(req, res, groupId, "editor")) return;
  const { fromUser, toUser, amount } = req.body;
  if (!fromUser || !toUser || !amount) {
    return res.status(400).json({ error: "fromUser, toUser, and amount are required" });
  }
  const settlement = settlements.create({
    groupId,
    fromUser,
    toUser,
    amount: Number(amount),
    date: req.body.date || new Date().toISOString(),
  });
  res.status(201).json(settlement);
});

app.delete("/api/settlements/:id", (req: Request, res: Response) => {
  const settlementId = param(req, "id");
  const allSettlements = settlements.getAll();
  const settlement = allSettlements.find((s) => s.id === settlementId);
  if (!settlement) return res.status(404).json({ error: "Settlement not found" });
  if (!requireRole(req, res, settlement.groupId, "admin")) return;
  settlements.delete(settlementId);
  res.status(204).end();
});

// ─── Balances & Debts ────────────────────────────────────

app.get("/api/groups/:groupId/balances", (req: Request, res: Response) => {
  const balances = calculateBalances(param(req, "groupId"));
  if (!balances) return res.status(404).json({ error: "Group not found" });

  const result = Object.entries(balances).map(([userId, balance]) => ({
    user: users.getById(userId),
    balance,
  }));
  res.json(result);
});

app.get("/api/groups/:groupId/debts", (req: Request, res: Response) => {
  const debts = simplifyDebts(param(req, "groupId"));
  if (!debts) return res.status(404).json({ error: "Group not found" });

  const result = debts.map((d) => ({
    from: users.getById(d.from),
    to: users.getById(d.to),
    amount: d.amount,
  }));
  res.json(result);
});

// ─── Start ───────────────────────────────────────────────

export { app };

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`FairShare Mock API running at http://localhost:${PORT}`);
  });
}
