# Orbbit Invoice Financing - Database Setup

This directory contains the Supabase PostgreSQL database configuration for the Orbbit Invoice Financing platform.

## 📁 Directory Structure

```
db/
├── supabase/
│   ├── config.toml           # Supabase configuration
│   ├── migrations/           # Database migration files (add yours here)
│   └── seed.sql             # Seed data for development (add yours here)
└── README.md                # This file
```

## 🚀 Quick Start

### Prerequisites

- **Docker Desktop** - Required for running Supabase locally
- **Supabase CLI** - Install via:
  ```bash
  brew install supabase/tap/supabase
  # or
  npm install -g supabase
  ```

### 1. Start Supabase Locally

```bash
cd db
supabase start
```

This will start local Supabase services (PostgreSQL, GoTrue, PostgREST, etc.)

### 2. Access Local Services

After `supabase start` completes, you'll see:

- **Studio URL**: http://localhost:54323
  - Visual database manager (like phpMyAdmin for Postgres)
- **API URL**: http://localhost:54321
  - REST and GraphQL endpoints
- **Database URL**: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
  - Direct PostgreSQL connection

### 3. Configure Environment Variables

Copy the connection details to your `.env` file:

```bash
# In project root
cp .env.example .env
```

Update with the values from `supabase status`:

```env
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=<get-from-supabase-status>
SUPABASE_SERVICE_ROLE_KEY=<get-from-supabase-status>
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

> **Tip**: Run `supabase status` anytime to see all connection details.

## 🛠️ Common Commands

### Development Workflow

```bash
# Start local Supabase (runs migrations + seeds)
supabase start

# Stop local Supabase (preserves data)
supabase stop

# Reset database (⚠️ deletes all data, re-runs migrations + seeds)
supabase db reset

# Check status
supabase status
```

### Managing Migrations

```bash
# Create a new migration
supabase migration new <migration_name>

# Example:
supabase migration new initial_schema

# Apply migrations to local database
supabase db reset

# Generate migration from Dashboard changes
supabase db diff --use-migra -f <migration_name>
```

### Accessing the Database

#### Using Supabase Studio (Recommended)
1. Open http://localhost:54323
2. Navigate to **Table Editor** or **SQL Editor**
3. Run queries, view data, manage tables

#### Using psql
```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

#### Using DataGrip / TablePlus / DBeaver
- Host: `127.0.0.1`
- Port: `54322`
- Database: `postgres`
- User: `postgres`
- Password: `postgres`

## 🔧 NestJS Integration

The backend includes `SupabaseService` to interact with the database.

### Using in Your Services

```typescript
import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class InvoiceService {
  constructor(private readonly supabase: SupabaseService) {}

  // Simple query using Supabase client
  async getInvoices() {
    const { data, error } = await this.supabase
      .from('invoices')
      .select('*');

    if (error) throw error;
    return data;
  }

  // Raw SQL query using postgres.js
  async getInvoiceById(id: string) {
    const result = await this.supabase.query`
      SELECT * FROM invoices WHERE id = ${id}
    `;
    return result[0];
  }

  // Transaction example
  async createInvoice(data: any) {
    return this.supabase.transaction(async (sql) => {
      const [invoice] = await sql`
        INSERT INTO invoices (...)
        VALUES (...)
        RETURNING *
      `;

      return invoice;
    });
  }
}
```

See `apps/backend/src/supabase/examples/invoice.repository.ts` for more examples.

## 🚀 Deployment to Production

### 1. Create Supabase Project

1. Go to https://app.supabase.com
2. Create a new project
3. Wait for provisioning (~2 minutes)

### 2. Link Local Project to Remote

```bash
supabase login
supabase link --project-ref <project-ref>
```

### 3. Push Migrations

```bash
# This will apply all migrations to production
supabase db push
```

### 4. Update Environment Variables

Update your production `.env` with:

```env
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<from-project-settings>
SUPABASE_SERVICE_ROLE_KEY=<from-project-settings>
DATABASE_URL=postgres://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

### 5. Verify Deployment

1. Open Supabase Studio: https://app.supabase.com/project/<project-ref>/editor
2. Check tables and data
3. Test API endpoints

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Check what's using the port
lsof -i :54321

# Stop Supabase
supabase stop

# Start again
supabase start
```

### Migration Errors

```bash
# Check migration status
supabase migration list

# Reset database (⚠️ deletes data)
supabase db reset
```

### Docker Issues

```bash
# Restart Docker Desktop

# Clean up Docker volumes
supabase stop
docker system prune -a --volumes

# Start fresh
supabase start
```

### Connection Refused

Make sure Docker Desktop is running:
```bash
docker ps
```

If no containers are running:
```bash
supabase stop
supabase start
```

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [postgres.js Documentation](https://github.com/porsager/postgres)

## 🤝 Contributing

When making schema changes:

1. Create a new migration:
   ```bash
   supabase migration new your_change_description
   ```

2. Write your SQL in the migration file

3. Test locally:
   ```bash
   supabase db reset
   ```

4. Commit the migration file to git

5. Push to production:
   ```bash
   supabase db push
   ```

## 📄 License

Copyright © 2025 Orbbit. All rights reserved.
