# QM — WorkForce OS

A mobile-first workforce management web app.

## Project Structure

```
QM-WorkForceOS/
├── index.html        ← Main HTML (all screens/layout)
├── css/
│   └── styles.css    ← All styles & CSS variables
├── js/
│   └── app.js        ← All JavaScript logic
└── README.md
```

## How to Run

Just open `index.html` in any browser — no server needed for demo mode.

For live API mode, start your backend at `http://localhost:5000`.

## Demo Login Credentials

| Role        | Email                      | Password   |
|-------------|----------------------------|------------|
| Admin       | admin@workforceos.com      | Admin@123  |
| Supervisor  | priya@workforceos.com      | Pass@123   |
| Team Leader | leader@workforceos.com     | Pass@123   |
| Worker      | anita@workforceos.com      | Pass@123   |

## Features

- 4 role-based dashboards (Admin, Supervisor, Team Leader, Worker)
- QC check submission with live score preview
- Attendance marking & check-in/out
- Production log submission & approval
- Fraud flag detection (hours > 12)
- Payment records & payroll batch processing
- CSV export
- Demo mode (works fully offline without a backend)
