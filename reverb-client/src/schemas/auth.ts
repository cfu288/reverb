import { z } from 'zod';

// Tenant schema
export const TenantSchema = z.object({
  id: z.number(),
  displayName: z.string(),
  urlSafeName: z.string(),
  logoUrl: z.string().nullable().optional(),
  createdAt: z.string().optional(), // ISO date string
});

export type Tenant = z.infer<typeof TenantSchema>;

// Array of tenants
export const TenantsArraySchema = z.array(TenantSchema);