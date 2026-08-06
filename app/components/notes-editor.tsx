"use client";

import { useEffect, useRef } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "tiptap-markdown";

/**
 * Éditeur de notes WYSIWYG (type Notion) : on écrit directement dans le rendu,
 * la mise en forme s'applique en direct (raccourcis Cmd/Ctrl+B/I/U, et
 * auto-formatage en tapant `# `, `- `, `**gras**`…). Le contenu est stocké en
 * Markdown (`task.notes`) via tiptap-markdown, donc compatible avec la synchro
 * et l'aperçu Markdown de la corbeille.
 */

// tiptap-markdown augmente `editor.storage` à l'exécution mais pas les types.
function getMarkdown(editor: Editor): string {
  return (
    editor.storage as unknown as { markdown: { getMarkdown: () => string } }
  ).markdown.getMarkdown();
}

export function NotesEditor({
  label,
  value,
  onChange,
  minHeightClass,
}: {
  label: string;
  value: string;
  onChange: (markdown: string) => void;
  minHeightClass: string;
}) {
  // Réf pour toujours appeler la dernière closure sans recréer l'éditeur.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const editor = useEditor({
    // Requis en SSR (Next) pour éviter les erreurs d'hydratation.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { rel: "noopener noreferrer nofollow" },
        },
      }),
      Placeholder.configure({
        placeholder: "Écrire des notes… (Markdown supporté)",
      }),
      Markdown.configure({ html: true, linkify: true, transformPastedText: true }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: `markdown ${minHeightClass} outline-none`,
      },
    },
    onUpdate: ({ editor }) => {
      onChangeRef.current(getMarkdown(editor));
    },
  });

  // Répercute les changements externes (tâche mise à jour ailleurs / synchro)
  // sans écraser le curseur pendant la frappe.
  useEffect(() => {
    if (!editor) return;
    if (value !== getMarkdown(editor)) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label className="text-xs font-medium text-muted">{label}</label>
        <Toolbar editor={editor} />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

const isMac =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
const mod = isMac ? "⌘" : "Ctrl";

function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  const btn = (active: boolean) =>
    `flex h-7 min-w-7 items-center justify-center rounded-md px-1.5 text-sm transition duration-200 ease-smooth hover:bg-surface-hover ${
      active ? "bg-surface-hover text-content" : "text-muted hover:text-content"
    }`;

  const guard = (e: React.MouseEvent) => e.preventDefault(); // garde le focus/sélection

  const setLink = () => {
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Lien (URL)", prev ?? "https://");
    if (url === null) return; // annulé
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-0.5">
      <button type="button" title={`Gras (${mod}+B)`} aria-label="Gras" onMouseDown={guard}
        onClick={() => editor.chain().focus().toggleBold().run()} className={btn(editor.isActive("bold"))}>
        <span className="font-bold">B</span>
      </button>
      <button type="button" title={`Italique (${mod}+I)`} aria-label="Italique" onMouseDown={guard}
        onClick={() => editor.chain().focus().toggleItalic().run()} className={btn(editor.isActive("italic"))}>
        <span className="italic">I</span>
      </button>
      <button type="button" title={`Souligné (${mod}+U)`} aria-label="Souligné" onMouseDown={guard}
        onClick={() => editor.chain().focus().toggleUnderline().run()} className={btn(editor.isActive("underline"))}>
        <span className="underline">U</span>
      </button>
      <button type="button" title="Barré" aria-label="Barré" onMouseDown={guard}
        onClick={() => editor.chain().focus().toggleStrike().run()} className={btn(editor.isActive("strike"))}>
        <span className="line-through">S</span>
      </button>
      <button type="button" title="Code" aria-label="Code" onMouseDown={guard}
        onClick={() => editor.chain().focus().toggleCode().run()} className={btn(editor.isActive("code"))}>
        <span className="font-mono">{"<>"}</span>
      </button>

      <span className="mx-0.5 h-4 w-px bg-line" aria-hidden />

      <button type="button" title="Titre 1" aria-label="Titre 1" onMouseDown={guard}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={btn(editor.isActive("heading", { level: 1 }))}>
        H1
      </button>
      <button type="button" title="Titre 2" aria-label="Titre 2" onMouseDown={guard}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btn(editor.isActive("heading", { level: 2 }))}>
        H2
      </button>
      <button type="button" title="Titre 3" aria-label="Titre 3" onMouseDown={guard}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btn(editor.isActive("heading", { level: 3 }))}>
        H3
      </button>
      <button type="button" title="Liste à puces" aria-label="Liste à puces" onMouseDown={guard}
        onClick={() => editor.chain().focus().toggleBulletList().run()} className={btn(editor.isActive("bulletList"))}>
        <ListIcon />
      </button>
      <button type="button" title={`Lien (${mod}+K)`} aria-label="Lien" onMouseDown={guard}
        onClick={setLink} className={btn(editor.isActive("link"))}>
        <LinkIcon />
      </button>
    </div>
  );
}

function ListIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 6h13M8 12h13M8 18h13" />
      <circle cx="3.5" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="3.5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="3.5" cy="18" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
