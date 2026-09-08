import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../server.js";

// ─── Users API ───────────────────────────────────────────

describe("GET /api/users", () => {
  it("should return all users", async () => {
    const res = await request(app).get("/api/users");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(4);
  });
});

describe("GET /api/users/:id", () => {
  it("should return a user by id", async () => {
    const res = await request(app).get("/api/users/u1");
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Alice Müller");
  });

  it("should return 404 for unknown user", async () => {
    const res = await request(app).get("/api/users/unknown");
    expect(res.status).toBe(404);
  });
});

describe("POST /api/users", () => {
  it("should create a user", async () => {
    const res = await request(app)
      .post("/api/users")
      .send({ name: "New User", email: "new@test.com" });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe("New User");
  });

  it("should reject missing fields", async () => {
    const res = await request(app).post("/api/users").send({ name: "Only Name" });
    expect(res.status).toBe(400);
  });
});

// ─── Groups API ──────────────────────────────────────────

describe("GET /api/groups", () => {
  it("should return all groups", async () => {
    const res = await request(app).get("/api/groups");
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  it("should filter by userId", async () => {
    const res = await request(app).get("/api/groups?userId=u4");
    expect(res.status).toBe(200);
    expect(res.body.every((g: any) => g.members.some((m: any) => m.userId === "u4"))).toBe(true);
  });
});

describe("GET /api/groups/:id", () => {
  it("should return group with memberDetails", async () => {
    const res = await request(app).get("/api/groups/g1");
    expect(res.status).toBe(200);
    expect(res.body.memberDetails).toBeDefined();
    expect(res.body.memberDetails[0].user).toBeDefined();
    expect(res.body.memberDetails[0].role).toBeDefined();
  });

  it("should return 404 for unknown group", async () => {
    const res = await request(app).get("/api/groups/unknown");
    expect(res.status).toBe(404);
  });
});

describe("PUT /api/groups/:id - permissions", () => {
  it("should return 401 without X-User-Id header", async () => {
    const res = await request(app)
      .put("/api/groups/g1")
      .send({ name: "Hacked" });
    expect(res.status).toBe(401);
  });

  it("should return 403 for viewer", async () => {
    const res = await request(app)
      .put("/api/groups/g1")
      .set("X-User-Id", "u3")
      .send({ name: "Hacked" });
    expect(res.status).toBe(403);
  });

  it("should return 403 for editor", async () => {
    const res = await request(app)
      .put("/api/groups/g1")
      .set("X-User-Id", "u2")
      .send({ name: "Hacked" });
    expect(res.status).toBe(403);
  });

  it("should allow admin to update", async () => {
    const res = await request(app)
      .put("/api/groups/g1")
      .set("X-User-Id", "u1")
      .send({ name: "WG Updated" });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("WG Updated");
  });
});

// ─── Categories API ──────────────────────────────────────

describe("GET /api/categories", () => {
  it("should return all categories", async () => {
    const res = await request(app).get("/api/categories");
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(9);
    expect(res.body[0]).toHaveProperty("icon");
  });
});

describe("POST /api/categories", () => {
  it("should create a new category", async () => {
    const res = await request(app)
      .post("/api/categories")
      .send({ name: "Pets", icon: "pets" });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Pets");
  });

  it("should reject missing fields", async () => {
    const res = await request(app)
      .post("/api/categories")
      .send({ name: "NoIcon" });
    expect(res.status).toBe(400);
  });
});

// ─── Expenses API ────────────────────────────────────────

describe("GET /api/groups/:groupId/expenses", () => {
  it("should return expenses for a group", async () => {
    const res = await request(app).get("/api/groups/g1/expenses");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.every((e: any) => e.groupId === "g1")).toBe(true);
  });
});

describe("POST /api/groups/:groupId/expenses - permissions", () => {
  const validExpense = {
    description: "Test",
    amount: 30,
    paidBy: "u1",
    splitBetween: ["u1", "u2"],
  };

  it("should return 401 without X-User-Id", async () => {
    const res = await request(app)
      .post("/api/groups/g1/expenses")
      .send(validExpense);
    expect(res.status).toBe(401);
  });

  it("should return 403 for viewer", async () => {
    const res = await request(app)
      .post("/api/groups/g1/expenses")
      .set("X-User-Id", "u3")
      .send(validExpense);
    expect(res.status).toBe(403);
  });

  it("should allow editor to create expense", async () => {
    const res = await request(app)
      .post("/api/groups/g1/expenses")
      .set("X-User-Id", "u2")
      .send(validExpense);
    expect(res.status).toBe(201);
    expect(res.body.description).toBe("Test");
    expect(res.body.groupId).toBe("g1");
  });

  it("should allow admin to create expense", async () => {
    const res = await request(app)
      .post("/api/groups/g1/expenses")
      .set("X-User-Id", "u1")
      .send(validExpense);
    expect(res.status).toBe(201);
  });

  it("should reject missing required fields", async () => {
    const res = await request(app)
      .post("/api/groups/g1/expenses")
      .set("X-User-Id", "u1")
      .send({ description: "Incomplete" });
    expect(res.status).toBe(400);
  });
});

describe("PUT /api/expenses/:id - permissions", () => {
  it("should return 403 for viewer editing expense in g1", async () => {
    const res = await request(app)
      .put("/api/expenses/e1")
      .set("X-User-Id", "u3")
      .send({ description: "Hacked" });
    expect(res.status).toBe(403);
  });

  it("should allow editor to update expense", async () => {
    const res = await request(app)
      .put("/api/expenses/e1")
      .set("X-User-Id", "u2")
      .send({ description: "Edited by editor" });
    expect(res.status).toBe(200);
    expect(res.body.description).toBe("Edited by editor");
  });

  it("should return 404 for non-existent expense", async () => {
    const res = await request(app)
      .put("/api/expenses/nope")
      .set("X-User-Id", "u1")
      .send({ description: "x" });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/expenses/:id - permissions", () => {
  it("should return 403 for editor deleting expense (requires admin)", async () => {
    const res = await request(app)
      .delete("/api/expenses/e2")
      .set("X-User-Id", "u2");
    expect(res.status).toBe(403);
  });

  it("should allow admin to delete expense", async () => {
    const res = await request(app)
      .delete("/api/expenses/e2")
      .set("X-User-Id", "u1");
    expect(res.status).toBe(204);
  });
});

// ─── Payments API ─────────────────────────────────────

describe("POST /api/groups/:groupId/payments - permissions", () => {
  const validPayment = { fromUser: "u2", toUser: "u1", amount: 20 };

  it("should return 403 for viewer", async () => {
    const res = await request(app)
      .post("/api/groups/g1/payments")
      .set("X-User-Id", "u3")
      .send(validPayment);
    expect(res.status).toBe(403);
  });

  it("should allow editor to create payment", async () => {
    const res = await request(app)
      .post("/api/groups/g1/payments")
      .set("X-User-Id", "u2")
      .send(validPayment);
    expect(res.status).toBe(201);
    expect(res.body.amount).toBe(20);
  });
});

// ─── Balances & Debts API ────────────────────────────────

describe("GET /api/groups/:groupId/balances", () => {
  it("should return balances with user details", async () => {
    const res = await request(app).get("/api/groups/g2/balances");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty("user");
    expect(res.body[0]).toHaveProperty("balance");
  });

  it("should return 404 for unknown group", async () => {
    const res = await request(app).get("/api/groups/nope/balances");
    expect(res.status).toBe(404);
  });
});

// TODO v2: Debts endpoint tests
