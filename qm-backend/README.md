# QM WorkForce OS — Backend

Node.js + Express + Supabase REST API.

## Project Structure

```
qm-backend/
├── server.js               ← Entry point
├── seed.js                 ← Seeds demo users into DB
├── package.json
├── .env                    ← Add your Supabase credentials here
├── middleware/
│   └── auth.js             ← JWT auth + role guard
├── routes/
│   ├── auth.js             ← Login, profile, password
│   ├── users.js            ← CRUD, flag/unflag, wipe
│   ├── attendance.js       ← Check-in/out, mark attendance
│   ├── production.js       ← Submit & approve production logs
│   ├── qc.js               ← Submit QC checks
│   ├── payments.js         ← View & run batch payroll
│   └── dashboard.js        ← Role-based stats
└── supabase/
    └── schema.sql          ← Run this in Supabase SQL Editor first
```

## Setup Steps

### 1. Create a Supabase project
Go to https://supabase.com → New Project → copy your URL and Service Role Key.

### 2. Run the schema
Supabase Dashboard → SQL Editor → New Query → paste `supabase/schema.sql` → Run.

### 3. Configure .env
```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here
```

### 4. Install & seed
```bash
npm install
node seed.js
```

### 5. Start the server
```bash
npm run dev      # with nodemon (auto-restart)
npm start        # production
```

API runs at: http://localhost:5000

## Demo Accounts (after seeding)

| Role        | Email                   | Password   |
|-------------|-------------------------|------------|
| Admin       | admin@workforceos.com   | Admin@123  |
| Supervisor  | priya@workforceos.com   | Pass@123   |
| Team Leader | leader@workforceos.com  | Pass@123   |
| Worker      | anita@workforceos.com   | Pass@123   |

## API Endpoints

| Method | Path                       | Auth         |
|--------|----------------------------|--------------|
| POST   | /api/auth/login            | Public       |
| GET    | /api/auth/me               | Any          |
| GET    | /api/users                 | Admin/Sup/TL |
| POST   | /api/users                 | Admin        |
| PUT    | /api/users/:id/flag        | Admin/Sup/TL |
| GET    | /api/attendance            | Any          |
| POST   | /api/attendance/checkin    | Participant  |
| PUT    | /api/attendance/checkout   | Participant  |
| POST   | /api/attendance/mark       | Admin/Sup/TL |
| GET    | /api/production            | Any          |
| POST   | /api/production            | Participant  |
| PUT    | /api/production/:id        | Admin/Sup/TL |
| GET    | /api/qc                    | Any          |
| POST   | /api/qc                    | Admin/Sup/TL |
| GET    | /api/payments              | Any          |
| POST   | /api/payments/batch        | Admin        |
| GET    | /api/dashboard/admin       | Admin        |
| GET    | /api/dashboard/supervisor  | Admin/Sup/TL |
| GET    | /api/dashboard/participant | Participant  |
