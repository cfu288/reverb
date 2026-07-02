import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Model } from 'json-joy/lib/json-crdt/model';
import { CRDTHelpers } from '../crdtHelpers';
import { patientListSchema } from '@/schemas/patientListCrdt';

describe('CRDT Todo Operations', () => {
  let model: Model<any>;
  let api: any;

  beforeEach(() => {
    model = Model.create();
    model.api.root(patientListSchema);
    api = model.api;
    
    // Add a test patient
    CRDTHelpers.addPatient(api, {
      id: 'patient-1',
      mrn: '12345',
      dob: '1990-01-01',
      first_name: 'John',
      last_name: 'Doe',
      location: 'Room 101',
    });
  });

  describe('addTodo', () => {
    it('should add a todo with all required fields', () => {
      const todoId = CRDTHelpers.addTodo(api, 0, {
        text: 'Check labs',
        description: 'Review morning CBC results',
        status: 'open',
        tags: ['Labs', 'AM-Tasks'],
        dueTime: {
          type: 'once',
          dueDate: '2024-01-16T06:00:00Z',
        },
        createdBy: 'user-123',
      });

      const view = model.view();
      const patient = view.patients[0];
      const todo = patient.todos[0];

      expect(todo.id).toBe(todoId);
      expect(todo.text).toBe('Check labs');
      expect(todo.description).toBe('Review morning CBC results');
      expect(todo.status).toBe('open');
      expect(todo.tags).toEqual(['Labs', 'AM-Tasks']);
      expect(todo.dueTime.type).toBe('once');
      expect(todo.createdBy).toBe('user-123');
    });

    it('should add todo with minimal fields', () => {
      const todoId = CRDTHelpers.addTodo(api, 0, {
        text: 'Simple todo',
        createdBy: 'user-123',
      });

      const view = model.view();
      const todo = view.patients[0].todos[0];

      expect(todo.id).toBe(todoId);
      expect(todo.text).toBe('Simple todo');
      expect(todo.status).toBe('open');
      expect(todo.tags).toEqual([]);
    });

    it('should throw error for empty text', () => {
      expect(() => {
        CRDTHelpers.addTodo(api, 0, {
          text: '',
          createdBy: 'user-123',
        });
      }).toThrow('Todo text cannot be empty');
    });

    it('should throw error for invalid patient index', () => {
      expect(() => {
        CRDTHelpers.addTodo(api, -1, {
          text: 'Test',
          createdBy: 'user-123',
        });
      }).toThrow('Invalid patient index');
    });
  });

  describe('toggleTodoStatus', () => {
    beforeEach(() => {
      CRDTHelpers.addTodo(api, 0, {
        text: 'Test todo',
        createdBy: 'user-123',
      });
    });

    it('should toggle from open to complete', () => {
      CRDTHelpers.toggleTodoStatus(api, 0, 0, 'user-456');

      const view = model.view();
      const todo = view.patients[0].todos[0];

      expect(todo.status).toBe('complete');
      expect(todo.completedBy).toBe('user-456');
      expect(todo.completedAt).toBeDefined();
    });

    it('should toggle from complete back to open', () => {
      // First complete it
      CRDTHelpers.toggleTodoStatus(api, 0, 0, 'user-456');
      
      // Then reopen it
      CRDTHelpers.toggleTodoStatus(api, 0, 0, 'user-789');

      const view = model.view();
      const todo = view.patients[0].todos[0];

      expect(todo.status).toBe('open');
      expect(todo.completedBy).toBe('');
      expect(todo.completedAt).toBe('');
    });
  });

  describe('updateTodo', () => {
    beforeEach(() => {
      CRDTHelpers.addTodo(api, 0, {
        text: 'Original text',
        tags: ['Original'],
        createdBy: 'user-123',
      });
    });

    it('should update todo fields', () => {
      CRDTHelpers.updateTodo(api, 0, 0, {
        text: 'Updated text',
        description: 'New description',
        tags: ['Updated', 'New'],
      });

      const view = model.view();
      const todo = view.patients[0].todos[0];

      expect(todo.text).toBe('Updated text');
      expect(todo.description).toBe('New description');
      expect(todo.tags).toEqual(['Updated', 'New']);
      expect(todo.updatedAt).toBeDefined();
    });

    it('should update due time', () => {
      CRDTHelpers.updateTodo(api, 0, 0, {
        dueTime: {
          type: 'recurring_hours',
          intervalHours: 4,
          nextDue: '2024-01-16T14:00:00Z',
        },
      });

      const view = model.view();
      const todo = view.patients[0].todos[0];

      expect(todo.dueTime.type).toBe('recurring_hours');
      expect(todo.dueTime.intervalHours).toBe(4);
    });
  });

  describe('completeRecurringTodo', () => {
    it('should handle n_times todo completion', () => {
      CRDTHelpers.addTodo(api, 0, {
        text: 'Take medication',
        dueTime: {
          type: 'n_times',
          occurrences: 3,
          completedOccurrences: 0,
        },
        createdBy: 'user-123',
      });

      // Complete first occurrence
      CRDTHelpers.completeRecurringTodo(api, 0, 0, 'user-456');
      
      let view = model.view();
      let todo = view.patients[0].todos[0];
      
      expect(todo.dueTime.completedOccurrences).toBe(1);
      expect(todo.status).toBe('open'); // Still open

      // Complete second occurrence
      CRDTHelpers.completeRecurringTodo(api, 0, 0, 'user-456');
      
      view = model.view();
      todo = view.patients[0].todos[0];
      
      expect(todo.dueTime.completedOccurrences).toBe(2);

      // Complete final occurrence
      CRDTHelpers.completeRecurringTodo(api, 0, 0, 'user-456');
      
      view = model.view();
      todo = view.patients[0].todos[0];
      
      expect(todo.dueTime.completedOccurrences).toBe(3);
      expect(todo.status).toBe('complete'); // Now complete
    });

    it('should create new todo for recurring hours', () => {
      const now = new Date('2024-01-15T10:00:00Z');
      vi.setSystemTime(now);

      CRDTHelpers.addTodo(api, 0, {
        text: 'Check vitals',
        tags: ['Vitals', 'Nursing'],
        dueTime: {
          type: 'recurring_hours',
          intervalHours: 4,
        },
        createdBy: 'user-123',
      });

      CRDTHelpers.completeRecurringTodo(api, 0, 0, 'user-456');

      const view = model.view();
      const todos = view.patients[0].todos;

      expect(todos.length).toBe(2);
      
      // Original todo should be complete
      expect(todos[0].status).toBe('complete');
      
      // New todo should be created
      expect(todos[1].text).toBe('Check vitals');
      expect(todos[1].status).toBe('open');
      expect(todos[1].tags).toEqual(['Vitals', 'Nursing']);
      expect(todos[1].dueTime.type).toBe('recurring_hours');
      
      // Check next due time
      const nextDue = new Date(todos[1].dueTime.nextDue);
      const expectedDue = new Date(now.getTime() + 4 * 60 * 60 * 1000);
      expect(nextDue.toISOString()).toBe(expectedDue.toISOString());
    });

    it('should handle one-time todo completion', () => {
      CRDTHelpers.addTodo(api, 0, {
        text: 'One-time task',
        dueTime: {
          type: 'once',
          dueDate: '2024-01-16T10:00:00Z',
        },
        createdBy: 'user-123',
      });

      CRDTHelpers.completeRecurringTodo(api, 0, 0, 'user-456');

      const view = model.view();
      const todo = view.patients[0].todos[0];

      expect(todo.status).toBe('complete');
      expect(todo.completedBy).toBe('user-456');
      expect(view.patients[0].todos.length).toBe(1); // No new todo created
    });
  });

  describe('removeTodo', () => {
    beforeEach(() => {
      CRDTHelpers.addTodo(api, 0, {
        text: 'Todo to remove',
        createdBy: 'user-123',
      });
    });

    it('should remove todo', () => {
      const view = model.view();
      expect(view.patients[0].todos.length).toBe(1);

      CRDTHelpers.removeTodo(api, 0, 0);

      const updatedView = model.view();
      expect(updatedView.patients[0].todos.length).toBe(0);
    });

    it('should throw error for invalid todo index', () => {
      expect(() => {
        CRDTHelpers.removeTodo(api, 0, 5);
      }).toThrow('Todo index 5 out of bounds');
    });
  });

  describe('findTodoIndex', () => {
    it('should find todo by ID', () => {
      const todoId1 = CRDTHelpers.addTodo(api, 0, {
        text: 'First todo',
        createdBy: 'user-123',
      });
      
      const todoId2 = CRDTHelpers.addTodo(api, 0, {
        text: 'Second todo',
        createdBy: 'user-123',
      });

      expect(CRDTHelpers.findTodoIndex(model, 0, todoId1)).toBe(0);
      expect(CRDTHelpers.findTodoIndex(model, 0, todoId2)).toBe(1);
      expect(CRDTHelpers.findTodoIndex(model, 0, 'non-existent')).toBe(-1);
    });
  });
});