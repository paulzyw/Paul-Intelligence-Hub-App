import { useEditor, EditorContent, ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent, Extension } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { Placeholder } from '@tiptap/extension-placeholder';
import { lowlight } from 'lowlight';
import { 
  Bold, Italic, List, Terminal, Heading1, Heading2, Heading3, Copy, Check, 
  Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Link as LinkIcon, Image as ImageIcon, Table as TableIcon, ListOrdered, 
  CheckSquare, Undo, Redo, Type, ChevronDown, Trash2, Plus, Minus, Maximize2,
  Columns
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { cn } from '../lib/utils';

// --- CUSTOM EXTENSIONS ---

// Font Size Extension (Robust)
const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return {
      types: ['textStyle'],
    };
  },
  addAttributes() {
    return {
      fontSize: {
        default: null,
        parseHTML: element => element.style.fontSize,
        renderHTML: attributes => {
          if (!attributes.fontSize) return {};
          return { style: `font-size: ${attributes.fontSize}` };
        },
      },
    };
  },
  addCommands() {
    return {
      setFontSize: fontSize => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize })
          .run();
      },
      unsetFontSize: () => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize: null })
          .removeEmptyTextStyle()
          .run();
      },
    };
  },
});

// Line Height Extension (Robust)
const LineHeight = Extension.create({
  name: 'lineHeight',
  addOptions() {
    return {
      types: ['paragraph', 'heading', 'listItem'],
      defaultLineHeight: 'normal',
    };
  },
  addAttributes() {
    return {
      lineHeight: {
        default: null,
        parseHTML: element => element.style.lineHeight,
        renderHTML: attributes => {
          if (!attributes.lineHeight) return {};
          return { style: `line-height: ${attributes.lineHeight}` };
        },
      },
    };
  },
  addCommands() {
    return {
      setLineHeight: lineHeight => ({ chain }) => {
        return this.options.types.reduce((chain, type) => chain.updateAttributes(type, { lineHeight }), chain()).run();
      },
      unsetLineHeight: () => ({ chain }) => {
        return this.options.types.reduce((chain, type) => chain.updateAttributes(type, { lineHeight: null }), chain()).run();
      },
    };
  },
});

// --- SAFE CUSTOM CODE BLOCK (Enhanced) ---
const CodeBlockComponent = ({ node }: any) => {
  const [copied, setCopied] = useState(false);
  const copyCode = () => {
    const text = node.textContent;
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  return (
    <NodeViewWrapper className="code-block-wrapper group">
      <div className="code-block-header">
        <button 
          type="button" 
          onClick={(e) => { e.preventDefault(); copyCode(); }} 
          className={cn("copy-code-btn", copied && "copied")}
        >
          {copied ? (
            <>
              <Check size={14} />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-6 font-mono text-sm overflow-x-auto">
        <code><NodeViewContent /></code>
      </pre>
    </NodeViewWrapper>
  );
};

export const TiptapEditor = ({ content, onChange }: any) => {
  const lastContent = useRef(content);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ 
        codeBlock: false,
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-accent hover:underline cursor-pointer' } }),
      Image.configure({ inline: true, HTMLAttributes: { class: 'rounded-xl max-w-full h-auto my-4' } }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({ nested: true }),
      TextStyle,
      FontFamily,
      Color,
      Highlight.configure({ multicolor: true }),
      Placeholder.configure({ placeholder: 'Start writing your masterwork...' }),
      FontSize,
      LineHeight,
      CodeBlockLowlight.configure({ lowlight }).extend({
        addNodeView() { return ReactNodeViewRenderer(CodeBlockComponent); },
      }),
    ],
    content: content,
    // --- ADVANCED WORD CLEANING LOGIC ---
    editorProps: {
      transformPastedHTML(html) {
        // Use non-greedy regex to strip specific junk styles that interfere with our typography
        // Specifically: margin, line-height, and font-family
        let cleaned = html
          .replace(/<o:p>[\s\S]*?<\/o:p>/g, '') // Remove Word's paragraph markers
          .replace(/mso-[\w-]+:.*?;/g, '')     // Strip all mso- styles
          .replace(/style="[\s\S]*?"/gi, (match) => {
             // Use non-greedy negative lookahead/matching to remove specific properties
             // but keep others if necessary. For this requirement, we strike hard.
             return match
               .replace(/margin(-top|-bottom|-left|-right)?\s*:\s*[\w\d.-]+(;?)/gi, '')
               .replace(/line-height\s*:\s*[\w\d.-]+(;?)/gi, '')
               .replace(/font-family\s*:\s*[\s\S]*?(;|$)/gi, '')
               .replace(/font-size\s*:\s*[\w\d.-]+(;?)/gi, '');
          })
          .trim();

        return cleaned;
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // Guarded onUpdate to prevent infinite loops and rate exceeding
      if (html !== lastContent.current) {
        lastContent.current = html;
        onChange(html);
      }
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, false);
    }
  }, [content, editor]);

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!editor) return null;

  const toggleDropdown = (name: string) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  const addLink = () => {
    const url = window.prompt('URL');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
    setActiveDropdown(null);
  };

  const addImage = () => {
    const url = window.prompt('Image URL');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
    setActiveDropdown(null);
  };

  const fontSizes = ['12px', '14px', '16px', '18px', '20px', '24px', '30px', '36px'];
  const fontFamilies = [
    { label: 'Default', value: '' },
    { label: 'Sans', value: 'Inter, sans-serif' },
    { label: 'Serif', value: 'Georgia, serif' },
    { label: 'Mono', value: '"JetBrains Mono", monospace' }
  ];
  const lineHeights = ['1', '1.15', '1.5', '2'];

  return (
    <div className="border border-border rounded-xl bg-bg-surface flex flex-col transition-colors duration-400 relative">
      {/* TOOLBAR */}
      <div ref={toolbarRef} className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-bg-primary/50 sticky top-0 z-30 min-h-[52px]">
        {/* History */}
        <div className="flex items-center gap-0.5 mr-2">
          <button type="button" onClick={(e) => { e.preventDefault(); editor.chain().focus().undo().run(); }} disabled={!editor.can().undo()} className="p-2 rounded text-text-secondary hover:bg-bg-primary disabled:opacity-30"><Undo size={16} /></button>
          <button type="button" onClick={(e) => { e.preventDefault(); editor.chain().focus().redo().run(); }} disabled={!editor.can().redo()} className="p-2 rounded text-text-secondary hover:bg-bg-primary disabled:opacity-30"><Redo size={16} /></button>
        </div>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Headings Dropdown */}
        <div className="relative px-1">
          <button 
            type="button" 
            onClick={(e) => { e.preventDefault(); toggleDropdown('headings'); }}
            className={cn(
              "flex items-center gap-1 p-2 rounded text-text-secondary hover:bg-bg-primary min-w-[100px] justify-between transition-colors",
              activeDropdown === 'headings' && "bg-bg-primary text-accent"
            )}
          >
            <span className="text-xs font-medium">Headings</span>
            <ChevronDown size={14} className={cn("transition-transform", activeDropdown === 'headings' && "rotate-180")} />
          </button>
          {activeDropdown === 'headings' && (
            <div className="absolute top-full left-0 mt-1 bg-bg-surface border border-border rounded-md shadow-2xl z-50 p-1 min-w-[140px] animate-in fade-in slide-in-from-top-1">
              <button type="button" onClick={(e) => { e.preventDefault(); editor.chain().focus().setParagraph().run(); setActiveDropdown(null); }} className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:bg-bg-primary rounded">Paragraph</button>
              <button type="button" onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 1 }).run(); setActiveDropdown(null); }} className={cn("w-full text-left px-3 py-2 text-sm rounded", editor.isActive('heading', { level: 1 }) ? "bg-accent text-white" : "text-text-secondary hover:bg-bg-primary")}>Heading 1</button>
              <button type="button" onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run(); setActiveDropdown(null); }} className={cn("w-full text-left px-3 py-2 text-sm rounded", editor.isActive('heading', { level: 2 }) ? "bg-accent text-white" : "text-text-secondary hover:bg-bg-primary")}>Heading 2</button>
              <button type="button" onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 3 }).run(); setActiveDropdown(null); }} className={cn("w-full text-left px-3 py-2 text-sm rounded", editor.isActive('heading', { level: 3 }) ? "bg-accent text-white" : "text-text-secondary hover:bg-bg-primary")}>Heading 3</button>
            </div>
          )}
        </div>

        {/* Font Family Dropdown */}
        <div className="relative px-1">
          <button 
            type="button" 
            onClick={(e) => { e.preventDefault(); toggleDropdown('fonts'); }}
            className={cn(
              "flex items-center gap-1 p-2 rounded text-text-secondary hover:bg-bg-primary min-w-[80px] justify-between transition-colors",
              activeDropdown === 'fonts' && "bg-bg-primary text-accent"
            )}
          >
            <Type size={16} />
            <ChevronDown size={14} className={cn("transition-transform", activeDropdown === 'fonts' && "rotate-180")} />
          </button>
          {activeDropdown === 'fonts' && (
            <div className="absolute top-full left-0 mt-1 bg-bg-surface border border-border rounded-md shadow-2xl z-50 p-1 min-w-[160px] animate-in fade-in slide-in-from-top-1">
              {fontFamilies.map(f => (
                <button 
                  key={f.label}
                  type="button" 
                  onClick={(e) => {
                    e.preventDefault();
                    f.value ? editor.chain().focus().setFontFamily(f.value).run() : editor.chain().focus().unsetFontFamily().run();
                    setActiveDropdown(null);
                  }} 
                  className={cn("w-full text-left px-3 py-2 text-sm rounded", editor.isActive('textStyle', { fontFamily: f.value }) ? "bg-accent text-white" : "text-text-secondary hover:bg-bg-primary")}
                  style={{ fontFamily: f.value || 'inherit' }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Font Size Dropdown */}
        <div className="relative px-1">
          <button 
            type="button" 
            onClick={(e) => { e.preventDefault(); toggleDropdown('size'); }}
            className={cn(
              "flex items-center gap-1 p-2 rounded text-text-secondary hover:bg-bg-primary min-w-[70px] justify-between transition-colors",
              activeDropdown === 'size' && "bg-bg-primary text-accent"
            )}
          >
            <span className="text-xs">Size</span>
            <ChevronDown size={14} className={cn("transition-transform", activeDropdown === 'size' && "rotate-180")} />
          </button>
          {activeDropdown === 'size' && (
            <div className="absolute top-full left-0 mt-1 bg-bg-surface border border-border rounded-md shadow-2xl z-50 p-1 min-w-[100px] animate-in fade-in slide-in-from-top-1">
              <button type="button" onClick={(e) => { e.preventDefault(); editor.chain().focus().unsetFontSize().run(); setActiveDropdown(null); }} className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:bg-bg-primary rounded">Reset</button>
              {fontSizes.map(size => (
                <button 
                  key={size}
                  type="button" 
                  onClick={(e) => { e.preventDefault(); editor.chain().focus().setFontSize(size).run(); setActiveDropdown(null); }} 
                  className={cn("w-full text-left px-3 py-2 text-sm rounded", editor.isActive('textStyle', { fontSize: size }) ? "bg-accent text-white" : "text-text-secondary hover:bg-bg-primary")}
                >
                  {size}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Formatting */}
        <div className="flex items-center gap-0.5">
          <button type="button" onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }} className={cn("p-2 rounded transition-colors", editor.isActive('bold') ? "bg-accent text-white" : "text-text-secondary hover:bg-bg-primary")}><Bold size={16} /></button>
          <button type="button" onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }} className={cn("p-2 rounded transition-colors", editor.isActive('italic') ? "bg-accent text-white" : "text-text-secondary hover:bg-bg-primary")}><Italic size={16} /></button>
          <button type="button" onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleUnderline().run(); }} className={cn("p-2 rounded transition-colors", editor.isActive('underline') ? "bg-accent text-white" : "text-text-secondary hover:bg-bg-primary")}><UnderlineIcon size={16} /></button>
        </div>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Alignment */}
        <div className="flex items-center gap-0.5">
          <button type="button" onClick={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign('left').run(); }} className={cn("p-2 rounded", editor.isActive({ textAlign: 'left' }) ? "bg-accent text-white" : "text-text-secondary hover:bg-bg-primary")}><AlignLeft size={16} /></button>
          <button type="button" onClick={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign('center').run(); }} className={cn("p-2 rounded", editor.isActive({ textAlign: 'center' }) ? "bg-accent text-white" : "text-text-secondary hover:bg-bg-primary")}><AlignCenter size={16} /></button>
          <button type="button" onClick={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign('right').run(); }} className={cn("p-2 rounded", editor.isActive({ textAlign: 'right' }) ? "bg-accent text-white" : "text-text-secondary hover:bg-bg-primary")}><AlignRight size={16} /></button>
          <button type="button" onClick={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign('justify').run(); }} className={cn("p-2 rounded", editor.isActive({ textAlign: 'justify' }) ? "bg-accent text-white" : "text-text-secondary hover:bg-bg-primary")}><AlignJustify size={16} /></button>
        </div>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Lists */}
        <div className="flex items-center gap-0.5">
          <button type="button" onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); }} className={cn("p-2 rounded", editor.isActive('bulletList') ? "bg-accent text-white" : "text-text-secondary hover:bg-bg-primary")}><List size={16} /></button>
          <button type="button" onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run(); }} className={cn("p-2 rounded", editor.isActive('orderedList') ? "bg-accent text-white" : "text-text-secondary hover:bg-bg-primary")}><ListOrdered size={16} /></button>
          <button type="button" onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleTaskList().run(); }} className={cn("p-2 rounded", editor.isActive('taskList') ? "bg-accent text-white" : "text-text-secondary hover:bg-bg-primary")}><CheckSquare size={16} /></button>
        </div>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Insert */}
        <div className="flex items-center gap-0.5">
          <button type="button" onClick={(e) => { e.preventDefault(); addLink(); }} className={cn("p-2 rounded", editor.isActive('link') ? "bg-accent text-white" : "text-text-secondary hover:bg-bg-primary")}><LinkIcon size={16} /></button>
          <button type="button" onClick={(e) => { e.preventDefault(); addImage(); }} className="p-2 rounded text-text-secondary hover:bg-bg-primary transition-colors"><ImageIcon size={16} /></button>
          <button type="button" onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleCodeBlock().run(); }} className={cn("p-2 rounded", editor.isActive('codeBlock') ? "bg-accent text-white" : "text-text-secondary hover:bg-bg-primary")}><Terminal size={16} /></button>
        </div>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Table Kit */}
        <div className="relative px-1">
          <button 
            type="button" 
            onClick={(e) => { e.preventDefault(); toggleDropdown('table'); }}
            className={cn(
              "flex items-center gap-1 p-2 rounded text-text-secondary hover:bg-bg-primary transition-colors",
              activeDropdown === 'table' && "bg-bg-primary text-accent"
            )}
          >
            <TableIcon size={16} />
            <ChevronDown size={14} className={cn("transition-transform", activeDropdown === 'table' && "rotate-180")} />
          </button>
          {activeDropdown === 'table' && (
            <div className="absolute top-full left-0 mt-1 bg-bg-surface border border-border rounded-md shadow-2xl z-50 p-1 min-w-[220px] animate-in fade-in slide-in-from-top-1">
              <button type="button" onClick={(e) => { e.preventDefault(); editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); setActiveDropdown(null); }} className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:bg-bg-primary rounded flex items-center gap-2"><Plus size={14} /> Insert Table</button>
              <div className="h-px bg-border/5 my-1" />
              <button type="button" onClick={(e) => { e.preventDefault(); editor.chain().focus().addColumnBefore().run(); setActiveDropdown(null); }} className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:bg-bg-primary rounded">Add Column Before</button>
              <button type="button" onClick={(e) => { e.preventDefault(); editor.chain().focus().addColumnAfter().run(); setActiveDropdown(null); }} className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:bg-bg-primary rounded">Add Column After</button>
              <button type="button" onClick={(e) => { e.preventDefault(); editor.chain().focus().deleteColumn().run(); setActiveDropdown(null); }} className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded">Delete Column</button>
              <div className="h-px bg-border/5 my-1" />
              <button type="button" onClick={(e) => { e.preventDefault(); editor.chain().focus().addRowBefore().run(); setActiveDropdown(null); }} className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:bg-bg-primary rounded">Add Row Before</button>
              <button type="button" onClick={(e) => { e.preventDefault(); editor.chain().focus().addRowAfter().run(); setActiveDropdown(null); }} className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:bg-bg-primary rounded">Add Row After</button>
              <button type="button" onClick={(e) => { e.preventDefault(); editor.chain().focus().deleteRow().run(); setActiveDropdown(null); }} className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded">Delete Row</button>
              <div className="h-px bg-border/5 my-1" />
              <button type="button" onClick={(e) => { e.preventDefault(); editor.chain().focus().deleteTable().run(); setActiveDropdown(null); }} className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded flex items-center gap-2"><Trash2 size={14} /> Delete Table</button>
            </div>
          )}
        </div>

        {/* Line Height Dropdown */}
        <div className="relative px-1">
          <button 
            type="button" 
            onClick={(e) => { e.preventDefault(); toggleDropdown('lineHeight'); }}
            className={cn(
              "flex items-center gap-1 p-2 rounded text-text-secondary hover:bg-bg-primary min-w-[70px] justify-between transition-colors",
              activeDropdown === 'lineHeight' && "bg-bg-primary text-accent"
            )}
          >
            <Columns size={16} />
            <ChevronDown size={14} className={cn("transition-transform", activeDropdown === 'lineHeight' && "rotate-180")} />
          </button>
          {activeDropdown === 'lineHeight' && (
            <div className="absolute top-full left-0 mt-1 bg-bg-surface border border-border rounded-md shadow-2xl z-50 p-1 min-w-[120px] animate-in fade-in slide-in-from-top-1">
               <button type="button" onClick={(e) => { e.preventDefault(); editor.chain().focus().unsetLineHeight().run(); setActiveDropdown(null); }} className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:bg-bg-primary rounded">Default</button>
               {lineHeights.map(lh => (
                 <button 
                  key={lh}
                  type="button" 
                  onClick={(e) => { e.preventDefault(); editor.chain().focus().setLineHeight(lh).run(); setActiveDropdown(null); }} 
                  className={cn("w-full text-left px-3 py-2 text-sm rounded", editor.getAttributes('paragraph').lineHeight === lh ? "bg-accent text-white" : "text-text-secondary hover:bg-bg-primary")}
                 >
                   Line {lh}
                 </button>
               ))}
            </div>
          )}
        </div>
      </div>


      <div className="prose prose-invert max-w-none flex-grow min-h-[500px] bg-bg-surface text-text-primary transition-colors duration-400">
        <EditorContent editor={editor} className="p-8 outline-none" />
      </div>
    </div>
  );
};

export default TiptapEditor;