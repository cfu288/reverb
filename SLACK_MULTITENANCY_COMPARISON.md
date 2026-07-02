# Reverb vs Slack Multi-Tenancy Architecture Comparison

## Current Reverb Multi-Tenancy Implementation

### Architecture Overview
- **Type**: Single database with application-level row isolation
- **Database**: PostgreSQL (single instance)
- **Isolation Method**: `tenant_id` foreign key on tenant-scoped tables
- **Sharding**: None - all data in one database
- **Query Routing**: Direct database connections from AdonisJS

### Data Model
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Tenants   │────<│ PatientLists │────<│  Patients   │
└─────────────┘     └──────────────┘     └─────────────┘
       │                    │
       │                    └── tenant_id (FK)
       │
       └────<│    Roles    │
             └─────────────┘
                    │
                    └── tenant_id (FK)
```

### Key Characteristics
1. **Tenant Isolation**: Application-level via ORM queries
2. **Shared Tables**: Users, Patients, Permissions
3. **Tenant-Scoped Tables**: PatientLists, Roles
4. **Query Pattern**: Every query must include `.where('tenantId', tenant.id)`
5. **No Database-Level Isolation**: No RLS, schemas, or partitioning

## Slack's Multi-Tenancy Architecture

### Architecture Overview
- **Type**: Shared database with row-level isolation + horizontal sharding
- **Database**: MySQL with Vitess clustering
- **Isolation Method**: `workspace_id` on all workspace-scoped tables
- **Sharding**: Initially by workspace_id, evolved to fine-grained sharding
- **Query Routing**: Through Vitess VtGate proxy

### Evolution of Slack's Architecture

#### Phase 1: Simple Workspace Sharding
```
┌────────────┐     ┌────────────┐     ┌────────────┐
│ Workspace  │     │ Workspace  │     │ Workspace  │
│ Shard 1    │     │ Shard 2    │     │ Shard 3    │
└────────────┘     └────────────┘     └────────────┘
```

#### Phase 2: Vitess-Based Fine-Grained Sharding
```
┌─────────────┐
│   VtGate    │ ← Application connects here
└─────────────┘
       │
┌──────┴──────┬──────────┬──────────┐
│             │          │          │
▼             ▼          ▼          ▼
User Shards   Channel    Message    Workspace
(by user_id)  Shards     Shards     Shards
              (by ch_id) (by msg_id) (by ws_id)
```

### Key Characteristics
1. **Flexible Sharding**: Different tables sharded by different keys
2. **Transparent to Application**: PHP code queries as if single database
3. **Dynamic Tenant Movement**: Can move hot workspaces to different shards
4. **Row-Level Security**: Database-enforced isolation policies
5. **Scale**: 2.3M QPS, 2ms median latency

## Technical Comparison

### 1. Database Technology
| Aspect | Reverb | Slack |
|--------|---------|--------|
| Database | PostgreSQL | MySQL + Vitess |
| Clustering | None | Vitess provides clustering |
| Connection | Direct | Through VtGate proxy |
| Protocol | PostgreSQL | MySQL protocol |

### 2. Sharding Strategy
| Aspect | Reverb | Slack |
|--------|---------|--------|
| Initial Sharding | None | By workspace_id |
| Current Sharding | None | Table-specific (user_id, channel_id, etc.) |
| Shard Assignment | N/A | Dynamic based on load |
| Rebalancing | N/A | Vitess handles automatically |

### 3. Query Isolation
| Aspect | Reverb | Slack |
|--------|---------|--------|
| Isolation Level | Application (ORM) | Database (RLS) + Application |
| Query Modification | Manual WHERE clauses | Automatic via VtGate |
| Risk of Leaks | High (developer error) | Low (database enforced) |

### 4. Performance at Scale
| Aspect | Reverb | Slack |
|--------|---------|--------|
| Bottleneck | Single DB instance | Distributed across shards |
| Large Tenant Impact | Affects all tenants | Isolated to shard |
| Query Distribution | All on one server | Distributed by shard key |

## Implementation Steps for Slack-Like Architecture in Reverb

### Prerequisites
- PostgreSQL doesn't have native equivalent to Vitess
- Would need to implement custom sharding solution or use tools like Citus

### Option 1: PostgreSQL-Native Approach with Citus

#### Step 1: Install and Configure Citus Extension
```sql
-- Install Citus extension
CREATE EXTENSION citus;

-- Configure coordinator node
SELECT citus_set_coordinator_host('coordinator.reverb.local', 5432);
```

#### Step 2: Modify Schema for Distributed Tables
```sql
-- Add tenant_id to all tables (including currently shared ones)
ALTER TABLE patients ADD COLUMN tenant_id INTEGER REFERENCES tenants(id);
ALTER TABLE users ADD COLUMN primary_tenant_id INTEGER REFERENCES tenants(id);

-- Create distributed tables
SELECT create_distributed_table('patient_lists', 'tenant_id');
SELECT create_distributed_table('patients', 'tenant_id');
SELECT create_distributed_table('roles', 'tenant_id');

-- Create reference tables for shared data
SELECT create_reference_table('permissions');
SELECT create_reference_table('tenants');
```

#### Step 3: Implement Query Routing in AdonisJS
```typescript
// Custom database manager that adds tenant context
class TenantAwareDatabase {
  constructor(private tenantId: number) {}
  
  query() {
    // Automatically inject tenant_id into queries
    return Database.query().where('tenant_id', this.tenantId);
  }
}

// Middleware to set tenant context
class TenantContext {
  async handle({ request, auth }: HttpContext, next: NextFn) {
    const tenantId = request.header('X-Tenant-ID') || auth.user?.currentTenantId;
    // Set PostgreSQL session variable for Row Level Security
    await Database.rawQuery('SET app.current_tenant = ?', [tenantId]);
    await next();
  }
}
```

#### Step 4: Implement Row Level Security
```sql
-- Enable RLS on tables
ALTER TABLE patient_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY tenant_isolation ON patient_lists
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::INTEGER);

CREATE POLICY tenant_isolation ON patients
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::INTEGER);
```

### Option 2: Application-Level Sharding with Multiple Databases

#### Step 1: Configure Multiple Database Connections
```typescript
// config/database.ts
export default {
  connections: {
    shard1: {
      client: 'pg',
      connection: { host: 'shard1.reverb.local', database: 'reverb_shard1' }
    },
    shard2: {
      client: 'pg',
      connection: { host: 'shard2.reverb.local', database: 'reverb_shard2' }
    },
    // ... more shards
  }
}
```

#### Step 2: Implement Shard Router
```typescript
class ShardRouter {
  private shardMap = new Map<number, string>();
  
  getShardForTenant(tenantId: number): string {
    // Simple modulo sharding (can be replaced with consistent hashing)
    const shardIndex = tenantId % TOTAL_SHARDS;
    return `shard${shardIndex + 1}`;
  }
  
  async moveTenant(tenantId: number, fromShard: string, toShard: string) {
    // Implementation for moving tenant data between shards
  }
}
```

#### Step 3: Modify Models for Shard Awareness
```typescript
class ShardAwareModel extends BaseModel {
  static boot() {
    super.boot();
    
    this.before('find', async (query) => {
      const tenantId = await this.getCurrentTenantId();
      const shard = shardRouter.getShardForTenant(tenantId);
      query.useConnection(shard);
    });
  }
}
```

### Option 3: Hybrid Approach - Start Simple, Scale Later

#### Phase 1: Implement Stronger Isolation (Immediate)
1. Add PostgreSQL Row Level Security
2. Create database roles per tenant
3. Use session variables for tenant context

#### Phase 2: Prepare for Sharding (Short-term)
1. Add tenant_id to all tables
2. Update all queries to be tenant-aware
3. Implement connection routing logic

#### Phase 3: Horizontal Scaling (When needed)
1. Deploy Citus or similar solution
2. Migrate to distributed tables
3. Implement shard rebalancing

## Technical Challenges and Solutions

### 1. Cross-Tenant Queries
**Challenge**: Queries that need data from multiple tenants (e.g., admin dashboards)
**Solution**: 
- Implement a separate "global" connection that bypasses sharding
- Use materialized views for cross-tenant analytics
- Implement federated queries across shards

### 2. Unique Constraints
**Challenge**: Ensuring uniqueness across shards (e.g., email addresses)
**Solution**:
- Use distributed sequences or UUIDs
- Implement application-level uniqueness checks
- Use a separate "global" table for unique values

### 3. Transactions Across Shards
**Challenge**: ACID transactions don't work across database instances
**Solution**:
- Design to avoid cross-shard transactions
- Implement saga pattern for distributed transactions
- Use eventual consistency where appropriate

### 4. Data Migration Between Shards
**Challenge**: Moving tenant data when rebalancing
**Solution**:
```typescript
class TenantMigrator {
  async migrateTenant(tenantId: number, targetShard: string) {
    // 1. Start dual-writing to both shards
    await this.enableDualWrite(tenantId, targetShard);
    
    // 2. Copy historical data
    await this.copyTenantData(tenantId, targetShard);
    
    // 3. Verify data consistency
    await this.verifyDataIntegrity(tenantId, targetShard);
    
    // 4. Switch reads to new shard
    await this.switchReads(tenantId, targetShard);
    
    // 5. Stop writes to old shard
    await this.disableOldShardWrites(tenantId);
  }
}
```

### 5. Query Routing Complexity
**Challenge**: Application needs to know which shard to query
**Solution**:
- Implement a routing layer similar to Vitess VtGate
- Cache shard assignments in Redis
- Use consistent hashing for predictable shard assignment

## Performance Optimization Strategies

### 1. Connection Pooling
```typescript
// Implement per-shard connection pools
class ShardConnectionPool {
  private pools = new Map<string, Pool>();
  
  getConnection(shard: string): Promise<PoolClient> {
    if (!this.pools.has(shard)) {
      this.pools.set(shard, new Pool({
        host: `${shard}.reverb.local`,
        max: 20, // connections per shard
        idleTimeoutMillis: 30000
      }));
    }
    return this.pools.get(shard)!.connect();
  }
}
```

### 2. Query Result Caching
```typescript
// Cache frequently accessed tenant data
class TenantCache {
  async get(tenantId: number, key: string) {
    const cacheKey = `tenant:${tenantId}:${key}`;
    return redis.get(cacheKey);
  }
  
  async set(tenantId: number, key: string, value: any, ttl = 3600) {
    const cacheKey = `tenant:${tenantId}:${key}`;
    return redis.setex(cacheKey, ttl, JSON.stringify(value));
  }
}
```

### 3. Read Replicas
- Configure read replicas per shard
- Route read queries to replicas
- Use primary only for writes

## AdonisJS-Specific Implementation Considerations

### 1. Custom Database Provider
```typescript
// providers/TenantAwareDatabaseProvider.ts
export default class TenantAwareDatabaseProvider {
  public async boot() {
    const Database = this.app.container.use('Adonis/Lucid/Database');
    
    Database.macro('tenant', function(tenantId: number) {
      const shard = shardRouter.getShardForTenant(tenantId);
      return this.connection(shard);
    });
  }
}
```

### 2. Model Traits for Tenant Awareness
```typescript
// app/models/traits/TenantScoped.ts
export function TenantScoped(BaseModel: typeof Model) {
  return class extends BaseModel {
    @beforeFind()
    static async scopeToTenant(query: ModelQueryBuilder) {
      const tenantId = HttpContext.get()?.tenant?.id;
      if (tenantId) {
        query.where('tenant_id', tenantId);
      }
    }
  };
}
```

### 3. Migration Strategy for Sharded Environment
```typescript
// commands/MigrateShards.ts
export default class MigrateShards extends BaseCommand {
  public async run() {
    const shards = await this.getShardList();
    
    for (const shard of shards) {
      this.logger.info(`Migrating shard: ${shard}`);
      await this.kernel.exec('migration:run', [`--connection=${shard}`]);
    }
  }
}
```

## Recommended Implementation Path

### Immediate (No Infrastructure Changes)
1. Implement PostgreSQL Row Level Security
2. Add tenant context to all queries via middleware
3. Create composite indexes on (tenant_id, primary_key)
4. Implement query result caching per tenant

### Short-term (Minimal Infrastructure)
1. Set up read replicas for scaling reads
2. Implement connection pooling per tenant size
3. Add monitoring for per-tenant resource usage
4. Create tenant data archiving strategy

### Long-term (Full Sharding)
1. Evaluate Citus vs custom sharding solution
2. Implement gradual migration strategy
3. Build tooling for shard management
4. Create automated rebalancing system

## Conclusion

While Reverb's current architecture is simpler than Slack's, implementing Slack-like sharding with PostgreSQL and AdonisJS is achievable through:

1. **Citus Extension**: Easiest path for PostgreSQL-based sharding
2. **Application-Level Sharding**: More control but more complexity
3. **Hybrid Approach**: Start with better isolation, scale to sharding when needed

The key is to prepare the application architecture now (tenant_id on all tables, tenant-aware queries) so that sharding can be implemented later without major code changes.