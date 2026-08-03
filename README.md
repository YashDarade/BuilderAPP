# BuildTrack

BuildTrack is a construction management platform built to help builders, site engineers, and clients manage projects from a single dashboard.

The project focuses on everyday construction workflows like budget tracking, expense management, material inventory, reports, and project updates. Different users have different permissions based on their role, allowing each person to access only the features relevant to them.

This project is currently under active development, with more AI-assisted features planned in future versions.

---

## Features

- Authentication using Supabase
- Role-based access
    - Builder
    - Site Engineer
    - Client
- Project Dashboard
- Budget Management
- Expense Tracking
- Material Management
- Reports
- Notifications
- Site Photos
- Client Portal
- AI Tools

---

## Tech Stack

Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS

Backend

- Supabase
- PostgreSQL
- Authentication
- Storage

Libraries

- Zustand
- React Hook Form
- Zod
- Recharts
- jsPDF

---

## Folder Structure

```
src
│
├── app
├── components
├── hooks
├── lib
├── store
├── types
└── utils
```

---

## Getting Started

Clone the repository

```bash
git clone https://github.com/YashDarade/BuilderAPP.git
```

Install dependencies

```bash
npm install
```

Create a `.env.local` file

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url

NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Run the project

```bash
npm run dev
```

---

## Demo Accounts

The repository includes demo users with sample project data for testing different dashboards.

Available roles

- Builder
- Site Engineer
- Client

Newly registered users will start with an empty workspace.

---

## Screenshots

| Dashboard | Projects |
|-----------|----------|
| Add Screenshot | Add Screenshot |

| Budget | Reports |
|--------|---------|
| Add Screenshot | Add Screenshot |

---

## Upcoming Features

- OCR Bill Scanner
- Material Detection using AI
- Daily Site Logs
- Contractor Payments
- Mobile App Improvements
- Push Notifications

---

## Why I Built This

I wanted to build a project that solves a real-world problem instead of another CRUD application. Construction projects often rely on spreadsheets and messaging apps to manage work, budgets, and materials. BuildTrack is an attempt to bring those workflows into a single platform while also exploring how AI can improve project management.

---

## Author

Yash Darade

GitHub: https://github.com/YashDarade
