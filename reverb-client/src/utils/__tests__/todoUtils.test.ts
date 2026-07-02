import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isDueSoon,
  isOverdue,
  calculateNextDue,
  sortTodos,
  groupTodosByTag,
  filterTodosByStatus,
} from '../todoUtils';
import { Todo, DueTime } from '@/models/Todo';

describe('Todo Timing and Recurrence Logic', () => {
  const mockNow = new Date('2024-01-15T10:00:00Z');
  
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockNow);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('isDueSoon', () => {
    it('should return true for todo due within 24 hours', () => {
      const todo: Todo = {
        id: '1',
        text: 'Test todo',
        status: 'open',
        tags: [],
        dueTime: {
          type: 'once',
          dueDate: new Date('2024-01-16T08:00:00Z').toISOString(),
        },
        createdAt: mockNow.toISOString(),
        updatedAt: mockNow.toISOString(),
        createdBy: 'user1',
      };

      expect(isDueSoon(todo)).toBe(true);
    });

    it('should return false for todo due in more than 24 hours', () => {
      const todo: Todo = {
        id: '1',
        text: 'Test todo',
        status: 'open',
        tags: [],
        dueTime: {
          type: 'once',
          dueDate: new Date('2024-01-17T12:00:00Z').toISOString(),
        },
        createdAt: mockNow.toISOString(),
        updatedAt: mockNow.toISOString(),
        createdBy: 'user1',
      };

      expect(isDueSoon(todo)).toBe(false);
    });

    it('should return false for overdue todos', () => {
      const todo: Todo = {
        id: '1',
        text: 'Test todo',
        status: 'open',
        tags: [],
        dueTime: {
          type: 'once',
          dueDate: new Date('2024-01-14T08:00:00Z').toISOString(),
        },
        createdAt: mockNow.toISOString(),
        updatedAt: mockNow.toISOString(),
        createdBy: 'user1',
      };

      expect(isDueSoon(todo)).toBe(false);
    });

    it('should handle recurring todos with nextDue', () => {
      const todo: Todo = {
        id: '1',
        text: 'Test todo',
        status: 'open',
        tags: [],
        dueTime: {
          type: 'recurring_hours',
          intervalHours: 4,
          nextDue: new Date('2024-01-15T13:00:00Z').toISOString(),
        },
        createdAt: mockNow.toISOString(),
        updatedAt: mockNow.toISOString(),
        createdBy: 'user1',
      };

      expect(isDueSoon(todo)).toBe(true);
    });
  });

  describe('isOverdue', () => {
    it('should return true for past due date', () => {
      const todo: Todo = {
        id: '1',
        text: 'Test todo',
        status: 'open',
        tags: [],
        dueTime: {
          type: 'once',
          dueDate: new Date('2024-01-14T08:00:00Z').toISOString(),
        },
        createdAt: mockNow.toISOString(),
        updatedAt: mockNow.toISOString(),
        createdBy: 'user1',
      };

      expect(isOverdue(todo)).toBe(true);
    });

    it('should return false for future due date', () => {
      const todo: Todo = {
        id: '1',
        text: 'Test todo',
        status: 'open',
        tags: [],
        dueTime: {
          type: 'once',
          dueDate: new Date('2024-01-16T08:00:00Z').toISOString(),
        },
        createdAt: mockNow.toISOString(),
        updatedAt: mockNow.toISOString(),
        createdBy: 'user1',
      };

      expect(isOverdue(todo)).toBe(false);
    });

    it('should return false for completed todos', () => {
      const todo: Todo = {
        id: '1',
        text: 'Test todo',
        status: 'complete',
        tags: [],
        dueTime: {
          type: 'once',
          dueDate: new Date('2024-01-14T08:00:00Z').toISOString(),
        },
        createdAt: mockNow.toISOString(),
        updatedAt: mockNow.toISOString(),
        createdBy: 'user1',
      };

      expect(isOverdue(todo)).toBe(false);
    });
  });

  describe('calculateNextDue', () => {
    it('should calculate next due for recurring hours', () => {
      const todo: Todo = {
        id: '1',
        text: 'Test todo',
        status: 'open',
        tags: [],
        dueTime: {
          type: 'recurring_hours',
          intervalHours: 4,
        },
        createdAt: mockNow.toISOString(),
        updatedAt: mockNow.toISOString(),
        createdBy: 'user1',
      };

      const nextDue = calculateNextDue(todo);
      expect(nextDue).toBe(new Date('2024-01-15T14:00:00Z').toISOString());
    });

    it('should calculate next due for recurring days', () => {
      const todo: Todo = {
        id: '1',
        text: 'Test todo',
        status: 'open',
        tags: [],
        dueTime: {
          type: 'recurring_days',
          intervalDays: 3,
        },
        createdAt: mockNow.toISOString(),
        updatedAt: mockNow.toISOString(),
        createdBy: 'user1',
      };

      const nextDue = calculateNextDue(todo);
      expect(nextDue).toBe(new Date('2024-01-18T10:00:00Z').toISOString());
    });

    it('should return null for one-time todos', () => {
      const todo: Todo = {
        id: '1',
        text: 'Test todo',
        status: 'open',
        tags: [],
        dueTime: {
          type: 'once',
          dueDate: new Date('2024-01-16T08:00:00Z').toISOString(),
        },
        createdAt: mockNow.toISOString(),
        updatedAt: mockNow.toISOString(),
        createdBy: 'user1',
      };

      expect(calculateNextDue(todo)).toBeNull();
    });

    it('should return null for n_times when all occurrences completed', () => {
      const todo: Todo = {
        id: '1',
        text: 'Test todo',
        status: 'open',
        tags: [],
        dueTime: {
          type: 'n_times',
          occurrences: 3,
          completedOccurrences: 3,
        },
        createdAt: mockNow.toISOString(),
        updatedAt: mockNow.toISOString(),
        createdBy: 'user1',
      };

      expect(calculateNextDue(todo)).toBeNull();
    });
  });

  describe('sortTodos', () => {
    const todos: Todo[] = [
      {
        id: '1',
        text: 'B todo',
        status: 'complete',
        tags: [],
        dueTime: { type: 'once', dueDate: '2024-01-17T00:00:00Z' },
        createdAt: '2024-01-10T00:00:00Z',
        updatedAt: '2024-01-10T00:00:00Z',
        createdBy: 'user1',
      },
      {
        id: '2',
        text: 'A todo',
        status: 'open',
        tags: [],
        dueTime: { type: 'once', dueDate: '2024-01-16T00:00:00Z' },
        createdAt: '2024-01-11T00:00:00Z',
        updatedAt: '2024-01-11T00:00:00Z',
        createdBy: 'user1',
      },
      {
        id: '3',
        text: 'C todo',
        status: 'hidden',
        tags: [],
        createdAt: '2024-01-12T00:00:00Z',
        updatedAt: '2024-01-12T00:00:00Z',
        createdBy: 'user1',
      },
    ];

    it('should sort by due date', () => {
      const sorted = sortTodos(todos, 'dueDate');
      expect(sorted[0].id).toBe('2'); // earliest due date
      expect(sorted[1].id).toBe('1');
      expect(sorted[2].id).toBe('3'); // no due date
    });

    it('should sort by created date', () => {
      const sorted = sortTodos(todos, 'createdDate');
      expect(sorted[0].id).toBe('3'); // most recent
      expect(sorted[1].id).toBe('2');
      expect(sorted[2].id).toBe('1'); // oldest
    });

    it('should sort alphabetically', () => {
      const sorted = sortTodos(todos, 'alphabetical');
      expect(sorted[0].id).toBe('2'); // A todo
      expect(sorted[1].id).toBe('1'); // B todo
      expect(sorted[2].id).toBe('3'); // C todo
    });

    it('should sort by status', () => {
      const sorted = sortTodos(todos, 'status');
      expect(sorted[0].id).toBe('2'); // open
      expect(sorted[1].id).toBe('1'); // complete
      expect(sorted[2].id).toBe('3'); // hidden
    });
  });

  describe('groupTodosByTag', () => {
    const todos: Todo[] = [
      {
        id: '1',
        text: 'Todo 1',
        status: 'open',
        tags: ['Labs', 'Urgent'],
        createdAt: mockNow.toISOString(),
        updatedAt: mockNow.toISOString(),
        createdBy: 'user1',
      },
      {
        id: '2',
        text: 'Todo 2',
        status: 'open',
        tags: ['Labs'],
        createdAt: mockNow.toISOString(),
        updatedAt: mockNow.toISOString(),
        createdBy: 'user1',
      },
      {
        id: '3',
        text: 'Todo 3',
        status: 'open',
        tags: [],
        createdAt: mockNow.toISOString(),
        updatedAt: mockNow.toISOString(),
        createdBy: 'user1',
      },
    ];

    it('should group todos by tags', () => {
      const grouped = groupTodosByTag(todos);
      
      expect(grouped.has('labs')).toBe(true);
      expect(grouped.has('urgent')).toBe(true);
      expect(grouped.has('untagged')).toBe(true);
      
      expect(grouped.get('labs')?.length).toBe(2);
      expect(grouped.get('urgent')?.length).toBe(1);
      expect(grouped.get('untagged')?.length).toBe(1);
    });

    it('should handle empty todo list', () => {
      const grouped = groupTodosByTag([]);
      expect(grouped.size).toBe(0);
    });
  });
});