import { Todo } from '@/models/Todo';
import { Patient } from '@/models/Patient';

// Get all unique tags from todos
export function getAllTags(patients: Patient[]): string[] {
  const tagSet = new Set<string>();
  patients.forEach((patient) => {
    patient.todos?.forEach((todo) => {
      todo.tags?.forEach((tag) => tagSet.add(tag.toLowerCase()));
    });
  });
  return Array.from(tagSet).sort();
}

// Get todos by tag
export function getTodosByTag(patients: Patient[], tag: string): Todo[] {
  const todos: Todo[] = [];
  patients.forEach((patient) => {
    patient.todos
      ?.filter((todo) => todo.tags?.includes(tag.toLowerCase()))
      .forEach((todo) => todos.push(todo));
  });
  return todos;
}

// Calculate tag usage frequency
export function getTagFrequency(patients: Patient[]): Map<string, number> {
  const tagFrequency = new Map<string, number>();
  patients.forEach((patient) => {
    patient.todos?.forEach((todo) => {
      todo.tags?.forEach((tag) => {
        const lowerTag = tag.toLowerCase();
        tagFrequency.set(lowerTag, (tagFrequency.get(lowerTag) || 0) + 1);
      });
    });
  });
  return tagFrequency;
}

// Get most used tags for suggestions
export function getPopularTags(patients: Patient[], limit = 10): string[] {
  const frequency = getTagFrequency(patients);
  return Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag);
}

// Filter todos by status
export function filterTodosByStatus(todos: Todo[], statuses: ('open' | 'complete' | 'hidden')[]): Todo[] {
  if (!statuses.length) return todos;
  return todos.filter(todo => statuses.includes(todo.status));
}

// Check if todo is due soon (within 24 hours)
export function isDueSoon(todo: Todo): boolean {
  if (!todo.dueTime) return false;
  
  let dueDate: string | undefined;
  
  switch (todo.dueTime.type) {
    case 'once':
      dueDate = todo.dueTime.dueDate;
      break;
    case 'recurring_hours':
    case 'recurring_days':
      dueDate = todo.dueTime.nextDue || todo.dueTime.dueDate;
      break;
    case 'n_times':
      dueDate = todo.dueTime.startDate;
      break;
  }
  
  if (!dueDate) return false;
  
  const due = new Date(dueDate);
  const now = new Date();
  const hoursDiff = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  return hoursDiff >= 0 && hoursDiff <= 24;
}

// Check if todo is overdue
export function isOverdue(todo: Todo): boolean {
  if (!todo.dueTime || todo.status !== 'open') return false;
  
  let dueDate: string | undefined;
  
  switch (todo.dueTime.type) {
    case 'once':
      dueDate = todo.dueTime.dueDate;
      break;
    case 'recurring_hours':
    case 'recurring_days':
      dueDate = todo.dueTime.nextDue || todo.dueTime.dueDate;
      break;
    case 'n_times':
      dueDate = todo.dueTime.startDate;
      break;
  }
  
  if (!dueDate) return false;
  
  return new Date(dueDate) < new Date();
}

// Calculate next due date when marking a recurring todo as complete
export function calculateNextDue(todo: Todo): string | null {
  if (!todo.dueTime) return null;
  
  const now = new Date();
  
  switch (todo.dueTime.type) {
    case 'recurring_hours':
      if (todo.dueTime.intervalHours) {
        const nextDue = new Date(now.getTime() + todo.dueTime.intervalHours * 60 * 60 * 1000);
        return nextDue.toISOString();
      }
      break;
      
    case 'recurring_days':
      if (todo.dueTime.intervalDays) {
        const nextDue = new Date(now.getTime() + todo.dueTime.intervalDays * 24 * 60 * 60 * 1000);
        return nextDue.toISOString();
      }
      break;
      
    case 'n_times':
      if ((todo.dueTime.completedOccurrences || 0) < (todo.dueTime.occurrences || 1)) {
        // For n_times, we might want to use the same interval logic
        // This would need to be defined based on business requirements
        return null;
      }
      break;
  }
  
  return null;
}

// Group todos by tag
export function groupTodosByTag(todos: Todo[]): Map<string, Todo[]> {
  const grouped = new Map<string, Todo[]>();
  
  // Add todos with tags
  todos.forEach(todo => {
    if (todo.tags && todo.tags.length > 0) {
      todo.tags.forEach(tag => {
        const lowerTag = tag.toLowerCase();
        if (!grouped.has(lowerTag)) {
          grouped.set(lowerTag, []);
        }
        grouped.get(lowerTag)!.push(todo);
      });
    }
  });
  
  // Add todos without tags to "untagged" group
  const untaggedTodos = todos.filter(todo => !todo.tags || todo.tags.length === 0);
  if (untaggedTodos.length > 0) {
    grouped.set('untagged', untaggedTodos);
  }
  
  return grouped;
}

// Sort todos by various criteria
export type TodoSortCriteria = 'dueDate' | 'createdDate' | 'alphabetical' | 'status';

export function sortTodos(todos: Todo[], criteria: TodoSortCriteria): Todo[] {
  const sorted = [...todos];
  
  switch (criteria) {
    case 'dueDate':
      return sorted.sort((a, b) => {
        const aDue = getDueDate(a);
        const bDue = getDueDate(b);
        if (!aDue && !bDue) return 0;
        if (!aDue) return 1;
        if (!bDue) return -1;
        return new Date(aDue).getTime() - new Date(bDue).getTime();
      });
      
    case 'createdDate':
      return sorted.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
    case 'alphabetical':
      return sorted.sort((a, b) => a.text.localeCompare(b.text));
      
    case 'status': {
      const statusOrder = { 'open': 0, 'complete': 1, 'hidden': 2 };
      return sorted.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
    }
      
    default:
      return sorted;
  }
}

function getDueDate(todo: Todo): string | null {
  if (!todo.dueTime) return null;
  
  switch (todo.dueTime.type) {
    case 'once':
      return todo.dueTime.dueDate || null;
    case 'recurring_hours':
    case 'recurring_days':
      return todo.dueTime.nextDue || null;
    case 'n_times':
      return todo.dueTime.nextDue || todo.dueTime.startDate || null;
    default:
      return null;
  }
}

// Pre-defined medical tags
export const MEDICAL_TAGS = [
  'Labs',
  'Vitals', 
  'Medications',
  'Procedures',
  'Follow-up',
  'Consult',
  'Discharge',
  'AM-Tasks',
  'PM-Tasks',
  'Nursing',
  'Documentation',
  'Antibiotics'
];