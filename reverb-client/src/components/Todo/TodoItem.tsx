import { Todo } from '@/models/Todo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { isDueSoon, isOverdue } from '@/utils/todoUtils';
import { format } from 'date-fns';
import { Clock, Edit2, EyeOff, Calendar, Repeat } from 'lucide-react';

interface TodoItemProps {
  todo: Todo;
  onToggleComplete: (todoId: string) => void;
  onEdit: (todo: Todo) => void;
  onHide: (todoId: string) => void;
}

export function TodoItem({ todo, onToggleComplete, onEdit, onHide }: TodoItemProps) {
  const overdue = isOverdue(todo);
  const dueSoon = isDueSoon(todo);

  const getDueText = () => {
    if (!todo.dueTime) return null;

    let dueDate: string | undefined;
    let recurringText: string | undefined;

    switch (todo.dueTime.type) {
      case 'once':
        dueDate = todo.dueTime.dueDate;
        break;
      case 'n_times':
        dueDate = todo.dueTime.nextDue || todo.dueTime.startDate;
        recurringText = `${todo.dueTime.completedOccurrences || 0}/${todo.dueTime.occurrences || 1} times`;
        break;
      case 'recurring_hours':
        dueDate = todo.dueTime.nextDue;
        recurringText = `Every ${todo.dueTime.intervalHours} hours`;
        break;
      case 'recurring_days':
        dueDate = todo.dueTime.nextDue;
        recurringText = `Every ${todo.dueTime.intervalDays} days`;
        break;
    }

    const formattedDate = dueDate ? format(new Date(dueDate), 'MMM dd, HH:mm') : null;

    return { formattedDate, recurringText };
  };

  const dueInfo = getDueText();

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border bg-card transition-colors',
        todo.status === 'complete' && 'opacity-60',
        todo.status === 'hidden' && 'hidden',
        overdue && 'border-destructive bg-destructive/5',
        dueSoon && !overdue && 'border-warning bg-warning/5'
      )}
    >
      <Checkbox
        checked={todo.status === 'complete'}
        onCheckedChange={() => onToggleComplete(todo.id)}
        className="mt-0.5"
      />

      <div className="flex-1 space-y-1">
        <div className={cn('text-sm font-medium', todo.status === 'complete' && 'line-through')}>
          {todo.text}
        </div>

        {todo.description && (
          <div className="text-sm text-muted-foreground">{todo.description}</div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {todo.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}

          {dueInfo?.formattedDate && (
            <div className={cn('flex items-center gap-1 text-xs', overdue && 'text-destructive')}>
              <Calendar className="h-3 w-3" />
              <span>{dueInfo.formattedDate}</span>
            </div>
          )}

          {dueInfo?.recurringText && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Repeat className="h-3 w-3" />
              <span>{dueInfo.recurringText}</span>
            </div>
          )}

          {(overdue || dueSoon) && (
            <div className="flex items-center gap-1">
              <Clock className={cn('h-3 w-3', overdue ? 'text-destructive' : 'text-warning')} />
              <span className={cn('text-xs', overdue ? 'text-destructive' : 'text-warning')}>
                {overdue ? 'Overdue' : 'Due soon'}
              </span>
            </div>
          )}
        </div>

        {todo.status === 'complete' && todo.completedAt && (
          <div className="text-xs text-muted-foreground">
            Completed {format(new Date(todo.completedAt), 'MMM dd, HH:mm')}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(todo)}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        {todo.status !== 'hidden' && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onHide(todo.id)}
          >
            <EyeOff className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}