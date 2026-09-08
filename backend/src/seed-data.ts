import { GroupRole, type Database } from "./models.js";

export const seedData: Database = {
  users: [
    { id: "u1", name: "Alice Müller", email: "alice@example.com", avatarColor: "#E91E63" },
    { id: "u2", name: "Bob Schmidt", email: "bob@example.com", avatarColor: "#2196F3" },
    { id: "u3", name: "Charlie Weber", email: "charlie@example.com", avatarColor: "#4CAF50" },
    { id: "u4", name: "Diana Fischer", email: "diana@example.com", avatarColor: "#FF9800" },
  ],

  categories: [
    { id: "cat1", name: "General", icon: "receipt" },
    { id: "cat2", name: "Groceries", icon: "shopping_cart" },
    { id: "cat3", name: "Utilities", icon: "bolt" },
    { id: "cat4", name: "Household", icon: "home" },
    { id: "cat5", name: "Travel", icon: "flight" },
    { id: "cat6", name: "Accommodation", icon: "hotel" },
    { id: "cat7", name: "Food", icon: "restaurant" },
    { id: "cat8", name: "Entertainment", icon: "movie" },
    { id: "cat9", name: "Transport", icon: "directions_car" },
  ],

  groups: [
    {
      id: "g1",
      name: "WG Alexanderplatz",
      description: "Shared flat expenses",
      members: [
        { userId: "u1", role: GroupRole.ADMIN },
        { userId: "u2", role: GroupRole.EDITOR },
        { userId: "u3", role: GroupRole.VIEWER },
      ],
      createdAt: "2026-08-01T10:00:00Z",
    },
    {
      id: "g2",
      name: "Urlaub Mallorca 2026",
      description: "Holiday trip expenses",
      members: [
        { userId: "u1", role: GroupRole.ADMIN },
        { userId: "u2", role: GroupRole.ADMIN },
        { userId: "u3", role: GroupRole.EDITOR },
        { userId: "u4", role: GroupRole.VIEWER },
      ],
      createdAt: "2026-08-15T14:00:00Z",
    },
  ],

  expenses: [
    {
      id: "e1",
      groupId: "g1",
      description: "Wocheneinkauf REWE",
      amount: 67.5,
      currency: "EUR",
      paidBy: "u1",
      splitBetween: ["u1", "u2", "u3"],

      categoryId: "cat2",
      date: "2026-08-20T18:30:00Z",
      createdAt: "2026-08-20T18:30:00Z",
    },
    {
      id: "e2",
      groupId: "g1",
      description: "Internet Rechnung August",
      amount: 39.99,
      currency: "EUR",
      paidBy: "u2",
      splitBetween: ["u1", "u2", "u3"],

      categoryId: "cat3",
      date: "2026-08-22T09:00:00Z",
      createdAt: "2026-08-22T09:00:00Z",
    },
    {
      id: "e3",
      groupId: "g1",
      description: "Putzmittel dm",
      amount: 15.8,
      currency: "EUR",
      paidBy: "u3",
      splitBetween: ["u1", "u2", "u3"],

      categoryId: "cat4",
      date: "2026-08-25T11:00:00Z",
      createdAt: "2026-08-25T11:00:00Z",
    },
    {
      id: "e4",
      groupId: "g2",
      description: "Flugtickets",
      amount: 960.0,
      currency: "EUR",
      paidBy: "u1",
      splitBetween: ["u1", "u2", "u3", "u4"],

      categoryId: "cat5",
      date: "2026-08-16T08:00:00Z",
      createdAt: "2026-08-16T08:00:00Z",
    },
    {
      id: "e5",
      groupId: "g2",
      description: "Hotel 5 Nächte",
      amount: 1200.0,
      currency: "EUR",
      paidBy: "u2",
      splitBetween: ["u1", "u2", "u3", "u4"],

      categoryId: "cat6",
      date: "2026-08-17T15:00:00Z",
      createdAt: "2026-08-17T15:00:00Z",
    },
    {
      id: "e6",
      groupId: "g2",
      description: "Mietwagen",
      amount: 350.0,
      currency: "EUR",
      paidBy: "u3",
      splitBetween: ["u1", "u2", "u3", "u4"],

      categoryId: "cat5",
      date: "2026-08-18T10:00:00Z",
      createdAt: "2026-08-18T10:00:00Z",
    },
    {
      id: "e7",
      groupId: "g2",
      description: "Abendessen Restaurant",
      amount: 180.0,
      currency: "EUR",
      paidBy: "u4",
      splitBetween: ["u1", "u2", "u3", "u4"],

      categoryId: "cat7",
      date: "2026-08-19T20:00:00Z",
      createdAt: "2026-08-19T20:00:00Z",
    },
  ],

  payments: [
    {
      id: "s1",
      groupId: "g1",
      fromUser: "u3",
      toUser: "u1",
      amount: 10.0,
      date: "2026-08-28T12:00:00Z",
      createdAt: "2026-08-28T12:00:00Z",
    },
  ],
};
