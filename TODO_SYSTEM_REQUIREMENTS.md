# Todo System Requirements Document

## Overview

This document outlines the requirements for implementing an enhanced todo system in the Reverb patient list application. The new system will support recurring tasks, due dates, tags, and better organization of patient care tasks.

## Business Requirements

### 1. Core Todo Features

- **Text Field**: Primary todo content (required)
- **Description**: Optional extended details about the task
- **Due Time**: Optional timing for when the task should be completed
- **Status**: Track task completion state
- **Tags**: Categorize and group related todos

### 2. Recurrence Patterns

Support flexible scheduling patterns for recurring medical tasks:
- **One-time**: Single occurrence (default)
- **N times**: Repeat a specific number of times
- **Every Y hours**: Hourly recurrence (e.g., "Check vitals every 4 hours")
- **Every Z days**: Daily recurrence (e.g., "Review labs every 3 days")

### 3. Status Management

Three distinct states:
- **Open**: Active task requiring attention
- **Complete**: Finished task (maintains history)
- **Hidden**: Archived or temporarily removed from view

### 4. Tag System

- Text-based tags for categorization
- Created on-the-fly during todo creation/editing
- Uniquely identified by text content
- Enable filtering and grouping of todos

## Technical Architecture

### Data Model

```typescript
interface Todo {
  id: string;
  patientId: string;
  text: string;
  description?: string;
  status: 'open' | 'complete' | 'hidden';
  tags: string[]; // Array of tag text values
  dueTime?: DueTime;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  createdBy: string; // User ID
  completedBy?: string; // User ID
}

interface DueTime {
  type: 'once' | 'n_times' | 'recurring_hours' | 'recurring_days';
  
  // For 'once'
  dueDate?: Date;
  
  // For 'n_times'
  startDate?: Date;
  occurrences?: number;
  completedOccurrences?: number;
  
  // For 'recurring_hours'
  intervalHours?: number;
  nextDue?: Date;
  
  // For 'recurring_days'
  intervalDays?: number;
  nextDue?: Date;
}

interface Tag {
  text: string;
  usageCount?: number; // Track popularity for suggestions
  lastUsed?: Date;
}
```

### CRDT Schema Updates

Update the patient schema to include the enhanced todo structure:

```typescript
const todoSchema = s.obj({
  id: s.str(),
  text: s.str(),
  description: s.str(''),
  status: s.str('open'), // 'open' | 'complete' | 'hidden'
  tags: s.arr(s.str()),
  dueTime: s.obj({
    type: s.str('once'),
    dueDate: s.str(''), // ISO date string
    startDate: s.str(''), // ISO date string
    occurrences: s.num(1),
    completedOccurrences: s.num(0),
    intervalHours: s.num(0),
    intervalDays: s.num(0),
    nextDue: s.str(''), // ISO date string
  }),
  createdAt: s.str(), // ISO date string
  updatedAt: s.str(), // ISO date string
  completedAt: s.str(''), // ISO date string
  createdBy: s.str(),
  completedBy: s.str(''),
});

const patientSchema = s.obj({
  // ... existing fields
  todos: s.arr(todoSchema),
  // ... rest of fields
});
```

### Recurrence Logic

#### Once (One-time)
- Simple due date
- No recurrence calculation needed
- Status changes to complete when marked done

#### N Times
- Track occurrences and completed occurrences
- When marked complete:
  - Increment `completedOccurrences`
  - If `completedOccurrences < occurrences`, create next occurrence
  - If `completedOccurrences >= occurrences`, mark as fully complete

#### Every Y Hours
- Calculate `nextDue` based on completion time
- When marked complete:
  - Update `nextDue = completionTime + intervalHours`
  - Create new todo instance or update existing

#### Every Z Days
- Calculate `nextDue` based on completion date
- When marked complete:
  - Update `nextDue = completionDate + intervalDays`
  - Create new todo instance or update existing

### Tag Management

#### Tag Creation
- Extract unique tags from all todos
- No separate tag storage needed (derived from todos)
- Case-insensitive matching for consistency

#### Tag Suggestions
- Track usage frequency across all todos
- Suggest most-used tags during todo creation
- Auto-complete functionality in UI

#### Tag Operations
```typescript
// Get all unique tags
function getAllTags(patients: Patient[]): string[] {
  const tagSet = new Set<string>();
  patients.forEach(patient => {
    patient.todos.forEach(todo => {
      todo.tags.forEach(tag => tagSet.add(tag.toLowerCase()));
    });
  });
  return Array.from(tagSet);
}

// Get todos by tag
function getTodosByTag(patients: Patient[], tag: string): Todo[] {
  const todos: Todo[] = [];
  patients.forEach(patient => {
    patient.todos
      .filter(todo => todo.tags.includes(tag.toLowerCase()))
      .forEach(todo => todos.push(todo));
  });
  return todos;
}
```

## UI Components

### 1. Todo Item Component

```typescript
interface TodoItemProps {
  todo: Todo;
  onToggleComplete: (todoId: string) => void;
  onEdit: (todo: Todo) => void;
  onHide: (todoId: string) => void;
}
```

Features:
- Display text with optional description
- Show due date/time with visual indicators
- Tag pills with click-to-filter
- Complete/uncomplete toggle
- Edit and hide actions

### 2. Todo Editor Component

```typescript
interface TodoEditorProps {
  todo?: Todo; // Optional for create vs edit
  onSave: (todo: Todo) => void;
  onCancel: () => void;
  existingTags: string[]; // For suggestions
}
```

Features:
- Text input (required)
- Description textarea (optional)
- Due time configuration
  - Type selector (once/n times/hours/days)
  - Date/time picker for one-time
  - Numeric inputs for intervals
- Tag input with auto-complete
- Save/cancel actions

### 3. Todo List Component

```typescript
interface TodoListProps {
  todos: Todo[];
  filters: {
    status?: ('open' | 'complete' | 'hidden')[];
    tags?: string[];
    dueSoon?: boolean;
  };
  onFilterChange: (filters: Filters) => void;
}
```

Features:
- Grouped display by status
- Tag filter pills
- Due soon indicator
- Sort options (due date, created date, alphabetical)
- Bulk actions (complete all, hide completed)

## Implementation Considerations

### 1. Performance

- Index todos by patient ID for fast lookups
- Lazy load completed/hidden todos
- Virtualize long todo lists
- Cache tag calculations

### 2. Real-time Sync

- Todos sync via existing CRDT infrastructure
- Conflict resolution: last-write-wins for status changes
- Preserve todo history for audit trail

### 3. Medical Context

- Pre-defined medical tag suggestions:
  - "Labs", "Vitals", "Medications", "Procedures"
  - "Follow-up", "Consult", "Discharge"
- Quick actions for common medical todos
- Integration with order sets

### 4. Future Enhancements

- Todo templates for common tasks
- Notifications for overdue items
- Assignment to specific team members
- Priority levels (urgent/routine)
- Integration with hospital systems
- Audit log for compliance

## Success Criteria

1. Users can create todos with flexible recurrence patterns
2. Tags enable efficient organization and filtering
3. No performance degradation with 100+ todos per patient
4. Seamless real-time sync across all clients
5. Intuitive UI that doesn't disrupt clinical workflow

## Migration Strategy

Since todos are already part of the patient schema:
1. Update CRDT schema with backward compatibility
2. Migrate existing todos to new structure
3. Default existing todos to 'once' type with 'open' status
4. Preserve existing todo text and completed state

## Security Considerations

1. Todos contain PHI - ensure proper encryption
2. Audit trail for all todo modifications
3. Role-based access (who can complete vs create)
4. No todos visible after patient discharge (configurable)

## Example Use Cases

### 1. Medication Administration
- Todo: "Administer Vancomycin"
- Recurrence: Every 12 hours
- Tags: ["Medications", "Antibiotics"]
- Auto-creates next dose after completion

### 2. Lab Follow-up
- Todo: "Check morning CBC results"
- Recurrence: Once, due at 6 AM
- Tags: ["Labs", "AM-Tasks"]
- One-time task

### 3. Vital Signs Monitoring
- Todo: "Record vitals"
- Recurrence: Every 4 hours
- Tags: ["Vitals", "Nursing"]
- Continuous monitoring task

### 4. Discharge Planning
- Todo: "Complete discharge summary"
- Description: "Include follow-up appointments and medication reconciliation"
- Recurrence: Once
- Tags: ["Discharge", "Documentation"]
- Complex task with details

This enhanced todo system will significantly improve task management in the clinical setting while maintaining the simplicity and real-time collaboration that Reverb users expect.