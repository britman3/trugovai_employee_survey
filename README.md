# TruGovAI Employee AI Survey

A web application for conducting AI usage surveys across an organization. The app discovers "Shadow AI" — tools employees use without IT approval — and generates risk analytics for governance workflows.

## Features

- **Survey Management**: Create, configure, and manage AI usage surveys
- **Smart Surveys**: Pre-built questions with conditional logic based on AI usage
- **Auto Analytics**: Instant charts, risk flags, and department breakdowns
- **Risk Detection**: Automatically identify sensitive data exposure and unapproved tool usage
- **Export Functionality**: CSV export and PDF report generation
- **Mobile Responsive**: Surveys work on any device

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (with Prisma ORM)
- **Auth**: NextAuth.js (credentials provider)
- **Charts**: Recharts

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd trugovai_employee_survey
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

   Update `.env` with your database connection string:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/trugovai_survey"
   NEXTAUTH_SECRET="your-secure-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. Set up the database:
   ```bash
   npm run db:generate
   npm run db:push
   ```

5. (Optional) Seed sample data:
   ```bash
   npm run db:seed
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Default Credentials (after seeding)

- Email: `admin@trugovai.com`
- Password: `admin123`

## Project Structure

```
src/
├── app/
│   ├── admin/           # Admin dashboard pages
│   ├── api/             # API routes
│   ├── survey/          # Public survey pages
│   └── page.tsx         # Landing page
├── components/          # Reusable React components
├── lib/
│   ├── analytics.ts     # Analytics calculation functions
│   ├── auth.ts          # NextAuth configuration
│   ├── constants.ts     # Predefined AI tools and options
│   ├── prisma.ts        # Prisma client
│   └── types.ts         # TypeScript types and enums
└── types/               # Type declarations
```

## API Endpoints

### Admin (Authenticated)
- `GET /api/surveys` - List all surveys
- `POST /api/surveys` - Create survey
- `GET /api/surveys/:id` - Get survey details
- `PUT /api/surveys/:id` - Update survey
- `DELETE /api/surveys/:id` - Delete survey
- `POST /api/surveys/:id/close` - Close survey
- `GET /api/surveys/:id/responses` - List responses
- `GET /api/surveys/:id/analytics` - Get analytics
- `GET /api/surveys/:id/export/csv` - Export CSV
- `GET /api/surveys/:id/export/pdf` - Generate PDF report

### Public
- `GET /api/public/survey/:id` - Get survey for respondent
- `POST /api/public/survey/:id/respond` - Submit response

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed sample data
- `npm run db:studio` - Open Prisma Studio

## License

Part of the TruGovAI™ Toolkit — "Board-ready AI governance in 30 days"
