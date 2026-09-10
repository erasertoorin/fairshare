# FairShare

Gruppenausgaben fair teilen — eine Splitwise-ähnliche Web-App zum Tracken und Aufteilen von gemeinsamen Ausgaben.

**[Roadmap & Feature-Übersicht](https://claude.ai/code/artifact/6b65264f-9298-4e5c-8318-ea71d25649fb)**
**[Fairshare Entwicklungsprotokoll](https://claude.ai/code/artifact/8d15b60b-ec44-4e55-b235-7b2d68f9c6a1)**

## Tech Stack

- **Frontend:** Angular v20, Angular Material, RxJS, TypeScript
- **Backend:** Express v5, TypeScript, In-Memory Datenbank
- **Testing:** Vitest, Supertest (71 Backend-Tests)

## Setup

### Backend (Mock-API)

```bash
cd backend
npm install
npm run dev        # startet auf http://localhost:3000
npm test           # Tests ausführen
```

### Frontend

```bash
cd frontend
npm install
ng serve           # startet auf http://localhost:4200
```

> Die API nutzt eine In-Memory Datenbank mit Seed-Daten (4 User, 2 Gruppen, 7 Ausgaben). Daten werden beim Neustart des Backends zurückgesetzt.

## Features

### Gruppen & Mitglieder
- Gruppen erstellen mit Name und Beschreibung
- Mitglieder hinzufügen mit Rollenvergabe (Admin, Editor, Viewer)
- Rollenbasierte Berechtigung im Backend via X-User-Id Header

### Ausgaben
- Ausgaben erstellen und bearbeiten (Betrag, Beschreibung, Kategorie, Zahler)
- Equal Split zwischen ausgewählten Mitgliedern
- Erweiterbare Kategorien als DB-Entität

### Salden & Zahlungen
- Echtzeit-Saldenberechnung pro Gruppenmitglied
- Zahlungen erfassen (Teilbetrag oder voller Betrag)
- Salden werden nach jeder Zahlung automatisch aktualisiert

### Auth (Mock)
- User-Auswahl aus Seed-Daten
- Login-Persistenz via localStorage

## Architektur

### State Management
Signal-basierter Store mit RxJS:
- **Subjects** als Action-Trigger (loadGroups, addExpense, markAsPaid, ...)
- **RxJS Pipelines** (switchMap, forkJoin, catchError) für async Operationen
- **Signals** als State-Output für die Components
- `catchError` innerhalb von `switchMap` damit der Subject-Stream bei Fehlern nicht stirbt

### Error Handling
- Globaler HTTP Error Interceptor mit MatSnackBar
- Kontextabhängige Fehlermeldungen (401, 403, 404, Server nicht erreichbar)
- Fehler werden mit `throwError` weitergereicht für optionale Component-Level Behandlung

### Performance
- Lazy Loading Routes
- `takeUntilDestroyed()` für automatisches Subscription-Cleanup
- Daten werden on-demand geladen (Gruppendetails erst beim Öffnen)

## API Endpoints

| Methode | Endpoint | Beschreibung | Rolle |
|---|---|---|---|
| GET/POST | `/api/users` | User auflisten / erstellen | - |
| GET/PUT/DELETE | `/api/users/:id` | User lesen / ändern / löschen | - |
| GET/POST | `/api/groups` | Gruppen auflisten / erstellen | - |
| GET/PUT/DELETE | `/api/groups/:id` | Gruppe lesen / ändern / löschen | Admin |
| GET/POST | `/api/groups/:groupId/expenses` | Ausgaben auflisten / erstellen | Editor |
| GET/PUT/DELETE | `/api/expenses/:id` | Ausgabe lesen / ändern / löschen | Editor/Admin |
| GET/POST | `/api/groups/:groupId/payments` | Zahlungen auflisten / erstellen | Editor |
| DELETE | `/api/payments/:id` | Zahlung löschen | Admin |
| GET | `/api/groups/:groupId/balances` | Salden berechnen | - |
| GET/POST | `/api/categories` | Kategorien auflisten / erstellen | - |

## Projektstruktur

```
backend/
├── src/
│   ├── models.ts          # TypeScript Interfaces & Enums
│   ├── repository.ts      # In-Memory CRUD & Businesslogik
│   ├── seed-data.ts       # Testdaten
│   ├── server.ts          # Express REST API
│   └── tests/             # Vitest Tests
frontend/
├── src/app/
│   ├── services/
│   │   ├── api.service.ts        # HTTP Client
│   │   ├── auth.service.ts       # Mock Auth mit Signals
│   │   ├── error.interceptor.ts  # Globaler Error Handler
│   │   └── group.store.ts        # Signal-basierter Store
│   ├── pages/
│   │   ├── login/                # User-Auswahl
│   │   ├── dashboard/            # Gruppenübersicht
│   │   └── group-detail/         # Tabs: Salden, Ausgaben, Mitglieder
│   └── components/
│       ├── add-expense-dialog/   # Ausgabe erstellen/bearbeiten
│       ├── payment-dialog/       # Zahlung erfassen
│       └── add-member-dialog/    # Mitglied hinzufügen
```
