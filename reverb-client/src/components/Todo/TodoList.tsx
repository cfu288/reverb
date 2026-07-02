import { useState, useMemo } from 'react';
import { Todo } from '@/models/Todo';
import { TodoItem } from './TodoItem';
import { TodoEditor } from './TodoEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { filterTodosByStatus, sortTodos, groupTodosByTag, TodoSortCriteria } from '@/utils/todoUtils';
import { Plus, Search, Filter, X } from 'lucide-react';

interface TodoListProps {
  todos: Todo[];
  existingTags: string[];
  onAddTodo: (todo: Partial<Todo>) => void;
  onUpdateTodo: (todoId: string, updates: Partial<Todo>) => void;
  onToggleComplete: (todoId: string) => void;
  onHideTodo: (todoId: string) => void;
}

export function TodoList({
  todos,
  existingTags,
  onAddTodo,
  onUpdateTodo,
  onToggleComplete,
  onHideTodo,
}: TodoListProps) {
  const [showEditor, setShowEditor] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'complete' | 'hidden'>('all');
  const [sortBy, setSortBy] = useState<TodoSortCriteria>('dueDate');
  const [groupByTag, setGroupByTag] = useState(false);

  // Filter todos based on search, tags, and status
  const filteredTodos = useMemo(() => {
    let filtered = todos;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        todo =>
          todo.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
          todo.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(todo =>
        selectedTags.some(tag => todo.tags.includes(tag))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filterTodosByStatus(filtered, [statusFilter]);
    }

    return filtered;
  }, [todos, searchQuery, selectedTags, statusFilter]);

  // Sort todos
  const sortedTodos = useMemo(() => {
    return sortTodos(filteredTodos, sortBy);
  }, [filteredTodos, sortBy]);

  // Group todos by tag if enabled
  const groupedTodos = useMemo(() => {
    if (!groupByTag) return null;
    return groupTodosByTag(sortedTodos);
  }, [sortedTodos, groupByTag]);

  const handleSaveTodo = (todoData: Partial<Todo>) => {
    if (editingTodo) {
      onUpdateTodo(editingTodo.id, todoData);
    } else {
      onAddTodo(todoData);
    }
    setShowEditor(false);
    setEditingTodo(undefined);
  };

  const handleEditTodo = (todo: Todo) => {
    setEditingTodo(todo);
    setShowEditor(true);
  };

  const handleToggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const openTodos = todos.filter(t => t.status === 'open');
  const completedTodos = todos.filter(t => t.status === 'complete');
  const hiddenTodos = todos.filter(t => t.status === 'hidden');

  return (
    <div className="space-y-4">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Todos</h3>
        <Button
          onClick={() => {
            setEditingTodo(undefined);
            setShowEditor(true);
          }}
          size="sm"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Todo
        </Button>
      </div>

      {/* Editor */}
      {showEditor && (
        <TodoEditor
          todo={editingTodo}
          existingTags={existingTags}
          onSave={handleSaveTodo}
          onCancel={() => {
            setShowEditor(false);
            setEditingTodo(undefined);
          }}
        />
      )}

      {/* Filters and Search */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search todos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={sortBy} onValueChange={(value: TodoSortCriteria) => setSortBy(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dueDate">Due Date</SelectItem>
              <SelectItem value="createdDate">Created Date</SelectItem>
              <SelectItem value="alphabetical">Alphabetical</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={groupByTag ? 'default' : 'outline'}
            size="sm"
            onClick={() => setGroupByTag(!groupByTag)}
          >
            Group by Tag
          </Button>
        </div>

        {/* Tag Filter */}
        {existingTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground flex items-center">
              <Filter className="h-3 w-3 mr-1" />
              Filter by tags:
            </span>
            {existingTags.map(tag => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => handleToggleTag(tag)}
              >
                {tag}
                {selectedTags.includes(tag) && (
                  <X className="h-3 w-3 ml-1" />
                )}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Todo List */}
      <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">
            All ({todos.length})
          </TabsTrigger>
          <TabsTrigger value="open">
            Open ({openTodos.length})
          </TabsTrigger>
          <TabsTrigger value="complete">
            Complete ({completedTodos.length})
          </TabsTrigger>
          <TabsTrigger value="hidden">
            Hidden ({hiddenTodos.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="space-y-2">
          {groupByTag && groupedTodos ? (
            // Grouped view
            <div className="space-y-4">
              {Array.from(groupedTodos.entries()).map(([tag, tagTodos]) => (
                <div key={tag} className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">
                    {tag === 'untagged' ? 'Untagged' : tag} ({tagTodos.length})
                  </h4>
                  <div className="space-y-2 pl-4">
                    {tagTodos.map(todo => (
                      <TodoItem
                        key={todo.id}
                        todo={todo}
                        onToggleComplete={onToggleComplete}
                        onEdit={handleEditTodo}
                        onHide={onHideTodo}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Regular view
            <div className="space-y-2">
              {sortedTodos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery || selectedTags.length > 0
                    ? 'No todos match your filters'
                    : 'No todos yet. Create your first todo!'}
                </div>
              ) : (
                sortedTodos.map(todo => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    onToggleComplete={onToggleComplete}
                    onEdit={handleEditTodo}
                    onHide={onHideTodo}
                  />
                ))
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}