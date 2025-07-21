import { useEffect, useRef, useCallback, memo, useMemo } from 'react';
import { $getRoot, EditorState } from 'lexical';
import {
  InitialConfigType,
  LexicalComposer,
} from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { ListNode, ListItemNode } from '@lexical/list';
import { HeadingNode } from '@lexical/rich-text';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
}

// Create a consistent empty state
const EMPTY_LEXICAL_STATE = JSON.stringify({
  root: {
    children: [{
      children: [],
      direction: null,
      format: "",
      indent: 0,
      type: "paragraph",
      version: 1
    }],
    direction: null,
    format: "",
    indent: 0,
    type: "root",
    version: 1
  }
});

// Convert any value to valid Lexical JSON
function normalizeValue(value: string): string {
  if (!value) return EMPTY_LEXICAL_STATE;
  
  // If it's already Lexical JSON, return as-is
  if (value.startsWith('{"root":')) {
    return value;
  }
  
  // Convert plain text to Lexical format
  const lexicalState = {
    root: {
      children: [{
        children: [{
          detail: 0,
          format: 0,
          mode: "normal",
          style: "",
          text: value,
          type: "text",
          version: 1
        }],
        direction: null,
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1
      }],
      direction: null,
      format: "",
      indent: 0,
      type: "root",
      version: 1
    }
  };
  
  return JSON.stringify(lexicalState);
}

// Inner component that handles the editor logic
function RichTextEditorInner({ 
  value, 
  onChange, 
  placeholder,
  normalizedInitialValue 
}: RichTextEditorProps & { normalizedInitialValue: string }) {
  const [editor] = useLexicalComposerContext();
  const lastSentValue = useRef(normalizedInitialValue);
  const lastReceivedValue = useRef(normalizedInitialValue);
  const onChangeRef = useRef(onChange);
  const changeCounter = useRef(0);
  const isApplyingExternalUpdate = useRef(false);
  
  // Keep onChange ref up to date
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  
  // Handle change immediately without debounce
  const handleChange = useCallback((editorState: EditorState) => {
    // Skip if we're applying an external update
    if (isApplyingExternalUpdate.current) {
      return;
    }
    
    changeCounter.current++;
    const json = JSON.stringify(editorState.toJSON());
    
    // Extract text content for debugging using Lexical's proper API
    editorState.read(() => {
      const root = $getRoot();
      root.getTextContent();
    });
    
    // Remove verbose logging
    
    // Skip if this is the same value we just sent
    if (json === lastSentValue.current) {
      // Skip duplicate
      return;
    }
    
    lastSentValue.current = json;
    lastReceivedValue.current = json;
    // Call onChange
    onChangeRef.current(json); // Use ref to ensure we have the latest onChange
  }, []);
  
  // Handle prop updates (only for external changes)
  useEffect(() => {
    const normalizedValue = normalizeValue(value);
    
    
    // Check if we should update editor state
    
    // Skip if this is a value we sent
    if (normalizedValue === lastSentValue.current) {
      return;
    }
    
    // Skip if value hasn't actually changed from what we last received
    if (normalizedValue === lastReceivedValue.current) {
      return;
    }
    
    // Apply external update
    
    // This is an external update
    lastReceivedValue.current = normalizedValue;
    lastSentValue.current = normalizedValue; // Also update lastSent to prevent re-sending
    
    // Set flag to prevent onChange during update
    isApplyingExternalUpdate.current = true;
    
    editor.update(() => {
      const editorState = editor.parseEditorState(normalizedValue);
      editor.setEditorState(editorState);
    }, {
      // Use discrete update to prevent triggering onChange
      discrete: true
    });
    
    // Reset flag after a microtask to ensure update is complete
    Promise.resolve().then(() => {
      isApplyingExternalUpdate.current = false;
    });
  }, [editor, value]);
  
  // No need for blur handler or cleanup since we're not debouncing
  
  return (
    <>
      <RichTextPlugin
        contentEditable={
          <ContentEditable
            className="min-h-[60px] px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-placeholder={placeholder || ''}
            placeholder={<div className="absolute top-2 left-3 text-muted-foreground pointer-events-none">{placeholder}</div>}
          />
        }
        ErrorBoundary={LexicalErrorBoundary}
      />
      <OnChangePlugin onChange={handleChange} />
      <ListPlugin />
    </>
  );
}

export const RichTextEditor = memo(function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start typing...',
  readOnly = false,
  className = '',
}: RichTextEditorProps) {
  // Normalize the initial value once and memoize it
  const normalizedInitialValue = useMemo(() => normalizeValue(value), []);
  
  const initialConfig: InitialConfigType = {
    namespace: 'RichTextEditor',
    theme: {
      text: {
        bold: 'font-bold',
        italic: 'italic',
        underline: 'underline',
      },
      list: {
        nested: {
          listitem: 'list-none',
        },
        ol: 'list-decimal ml-4',
        ul: 'list-disc ml-4',
        listitem: 'ml-2',
      },
      heading: {
        h1: 'text-2xl font-bold',
        h2: 'text-xl font-bold',
        h3: 'text-lg font-bold',
      },
    },
    nodes: [HeadingNode, ListNode, ListItemNode],
    onError: (error) => {
      console.error('Lexical error:', error);
    },
    editorState: normalizedInitialValue,
    editable: !readOnly,
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className={`relative ${className}`}>
        <RichTextEditorInner 
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readOnly}
          normalizedInitialValue={normalizedInitialValue}
        />
      </div>
    </LexicalComposer>
  );
});

// Utility function to extract plain text from Lexical JSON
export function extractPlainTextFromLexical(lexicalJson: string): string {
  try {
    if (!lexicalJson || !lexicalJson.startsWith('{')) {
      return lexicalJson || '';
    }
    
    const state = JSON.parse(lexicalJson);
    
    function extractTextFromNode(node: any): string {
      if (node.type === 'text') {
        return node.text || '';
      }
      
      if (node.children) {
        return node.children.map(extractTextFromNode).join('');
      }
      
      return '';
    }
    
    if (state.root && state.root.children) {
      return state.root.children.map(extractTextFromNode).join('\n').trim();
    }
    
    return '';
  } catch (e) {
    console.error('Failed to extract plain text from Lexical JSON:', e);
    return lexicalJson || '';
  }
}