# CourseForge AI - Setup Guide

## AI Training Course Generator
Generate company-specific training courses with AI (Gemini), powered by Next.js, Convex, and Clerk.

---

## Prerequisites
- Node.js 18+
- npm or yarn
- A Google Gemini API key
- A Clerk account
- A Convex account

---

## Step 1: Install Dependencies

```bash
cd ai-training-course-generator
npm install
```

---

## Step 2: Set Up Convex

1. Create a free account at [convex.dev](https://convex.dev)
2. Initialize Convex in your project:

```bash
npx convex dev
```

3. This will prompt you to log in and create a project. It will generate the `convex/_generated` folder and give you your `CONVEX_URL`.

---

## Step 3: Set Up Clerk

1. Create a free account at [clerk.com](https://clerk.com)
2. Create a new application
3. Get your **Publishable Key** and **Secret Key** from the Clerk dashboard
4. In Clerk dashboard, go to **JWT Templates** and create a new template:
   - Name: `convex`
   - Issuer: Your Clerk issuer URL (e.g., `https://your-app.clerk.accounts.dev`)
5. Copy the **Issuer URL** for the Convex auth config

---

## Step 4: Get Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Create a new API key
3. Copy the key

---

## Step 5: Configure Environment Variables

Edit the `.env.local` file in the project root:

```env
# Convex
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## Step 6: Configure Convex Auth

Update `convex/auth.config.ts` with your Clerk issuer domain:

```ts
const authConfig = {
  providers: [
    {
      domain: "https://your-app.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};

export default authConfig;
```

---

## Step 7: Run the Development Server

Open two terminal windows:

**Terminal 1 - Convex:**
```bash
npx convex dev
```

**Terminal 2 - Next.js:**
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
ai-training-course-generator/
├── convex/                    # Convex backend
│   ├── schema.ts              # Database schema
│   ├── courses.ts             # Course CRUD operations
│   ├── modules.ts             # Module operations
│   ├── lessons.ts             # Lesson operations
│   ├── quizzes.ts             # Quiz operations
│   ├── progress.ts            # User progress tracking
│   ├── certificates.ts        # Certificate management
│   └── auth.config.ts         # Clerk auth config
├── src/
│   ├── app/
│   │   ├── page.tsx           # Landing page
│   │   ├── layout.tsx         # Root layout
│   │   ├── globals.css        # Global styles
│   │   ├── sign-in/           # Clerk sign-in
│   │   ├── sign-up/           # Clerk sign-up
│   │   ├── dashboard/
│   │   │   ├── layout.tsx     # Dashboard layout with navbar
│   │   │   └── page.tsx       # Dashboard page
│   │   ├── courses/
│   │   │   ├── layout.tsx     # Courses layout
│   │   │   ├── create/
│   │   │   │   └── page.tsx   # Course creator with AI
│   │   │   └── [courseId]/
│   │   │       ├── page.tsx   # Course viewer
│   │   │       ├── learn/
│   │   │       │   └── page.tsx  # Learning interface
│   │   │       └── certificate/
│   │   │           └── page.tsx  # Certificate page
│   │   └── api/
│   │       ├── generate-course/
│   │       │   └── route.ts   # Gemini course generation
│   │       └── generate-quiz/
│   │           └── route.ts   # Gemini quiz generation
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   └── layout/
│   │       └── navbar.tsx     # Navigation bar
│   ├── lib/
│   │   └── utils.ts           # Utility functions
│   ├── providers/
│   │   └── convex-client-provider.tsx
│   └── middleware.ts          # Clerk auth middleware
├── .env.local                 # Environment variables
├── package.json
└── tsconfig.json
```

---

## Features

- **AI Course Generation**: Upload requirements → Gemini generates full courses
- **Structured Content**: Modules → Lessons → Quizzes hierarchy
- **Auto-Generated Quizzes**: AI creates questions for each lesson and module
- **Progress Tracking**: Track lesson completion per user
- **Certificates**: Auto-generated completion certificates
- **Print-Ready**: Certificates optimized for printing/PDF export
- **Authentication**: Full auth with Clerk (sign up, sign in, user management)
- **Real-time Database**: Convex provides real-time data sync

---

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| Next.js 16 | React framework |
| TypeScript | Type safety |
| Convex | Backend & database |
| Clerk | Authentication |
| Google Gemini | AI content generation |
| Tailwind CSS 4 | Styling |
| shadcn/ui | UI components |
| Radix UI | Accessible primitives |
| Lucide React | Icons |
