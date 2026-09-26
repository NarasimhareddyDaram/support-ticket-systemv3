# support-ticket-systemv3

A support ticket management system built with **React**, **Vite**, and **Supabase**, allowing customers to raise issues and agents to track, respond to, and resolve them.

## 🔗 Live Demo

- **Live App:** [https://general-project-buil-jf0v.bolt.host/](https://general-project-buil-jf0v.bolt.host/)
- **GitHub Repository:** [support-ticket-systemv3](https://github.com/NarasimhareddyDaram/support-ticket-systemv3)

## ✨ Features

- **Ticket Creation** — Customers can submit new support tickets with a subject, detailed description, and priority level (Low, Medium, High, Urgent)
- **Ticket Tracking** — View ticket status (Open, In Progress, Resolved) and priority at a glance
- **Threaded Replies** — Customers and agents can exchange messages within a ticket, with sender name and role clearly displayed
- **Role-Based Access** — Separate views and permissions for **Customers** and **Agents**
- **Real-Time Data** — Backed by Supabase for authentication, database, and live updates

## 🛠️ Tech Stack

| Layer          | Technology              |
|----------------|--------------------------|
| Frontend       | React, TypeScript, Vite |
| Styling        | Tailwind CSS             |
| Backend/Database | Supabase (PostgreSQL)  |
| Hosting        | Bolt.new / Bolt Hosting  |
| Version Control| GitHub                  |

## 📂 Project Structure

```
├── .bolt/                  # Bolt.new project configuration
├── src/                    # Application source code
├── supabase/
│   └── migrations/         # Database schema and migrations
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.app.json
├── vite.config.ts
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- A Supabase project with the required tables (`profiles`, `tickets`, `comments`, etc.)

### Installation

```bash
# Clone the repository
git clone https://github.com/NarasimhareddyDaram/support-ticket-systemv3.git
cd support-ticket-systemv3

# Install dependencies
npm install

# Set up environment variables
# Create a .env file in the root directory with:
# VITE_SUPABASE_URL=your_supabase_project_url
# VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Run the development server
npm run dev
```

The app will be available at `http://localhost:5173` (or the port shown in your terminal).

### Building for Production

```bash
npm run build
```

The optimized production build will be output to the `dist/` folder.

## 🗄️ Database Schema (Supabase)

Key tables used in this project:

- **profiles** — Stores user information (`id`, `display_name`, `email`, `role`)
- **tickets** — Stores support ticket details (subject, description, status, priority)
- **comments** — Stores replies/messages associated with each ticket, linked to the sender's profile

## 👥 User Roles

- **Customer** — Can create tickets and reply to existing ones
- **Agent** — Can view all tickets, respond to customers, and update ticket status/priority

## 📝 License

This project is for educational/demonstration purposes.

## 🙋 Author

**Laxmi Narasimha Reddy Daram**
[GitHub Profile](https://github.com/NarasimhareddyDaram)

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-trtsetdm)


