# LinkedIn Message Personalizer

A simple and professional **Next.js + Supabase web application** designed to help users personalize LinkedIn outreach messages for their connections.

The application allows a user to create one reusable message template containing `{{firstName}}`, add connection details, and generate a personalized message for each connection.

> **Important:** This project currently does not connect directly to LinkedIn. Messages are generated inside the application and must be copied and sent manually by the user.

---

## 📌 Project Overview

The **LinkedIn Message Personalizer** was developed as a portfolio project to demonstrate practical skills in:

- Next.js
- React
- JavaScript
- Supabase
- PostgreSQL
- Authentication
- CRUD operations
- Dynamic personalization
- Responsive UI design
- Data validation
- Secure environment variables

The main purpose is to reduce repetitive work when preparing personalized LinkedIn outreach messages.

Instead of manually changing a person's name in every message, the application uses a simple placeholder:

```text
{{firstName}}
```

For example:

### Template

```text
Hi {{firstName}}, hope you're doing well! I wanted to connect with you regarding potential opportunities.
```

### Generated Message

For Rahul:

```text
Hi Rahul, hope you're doing well! I wanted to connect with you regarding potential opportunities.
```

For Srishti:

```text
Hi Srishti, hope you're doing well! I wanted to connect with you regarding potential opportunities.
```

---

# ✨ Features

## 1. User Authentication

Users can create an account and log in using:

- Full name
- Email
- Password

Authentication is handled using **Supabase Auth**.

User information such as the full name is stored in Supabase user metadata.

---

## 2. Personalized User Experience

The application dynamically displays the logged-in user's name.

For example:

```text
Hi, Hasvanth!
```

The application also displays:

- User initials
- Full name
- Email address

No user name is hard-coded into the dashboard.

---

## 3. Message Templates

Users can create reusable message templates.

Templates support the following personalization variable:

```text
{{firstName}}
```

Example:

```text
Hi {{firstName}}, hope you're doing well!

I'm reaching out regarding potential opportunities in Data Analytics and Data Engineering.
```

---

## 4. Contact Management

Users can add connection/contact information such as:

- First name
- Last name
- Company
- Job title
- LinkedIn URL
- Notes

Contacts are stored in Supabase.

---

## 5. Automatic First-Name Personalization

The application automatically replaces:

```text
{{firstName}}
```

with the contact's first name.

Example:

```text
Template:
Hi {{firstName}}, I hope you're doing well.

Contact:
Rahul

Result:
Hi Rahul, I hope you're doing well.
```

The personalization is performed using PostgreSQL logic rather than an external AI service.

---

## 6. Generated Message Storage

Generated messages are stored in the database together with:

- Contact information
- First name
- Template snapshot
- Generated message
- Creation time

This makes it possible to keep a history of generated messages.

---

## 7. Copy Message

Users can copy the personalized message directly from the application.

The copied message remains exactly the same as the stored generated message.

The user can then manually open LinkedIn and send the message.

---

## 8. Dashboard

The dashboard provides a centralized workspace for:

- Contacts
- Templates
- Generated messages
- Personalization
- Recent activity
- Settings

---

## 9. Responsive Interface

The application is designed to work across:

- Desktop
- Laptop
- Tablet
- Mobile devices

---

# 🛠️ Tech Stack

## Frontend

- Next.js
- React
- JavaScript
- CSS

## Backend / Database

- Supabase
- PostgreSQL
- Supabase Authentication

## Development Tools

- Node.js
- npm
- VS Code
- Git
- GitHub

---

# 📂 Project Structure

```text
linkedin-message-personalizer/
│
├── app/
│   ├── globals.css
│   ├── layout.js
│   └── page.js
│
├── components/
│   ├── Auth.js
│   ├── Workspace.js
│   └── ui.js
│
├── lib/
│   ├── files.js
│   └── supabase.js
│
├── supabase/
│   ├── schema.sql
│   └── exact_personalization.sql
│
├── .env.local.example
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

---

# 🚀 Getting Started

Follow the steps below to run the project locally.

## 1. Requirements

Install the following software:

- Node.js
- npm
- Git

Verify Node.js and npm:

```bash
node -v
npm -v
```

---

# 2. Clone the Repository

```bash
git clone https://github.com/Hasvanth07/linkedin-message-personalizer.git
cd linkedin-message-personalizer
```

---

# 3. Install Dependencies

```bash
npm install
```

This installs all required packages from `package.json`.

---

# 4. Create a Supabase Project

Create a project in Supabase.

After creating the project, obtain:

- Supabase Project URL
- Supabase Publishable/Anon Key

---

# 5. Configure Environment Variables

Create:

```text
.env.local
```

Add:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_publishable_key
```

### Important

Never upload `.env.local` to GitHub.

Do not expose:

- Supabase service-role keys
- Database passwords
- Private API keys
- Authentication secrets

The `.env.local.example` file can be committed because it contains only placeholder values.

---

# 6. Configure Supabase Database

Open the Supabase SQL Editor.

Run the SQL provided in:

```text
supabase/schema.sql
```

Then run:

```text
supabase/exact_personalization.sql
```

The database includes validation to ensure that generated messages correctly correspond to their templates.

---

# 7. Configure Authentication

In Supabase:

```text
Authentication
    ↓
Providers
    ↓
Email
```

Enable email/password authentication.

Configure the local development URL:

```text
http://localhost:3000
```

For password recovery:

```text
http://localhost:3000/?recovery=1
```

---

# 8. Start the Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

# 🧑‍💻 Using the Application

## Step 1 — Create an Account

Register using:

- Full name
- Email
- Password

---

## Step 2 — Create a Message Template

Example:

```text
Hi {{firstName}}, hope you're doing well!

I came across your profile and wanted to connect with you regarding potential opportunities in Data Analytics and Data Engineering.

Looking forward to connecting.
```

---

## Step 3 — Add a Contact

Example:

```text
First Name: Rahul
Last Name: Kumar
Company: ABC Technologies
Job Title: Data Analyst
```

---

## Step 4 — Generate the Message

The application replaces:

```text
{{firstName}}
```

with:

```text
Rahul
```

Result:

```text
Hi Rahul, hope you're doing well!

I came across your profile and wanted to connect with you regarding potential opportunities in Data Analytics and Data Engineering.

Looking forward to connecting.
```

---

## Step 5 — Copy the Message

Click the copy button.

The generated message is copied to the clipboard.

---

## Step 6 — Send Manually

Open LinkedIn, navigate to the relevant connection, and manually send the copied message.

---

# 🔐 LinkedIn Integration & Limitations

This version of the project intentionally does **not** automate LinkedIn.

The application does not:

- Collect LinkedIn passwords
- Store LinkedIn cookies
- Scrape LinkedIn profiles
- Automate a LinkedIn browser
- Automatically send LinkedIn messages
- Automatically send connection requests
- Bypass LinkedIn security controls
- Use unofficial LinkedIn APIs

The current workflow is:

```text
Create Template
      ↓
Add Contact
      ↓
Generate Personalized Message
      ↓
Copy Message
      ↓
Open LinkedIn
      ↓
Send Manually
```

Any future LinkedIn integration should use LinkedIn's official APIs and approved permissions.

---

# 🔒 Security

The project follows basic security practices.

## Environment Variables

Sensitive configuration is stored in:

```text
.env.local
```

and should not be committed to GitHub.

## Authentication

Authentication is handled through Supabase Auth instead of storing passwords directly in the application.

## Database

Supabase PostgreSQL is used for storing application data.

## User Data

The application is designed so that authenticated users work within their own workspace.

---

# 🗄️ Database Personalization Validation

The project includes PostgreSQL constraints to make sure generated messages remain consistent with their templates.

The database verifies that:

```text
generated message =
template with {{firstName}} replaced by first_name
```

It also ensures that:

- A first name is present.
- The template contains `{{firstName}}`.
- The generated message matches the expected personalization.

This prevents inconsistent generated messages from being stored.

---

# 📊 Example Workflow

```text
User Login
    ↓
Dashboard
    ↓
Create Message Template
    ↓
Add Connections
    ↓
Generate Personalized Messages
    ↓
Review Messages
    ↓
Copy Message
    ↓
Send Manually on LinkedIn
```

---

# 🎯 Project Goals

The project was created to demonstrate practical implementation of:

- Full-stack web development
- Authentication
- Database design
- PostgreSQL
- CRUD operations
- Dynamic data handling
- Personalization logic
- Responsive UI
- Secure environment configuration
- Git/GitHub workflow

It also demonstrates how a real-world productivity problem can be converted into a small full-stack application.

---

# 📈 Future Improvements

Possible future improvements include:

- Official LinkedIn OAuth login
- Official LinkedIn API integration where permitted
- Importing connections through supported LinkedIn APIs
- Bulk contact import
- CSV contact import
- Message history
- Search and filtering
- Contact tags
- Message templates library
- Analytics dashboard
- Follow-up reminders
- Deployment to Vercel
- Improved mobile UI

---

# ☁️ Deployment

The application can be deployed using:

### Frontend

```text
Vercel
```

### Backend / Database

```text
Supabase
```

A production deployment requires updating:

- Environment variables
- Supabase authentication URLs
- Supabase redirect URLs
- Production domain settings

---

# 🧪 Development Commands

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

---

# 📌 GitHub Upload Checklist

The following files should be included in GitHub:

```text
✅ app/
✅ components/
✅ lib/
✅ supabase/
✅ package.json
✅ package-lock.json
✅ README.md
✅ .env.local.example
```

Do NOT upload:

```text
❌ .env.local
❌ node_modules/
❌ .next/
❌ Supabase service-role keys
❌ Passwords
❌ Private API keys
```

---

# 🌐 GitHub Repository

**Hasvanth07/linkedin-message-personalizer**

---

# 👨‍💻 Author

**Vipparthi Hasvanth Kumar**

B.Tech — Artificial Intelligence & Data Science

Hyderabad, Telangana, India

Interested in:

- Data Analytics
- Data Engineering
- Python
- SQL
- Power BI
- Data Science
- AI 
- AI Engineer
- LLM Agents

---

# 📄 License

This project is intended primarily as a portfolio and learning project.

You may modify and extend the project for educational and personal development purposes.

---

# ⭐ Acknowledgement

This project was developed as a practical full-stack portfolio project combining:

**Next.js + React + Supabase + PostgreSQL + Authentication + Personalized Messaging**
