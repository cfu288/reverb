import { useState } from 'react';
import { Todo, DueTime } from '@/models/Todo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { MEDICAL_TAGS } from '@/utils/todoUtils';

interface TodoEditorProps {
  todo?: Todo;
  onSave: (todo: Partial<Todo>) => void;
  onCancel: () => void;
  existingTags: string[];
}

export function TodoEditor({ todo, onSave, onCancel, existingTags }: TodoEditorProps) {
  const [text, setText] = useState(todo?.text || '');
  const [description, setDescription] = useState(todo?.description || '');
  const [tags, setTags] = useState<string[]>(todo?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  
  const [dueType, setDueType] = useState<DueTime['type']>(todo?.dueTime?.type || 'once');
  const [dueDate, setDueDate] = useState(todo?.dueTime?.dueDate || '');
  const [intervalHours, setIntervalHours] = useState(todo?.dueTime?.intervalHours || 4);
  const [intervalDays, setIntervalDays] = useState(todo?.dueTime?.intervalDays || 1);
  const [occurrences, setOccurrences] = useState(todo?.dueTime?.occurrences || 2);

  const allTags = [...new Set([...MEDICAL_TAGS, ...existingTags])];
  const filteredTags = tagInput
    ? allTags.filter(tag => 
        tag.toLowerCase().includes(tagInput.toLowerCase()) && 
        !tags.includes(tag)
      )
    : [];

  const handleAddTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput('');
      setShowTagSuggestions(false);
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSave = () => {
    if (!text.trim()) return;

    const dueTime: DueTime = {
      type: dueType,
      dueDate: dueType === 'once' ? dueDate : '',
      startDate: dueType === 'n_times' ? dueDate : '',
      occurrences: dueType === 'n_times' ? occurrences : 1,
      completedOccurrences: todo?.dueTime?.completedOccurrences || 0,
      intervalHours: dueType === 'recurring_hours' ? intervalHours : 0,
      intervalDays: dueType === 'recurring_days' ? intervalDays : 0,
      nextDue: '',
    };

    onSave({
      text: text.trim(),
      description: description.trim(),
      tags,
      dueTime,
    });
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div>
        <Label htmlFor="todo-text">Task</Label>
        <Input
          id="todo-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter todo text..."
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="todo-description">Description (optional)</Label>
        <Textarea
          id="todo-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add additional details..."
          className="mt-1"
          rows={3}
        />
      </div>

      <div>
        <Label>Due Time</Label>
        <Select value={dueType} onValueChange={(value: DueTime['type']) => setDueType(value)}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="once">One-time</SelectItem>
            <SelectItem value="n_times">N times</SelectItem>
            <SelectItem value="recurring_hours">Every Y hours</SelectItem>
            <SelectItem value="recurring_days">Every Z days</SelectItem>
          </SelectContent>
        </Select>

        {dueType === 'once' && (
          <div className="mt-2">
            <Input
              type="datetime-local"
              value={dueDate ? format(new Date(dueDate), "yyyy-MM-dd'T'HH:mm") : ''}
              onChange={(e) => setDueDate(new Date(e.target.value).toISOString())}
              className="mt-1"
            />
          </div>
        )}

        {dueType === 'n_times' && (
          <div className="mt-2 space-y-2">
            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="datetime-local"
                value={dueDate ? format(new Date(dueDate), "yyyy-MM-dd'T'HH:mm") : ''}
                onChange={(e) => setDueDate(new Date(e.target.value).toISOString())}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="occurrences">Number of occurrences</Label>
              <Input
                id="occurrences"
                type="number"
                min="1"
                value={occurrences}
                onChange={(e) => setOccurrences(parseInt(e.target.value) || 1)}
                className="mt-1"
              />
            </div>
          </div>
        )}

        {dueType === 'recurring_hours' && (
          <div className="mt-2">
            <Label htmlFor="interval-hours">Interval (hours)</Label>
            <Input
              id="interval-hours"
              type="number"
              min="1"
              value={intervalHours}
              onChange={(e) => setIntervalHours(parseInt(e.target.value) || 1)}
              className="mt-1"
            />
          </div>
        )}

        {dueType === 'recurring_days' && (
          <div className="mt-2">
            <Label htmlFor="interval-days">Interval (days)</Label>
            <Input
              id="interval-days"
              type="number"
              min="1"
              value={intervalDays}
              onChange={(e) => setIntervalDays(parseInt(e.target.value) || 1)}
              className="mt-1"
            />
          </div>
        )}
      </div>

      <div>
        <Label>Tags</Label>
        <div className="flex flex-wrap gap-2 mt-1 mb-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="relative">
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => {
                setTagInput(e.target.value);
                setShowTagSuggestions(true);
              }}
              onFocus={() => setShowTagSuggestions(true)}
              onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
              placeholder="Add tags..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag(tagInput);
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => handleAddTag(tagInput)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {showTagSuggestions && filteredTags.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-md max-h-48 overflow-auto">
              {filteredTags.map((tag) => (
                <button
                  key={tag}
                  className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground text-sm"
                  onClick={() => handleAddTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!text.trim()}>
          {todo ? 'Update' : 'Create'} Todo
        </Button>
      </div>
    </div>
  );
}