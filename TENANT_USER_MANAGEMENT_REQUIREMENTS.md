# Tenant User Management Feature Requirements

## Executive Summary

This document outlines the requirements for a new tenant administration feature that allows tenant administrators to add existing users to their tenant organization. The feature will be accessible only to users with tenant admin privileges and will provide a simple interface for user invitation/addition.

## User Stories

### Primary User Story
**As a** tenant administrator  
**I want to** add existing users to my tenant by their username or email  
**So that** I can grant them access to our organization's patient lists and resources

### Secondary User Stories
1. **As a** tenant administrator, **I want to** see clear feedback when adding users **so that** I know if the operation succeeded or why it failed
2. **As a** tenant administrator, **I want to** be prevented from adding users who are already members **so that** I don't create duplicate memberships
3. **As a** regular user, **I should not** see or access the user management page **so that** tenant security is maintained

## Functional Requirements

### 1. Access Control
- **FR-1.1**: Only users with tenant admin role can access the user management page
- **FR-1.2**: The page should return 403 Forbidden for non-admin users
- **FR-1.3**: The navigation menu should only show the "Manage Users" option for tenant admins

### 2. User Interface
- **FR-2.1**: Create a new page at route `/tenant/users` or `/admin/users`
- **FR-2.2**: Page should display current tenant name prominently
- **FR-2.3**: Include a single text input field that accepts either:
  - Username (e.g., "johndoe")
  - Email address (e.g., "john.doe@example.com")
- **FR-2.4**: Include an "Add User" button to submit the form
- **FR-2.5**: Display a list of current tenant members below the form (optional for MVP)

### 3. User Addition Logic
- **FR-3.1**: System must search for users by both username AND email with the provided input
- **FR-3.2**: Search should be case-insensitive
- **FR-3.3**: Only existing users in the system can be added (no invitation system)
- **FR-3.4**: System should prevent adding users who are already tenant members
- **FR-3.5**: System should validate that the target user exists before attempting to add

### 4. Feedback and Validation
- **FR-4.1**: Success message: "Successfully added [username] to [tenant name]"
- **FR-4.2**: Error messages should be specific:
  - "User not found"
  - "User is already a member of this tenant"
  - "You don't have permission to add users"
  - "Please enter a username or email address"
- **FR-4.3**: Form should clear on successful addition
- **FR-4.4**: Loading state while operation is in progress

### 5. Role Assignment
- **FR-5.1**: Newly added users should receive the default "User" role for the tenant
- **FR-5.2**: Tenant admins cannot assign admin role during addition (separate feature)

## Technical Requirements

### 1. Backend API Endpoints

#### 1.1 Add User to Tenant
```
POST /api/tenants/:tenantId/users
```

**Request Body:**
```json
{
  "identifier": "johndoe" // or "john.doe@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 123,
      "username": "johndoe",
      "email": "john.doe@example.com",
      "fullName": "John Doe"
    },
    "role": {
      "id": 456,
      "name": "User",
      "displayName": "User"
    }
  },
  "message": "Successfully added user to tenant"
}
```

**Error Responses:**
- 404: User not found
- 409: User already exists in tenant
- 403: Insufficient permissions
- 400: Invalid request format

#### 1.2 List Tenant Users (Optional for MVP)
```
GET /api/tenants/:tenantId/users
```

### 2. Frontend Components

#### 2.1 Page Component Structure
```
/tenant/users
├── TenantUserManagement.tsx (main page)
├── AddUserForm.tsx (form component)
└── TenantMembersList.tsx (optional list component)
```

#### 2.2 State Management
- Use React Query for API calls
- Local state for form inputs and loading states
- Show toast notifications for success/error feedback

### 3. Database Queries

#### 3.1 Find User by Identifier
```typescript
const user = await User.query()
  .where((query) => {
    query
      .where('username', identifier.toLowerCase())
      .orWhere('email', identifier.toLowerCase())
  })
  .first()
```

#### 3.2 Check Existing Membership
```typescript
const existingMembership = await user
  .related('tenants')
  .query()
  .where('tenant_id', tenantId)
  .first()
```

#### 3.3 Add User to Tenant
```typescript
// Add user with default role
await user.related('tenants').attach({
  [tenantId]: {
    role_id: defaultRoleId
  }
})
```

### 4. Authorization

#### 4.1 Backend Policy
```typescript
// TenantPolicy
async manageUsers(user: User, tenant: Tenant) {
  const membership = await user
    .related('roles')
    .query()
    .where('tenant_id', tenant.id)
    .preload('permissions')
    .first()
    
  return membership?.permissions.some(p => 
    p.name === 'Tenant.ManageUsers' || 
    p.name === 'Tenant.Admin'
  )
}
```

#### 4.2 Frontend Route Protection
- Check user permissions before rendering the page
- Redirect to 403 page if unauthorized

## UI/UX Specifications

### 1. Page Layout
```
┌─────────────────────────────────────────┐
│          Manage Tenant Users            │
│         [Tenant: Acme Hospital]         │
├─────────────────────────────────────────┤
│                                         │
│  Add User to Tenant                     │
│  ┌─────────────────────────────────┐   │
│  │ Username or Email               │   │
│  └─────────────────────────────────┘   │
│         [Add User Button]               │
│                                         │
│  ✓ Successfully added johndoe          │
│                                         │
├─────────────────────────────────────────┤
│  Current Members (optional)             │
│  • John Doe (johndoe) - User           │
│  • Jane Smith (jsmith) - Admin         │
│  • Bob Wilson (bwilson) - User         │
└─────────────────────────────────────────┘
```

### 2. Interaction Flow
1. Admin navigates to "Manage Users" from menu
2. Page loads showing current tenant name
3. Admin types username or email
4. Admin clicks "Add User"
5. System shows loading state
6. On success: Shows success message, clears form
7. On error: Shows specific error message

### 3. Responsive Design
- Mobile-friendly layout
- Form should be centered on larger screens
- Member list should be scrollable if many users

## Security Considerations

### 1. Input Validation
- **SC-1.1**: Sanitize input to prevent SQL injection
- **SC-1.2**: Validate email format if @ symbol is present
- **SC-1.3**: Limit input length (max 255 characters)

### 2. Rate Limiting
- **SC-2.1**: Limit user additions to 10 per minute per tenant
- **SC-2.2**: Implement CSRF protection on the form

### 3. Audit Trail
- **SC-3.1**: Log all user addition attempts with timestamp, admin user, and result
- **SC-3.2**: Store in audit log table for compliance

## Testing Requirements

### 1. Unit Tests
- User search logic
- Duplicate membership detection
- Permission checking

### 2. Integration Tests
- API endpoint with various inputs
- Database transaction handling
- Error scenarios

### 3. E2E Tests
- Complete flow from login to user addition
- Permission denial for non-admins
- Form validation and feedback

## Implementation Phases

### Phase 1: MVP (Required)
- Basic add user form
- Backend API endpoint
- Permission checking
- Success/error feedback

### Phase 2: Enhancements (Optional)
- List current tenant members
- Remove user functionality
- Bulk user addition
- Role selection during addition

## Dependencies

### Existing Systems
- User authentication system
- Tenant/Role/Permission models
- Current authorization framework (Bouncer)

### New Requirements
- No new packages required
- Uses existing React Query setup
- Uses existing form patterns

## Acceptance Criteria

1. **AC-1**: Tenant admin can successfully add an existing user by username
2. **AC-2**: Tenant admin can successfully add an existing user by email
3. **AC-3**: System prevents adding non-existent users
4. **AC-4**: System prevents adding duplicate members
5. **AC-5**: Non-admin users cannot access the page
6. **AC-6**: Clear feedback is provided for all actions
7. **AC-7**: Added users can immediately access tenant resources

## Future Considerations

1. **User Removal**: Allow admins to remove users from tenant
2. **Role Management**: Allow changing user roles after addition
3. **Invitation System**: Send email invites to non-existing users
4. **Bulk Operations**: Add multiple users via CSV upload
5. **User Search**: Type-ahead search for finding users
6. **Activity Log**: Show history of user additions/removals