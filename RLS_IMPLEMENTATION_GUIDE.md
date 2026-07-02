# PostgreSQL Row Level Security Implementation for Reverb

## Overview
This guide implements PostgreSQL RLS in a single database architecture with AdonisJS v6. While AdonisJS doesn't have native RLS support, we can implement it effectively using raw SQL and careful session management.

## Architecture Decision
- **Single PostgreSQL database** (no sharding)
- **Row Level Security** for tenant isolation
- **Application-level enforcement** as primary, RLS as safety net
- **Session-based tenant context** using PostgreSQL settings

## Implementation Steps

### Step 1: Database User Setup

First, create a dedicated application user (not superuser):

```sql
-- Run as superuser
CREATE USER reverb_app WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE reverb TO reverb_app;
GRANT USAGE ON SCHEMA public TO reverb_app;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO reverb_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO reverb_app;

-- Make sure future tables get permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO reverb_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT USAGE, SELECT ON SEQUENCES TO reverb_app;
```

Update your `.env`:
```
DB_CONNECTION=pg
DB_HOST=localhost
DB_PORT=5432
DB_USER=reverb_app
DB_PASSWORD=secure_password
DB_DATABASE=reverb

# Keep a superuser connection for migrations only
DB_MIGRATION_USER=postgres
DB_MIGRATION_PASSWORD=postgres_password
```

### Step 2: Add tenant_id to All Tables

Create a migration to add tenant_id to currently shared tables:

```typescript
// database/migrations/add_tenant_id_to_shared_tables.ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'multiple'

  public async up() {
    // Add tenant_id to patients table
    this.schema.alterTable('patients', (table) => {
      table.integer('tenant_id').unsigned().references('id').inTable('tenants').onDelete('CASCADE')
      table.index(['tenant_id', 'id'])
    })

    // Update patients with tenant_id from their patient_lists
    await this.db.rawQuery(`
      UPDATE patients p
      SET tenant_id = pl.tenant_id
      FROM patient_list_members plm
      JOIN patient_lists pl ON plm.patient_list_id = pl.id
      WHERE p.id = plm.patient_id
      AND p.tenant_id IS NULL
    `)

    // Make tenant_id NOT NULL after data migration
    await this.db.rawQuery('ALTER TABLE patients ALTER COLUMN tenant_id SET NOT NULL')

    // Add tenant_id to other shared tables as needed
    this.schema.alterTable('users', (table) => {
      table.integer('default_tenant_id').unsigned().references('id').inTable('tenants')
    })
  }

  public async down() {
    this.schema.alterTable('patients', (table) => {
      table.dropColumn('tenant_id')
    })
    
    this.schema.alterTable('users', (table) => {
      table.dropColumn('default_tenant_id')
    })
  }
}
```

### Step 3: Enable RLS on Tables

Create a migration to enable RLS:

```typescript
// database/migrations/enable_row_level_security.ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  public async up() {
    // List of tables that need RLS
    const tenantScopedTables = [
      'patients',
      'patient_lists',
      'roles',
      'patient_list_members',
      'patient_list_user_members'
    ]

    for (const table of tenantScopedTables) {
      // Enable RLS
      await this.db.rawQuery(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`)
      
      // Drop existing policy if exists
      await this.db.rawQuery(`DROP POLICY IF EXISTS tenant_isolation ON ${table}`)
      
      // Create policy for tenant isolation
      await this.db.rawQuery(`
        CREATE POLICY tenant_isolation ON ${table}
        FOR ALL
        USING (
          tenant_id = COALESCE(
            current_setting('app.current_tenant_id', true)::integer,
            -1 -- Impossible tenant_id to prevent accidental access
          )
        )
        WITH CHECK (
          tenant_id = COALESCE(
            current_setting('app.current_tenant_id', true)::integer,
            -1
          )
        )
      `)
      
      // Grant permissions to app user
      await this.db.rawQuery(`GRANT SELECT, INSERT, UPDATE, DELETE ON ${table} TO reverb_app`)
    }

    // Create a more permissive policy for users table (no tenant_id)
    await this.db.rawQuery(`ALTER TABLE users ENABLE ROW LEVEL SECURITY`)
    await this.db.rawQuery(`DROP POLICY IF EXISTS user_access ON users`)
    await this.db.rawQuery(`
      CREATE POLICY user_access ON users
      FOR ALL
      USING (true) -- Users can be accessed across tenants
    `)
    await this.db.rawQuery(`GRANT SELECT, INSERT, UPDATE, DELETE ON users TO reverb_app`)
  }

  public async down() {
    const tables = [
      'patients',
      'patient_lists', 
      'roles',
      'patient_list_members',
      'patient_list_user_members',
      'users'
    ]

    for (const table of tables) {
      await this.db.rawQuery(`ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY`)
      await this.db.rawQuery(`DROP POLICY IF EXISTS tenant_isolation ON ${table}`)
      await this.db.rawQuery(`DROP POLICY IF EXISTS user_access ON ${table}`)
    }
  }
}
```

### Step 4: Create Tenant Context Middleware

```typescript
// app/middleware/tenant_context_middleware.ts
import { HttpContext } from '@adonisjs/core/http'
import { NextFn } from '@adonisjs/core/types/http'
import Database from '@adonisjs/lucid/services/db'
import logger from '@adonisjs/core/services/logger'

export default class TenantContextMiddleware {
  async handle({ auth, request }: HttpContext, next: NextFn) {
    // Get tenant ID from various sources
    const tenantId = this.getTenantId(auth, request)
    
    if (tenantId) {
      // Set tenant context for this request
      try {
        // Store in async local storage for access throughout request
        HttpContext.get()!.tenantId = tenantId
        
        // Set PostgreSQL session variable for RLS
        // This will apply to all queries in this request
        await Database.rawQuery('SET LOCAL app.current_tenant_id = ?', [tenantId])
        
        logger.debug(`Set tenant context: ${tenantId}`)
      } catch (error) {
        logger.error('Failed to set tenant context', error)
        throw new Error('Failed to establish tenant context')
      }
    }

    await next()
  }

  private getTenantId(auth: HttpContext['auth'], request: HttpContext['request']): number | null {
    // Priority order for determining tenant:
    // 1. Explicit header (for API clients)
    const headerTenant = request.header('X-Tenant-ID')
    if (headerTenant) {
      return parseInt(headerTenant, 10)
    }

    // 2. User's current tenant
    if (auth.user?.currentTenantId) {
      return auth.user.currentTenantId
    }

    // 3. User's default tenant
    if (auth.user?.defaultTenantId) {
      return auth.user.defaultTenantId
    }

    return null
  }
}
```

### Step 5: Create Database Hook for Connection Management

```typescript
// providers/database_provider.ts
import { ApplicationService } from '@adonisjs/core/types'
import Database from '@adonisjs/lucid/services/db'
import { HttpContext } from '@adonisjs/core/http'

export default class DatabaseProvider {
  constructor(protected app: ApplicationService) {}

  async boot() {
    // Set tenant context on every new connection from the pool
    Database.connection().on('connect', async (connection) => {
      const ctx = HttpContext.get()
      const tenantId = ctx?.tenantId

      if (tenantId) {
        try {
          // Set the tenant ID for this database connection
          await connection.rawQuery(
            'SET app.current_tenant_id = ?',
            [tenantId]
          )
        } catch (error) {
          console.error('Failed to set tenant context on connection:', error)
        }
      }
    })
  }
}
```

### Step 6: Update Models for Tenant Awareness

Create a base model trait:

```typescript
// app/models/traits/tenant_scoped.ts
import { BaseModel } from '@adonisjs/lucid/orm'
import { HttpContext } from '@adonisjs/core/http'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'

export function TenantScoped<T extends typeof BaseModel>(Base: T) {
  return class extends Base {
    static boot() {
      if (this.booted) return
      super.boot()

      // Add global scope for tenant filtering (belt and suspenders with RLS)
      this.addGlobalScope('tenant', (query: ModelQueryBuilderContract<typeof BaseModel>) => {
        const ctx = HttpContext.get()
        const tenantId = ctx?.tenantId

        if (tenantId && this.$hasColumn('tenant_id')) {
          query.where('tenant_id', tenantId)
        }
      })

      // Automatically set tenant_id on create
      this.before('create', async (model) => {
        const ctx = HttpContext.get()
        const tenantId = ctx?.tenantId

        if (tenantId && this.$hasColumn('tenant_id') && !model.tenant_id) {
          model.tenant_id = tenantId
        }
      })
    }

    // Helper to check if model has a column
    static $hasColumn(columnName: string): boolean {
      return this.$columnsDefinitions.has(columnName)
    }
  }
}
```

Update your models:

```typescript
// app/models/patient.ts
import { BaseModel, column } from '@adonisjs/lucid/orm'
import { TenantScoped } from './traits/tenant_scoped.js'

export default class Patient extends TenantScoped(BaseModel) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare tenantId: number

  @column()
  declare name: string
  
  // ... other columns
}
```

### Step 7: Create Admin Bypass for Superusers

For admin operations that need to access all tenants:

```typescript
// app/services/admin_database_service.ts
import Database from '@adonisjs/lucid/services/db'

export default class AdminDatabaseService {
  /**
   * Execute a query with RLS bypassed (requires superuser connection)
   */
  async executeAsAdmin<T>(callback: () => Promise<T>): Promise<T> {
    // Temporarily disable RLS by not setting tenant context
    await Database.rawQuery('SET LOCAL app.current_tenant_id = NULL')
    
    try {
      return await callback()
    } finally {
      // Re-enable RLS by setting tenant context back
      const ctx = HttpContext.get()
      if (ctx?.tenantId) {
        await Database.rawQuery('SET LOCAL app.current_tenant_id = ?', [ctx.tenantId])
      }
    }
  }

  /**
   * Get data across all tenants (for admin dashboards)
   */
  async getAllTenantsData() {
    return this.executeAsAdmin(async () => {
      // This query will bypass RLS
      return Database.from('patients').select('*')
    })
  }
}
```

### Step 8: Testing RLS Implementation

Create tests to verify RLS is working:

```typescript
// tests/functional/rls_test.ts
import { test } from '@japa/runner'
import Database from '@adonisjs/lucid/services/db'

test.group('Row Level Security', () => {
  test('should only access tenant-specific data', async ({ assert }) => {
    // Create test data
    const tenant1 = await Database.table('tenants').insert({ name: 'Tenant 1' }).returning('id')
    const tenant2 = await Database.table('tenants').insert({ name: 'Tenant 2' }).returning('id')
    
    // Create patients for each tenant (as superuser during test setup)
    await Database.table('patients').insert([
      { name: 'Patient 1', tenant_id: tenant1[0].id },
      { name: 'Patient 2', tenant_id: tenant2[0].id }
    ])

    // Set tenant context to tenant 1
    await Database.rawQuery('SET LOCAL app.current_tenant_id = ?', [tenant1[0].id])
    
    // Query should only return tenant 1's patients
    const patients = await Database.from('patients').select('*')
    assert.lengthOf(patients, 1)
    assert.equal(patients[0].name, 'Patient 1')
    
    // Switch to tenant 2
    await Database.rawQuery('SET LOCAL app.current_tenant_id = ?', [tenant2[0].id])
    
    // Query should only return tenant 2's patients
    const patients2 = await Database.from('patients').select('*')
    assert.lengthOf(patients2, 1)
    assert.equal(patients2[0].name, 'Patient 2')
  })

  test('should prevent access without tenant context', async ({ assert }) => {
    // Clear tenant context
    await Database.rawQuery('SET LOCAL app.current_tenant_id = NULL')
    
    // Query should return no results (policy uses -1 as default)
    const patients = await Database.from('patients').select('*')
    assert.lengthOf(patients, 0)
  })
})
```

### Step 9: Migration Strategy for Existing Data

Since you need to run migrations as superuser but the app runs as a regular user:

```typescript
// config/database.ts
import env from '@adonisjs/env'

const databaseConfig = {
  connection: 'pg',
  connections: {
    pg: {
      client: 'pg',
      connection: {
        host: env.get('DB_HOST'),
        port: env.get('DB_PORT'),
        user: env.get('DB_USER'),
        password: env.get('DB_PASSWORD'),
        database: env.get('DB_DATABASE'),
      },
    },
    // Separate connection for migrations
    pg_migration: {
      client: 'pg',
      connection: {
        host: env.get('DB_HOST'),
        port: env.get('DB_PORT'),
        user: env.get('DB_MIGRATION_USER', 'postgres'),
        password: env.get('DB_MIGRATION_PASSWORD'),
        database: env.get('DB_DATABASE'),
      },
    },
  },
}

export default databaseConfig
```

Run migrations with the superuser connection:
```bash
node ace migration:run --connection=pg_migration
```

### Step 10: Monitoring and Debugging

Add logging to track RLS behavior:

```typescript
// app/middleware/rls_debug_middleware.ts
export default class RlsDebugMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    if (process.env.NODE_ENV === 'development') {
      // Log current tenant context
      const result = await Database.rawQuery('SHOW app.current_tenant_id')
      console.log('Current RLS tenant:', result.rows[0]?.current_tenant_id || 'NOT SET')
    }
    
    await next()
  }
}
```

## Important Considerations

### 1. Connection Pooling
PostgreSQL session variables are connection-specific. With connection pooling:
- Set tenant context on EVERY query execution
- Use `SET LOCAL` for transaction-scoped settings
- Monitor connection pool behavior

### 2. Background Jobs
For queued jobs, you must explicitly set tenant context:

```typescript
// app/jobs/tenant_scoped_job.ts
export default class TenantScopedJob {
  constructor(private tenantId: number) {}
  
  async handle() {
    // Set tenant context for this job
    await Database.rawQuery('SET LOCAL app.current_tenant_id = ?', [this.tenantId])
    
    // Now queries will be scoped to this tenant
    const patients = await Patient.all()
  }
}
```

### 3. Performance Impact
- RLS adds a small overhead to each query
- Create indexes on tenant_id for all tables
- Monitor query performance with EXPLAIN ANALYZE

### 4. Development vs Production
In development, you might want to disable RLS for easier debugging:

```typescript
// app/middleware/dev_rls_bypass.ts
export default class DevRlsBypassMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    if (process.env.NODE_ENV === 'development' && ctx.request.header('X-Bypass-RLS')) {
      // Disable RLS for this request
      await Database.rawQuery('SET LOCAL row_security = off')
    }
    await next()
  }
}
```

## Advantages of This Approach

1. **Database-enforced security**: Even if application code has bugs, RLS prevents data leaks
2. **Single database simplicity**: No complex sharding or routing logic
3. **Works with existing code**: Minimal changes to existing queries
4. **Scalable**: Can handle many tenants in one database
5. **Compatible with AdonisJS**: Works within framework limitations

## Limitations

1. **All tenants share resources**: One large tenant can impact others
2. **Backup/restore complexity**: Can't easily backup single tenant
3. **No physical isolation**: All data in same database
4. **Connection pool overhead**: Must set context per connection
5. **Superuser requirement**: Migrations need elevated privileges

## Conclusion

This implementation provides strong tenant isolation using PostgreSQL RLS with AdonisJS v6. While the framework doesn't have native RLS support, the approach above gives you:

- Database-level security as a safety net
- Application-level convenience with model traits  
- Flexibility to bypass RLS when needed for admin tasks
- Compatibility with AdonisJS patterns and conventions

The key is using RLS as defense-in-depth while keeping application-level scoping as the primary mechanism.