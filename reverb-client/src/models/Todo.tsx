export interface DueTime {
  type: 'once' | 'n_times' | 'recurring_hours' | 'recurring_days';
  dueDate?: string; // ISO date string
  startDate?: string; // ISO date string
  occurrences?: number;
  completedOccurrences?: number;
  intervalHours?: number;
  intervalDays?: number;
  nextDue?: string; // ISO date string
}

export interface Todo {
  id: string;
  text: string;
  description?: string;
  status: 'open' | 'complete' | 'hidden';
  tags: string[];
  dueTime?: DueTime;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  completedAt?: string; // ISO date string
  createdBy: string; // User ID
  completedBy?: string; // User ID
}