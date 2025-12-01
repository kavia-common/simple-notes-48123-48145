import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import './App.css';
import './index.css';

/**
 * Ocean Professional theme tokens
 */
const theme = {
  primary: '#2563EB',
  secondary: '#F59E0B',
  error: '#EF4444',
  background: '#f9fafb',
  surface: '#ffffff',
  text: '#111827',
  shadow: '0 8px 24px rgba(0,0,0,0.08)',
  radius: '12px'
};

/**
 * Utilities
 */
const STORAGE_KEY = 'notes-app:v1';

/**
 * Create a new blank note object.
 */
function createNote() {
  const now = new Date().toISOString();
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: 'Untitled Note',
    body: '',
    updatedAt: now,
    createdAt: now
  };
}

/**
 * Format a timestamp in a friendly way
 */
function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString();
}

/**
 * LOCAL STORAGE HOOK
 */
// PUBLIC_INTERFACE
function useLocalStorageNotes() {
  /**
   * Load notes from localStorage and manage CRUD operations.
   * Returns notes array, selected note id, and CRUD helpers.
   */
  const [notes, setNotes] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch {
      return [];
    }
  });

  const [selectedId, setSelectedId] = useState(() => {
    const raw = localStorage.getItem(`${STORAGE_KEY}:selected`);
    return raw || null;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch {
      // ignore storage quota errors
    }
  }, [notes]);

  useEffect(() => {
    try {
      if (selectedId) {
        localStorage.setItem(`${STORAGE_KEY}:selected`, selectedId);
      } else {
        localStorage.removeItem(`${STORAGE_KEY}:selected`);
      }
    } catch {
      // ignore
    }
  }, [selectedId]);

  const addNote = useCallback(() => {
    const n = createNote();
    setNotes(prev => [n, ...prev]);
    setSelectedId(n.id);
    return n.id;
  }, []);

  const updateNote = useCallback((id, updater) => {
    setNotes(prev =>
      prev.map(n => {
        if (n.id !== id) return n;
        const next = typeof updater === 'function' ? updater(n) : { ...n, ...updater };
        return { ...next, updatedAt: new Date().toISOString() };
      })
    );
  }, []);

  const deleteNote = useCallback((id) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    setSelectedId(prev => (prev === id ? null : prev));
  }, []);

  return {
    notes,
    selectedId,
    setSelectedId,
    addNote,
    updateNote,
    deleteNote
  };
}

/**
 * HEADER / APP BAR
 */
function AppBar({ onAddNote }) {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: `linear-gradient(180deg, rgba(37,99,235,0.06), rgba(249,250,251,0.9))`,
        backdropFilter: 'saturate(140%) blur(4px)',
        borderBottom: '1px solid rgba(17,24,39,0.06)'
      }}
      aria-label="Application header"
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 16
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            aria-hidden
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${theme.primary} 0%, #60a5fa 100%)`,
              boxShadow: theme.shadow
            }}
          />
          <div>
            <div style={{ color: theme.text, fontWeight: 700, fontSize: 18 }}>
              Ocean Notes
            </div>
            <div style={{ color: '#6b7280', fontSize: 12 }}>
              Simple, modern note taking
            </div>
          </div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button
            onClick={onAddNote}
            className="btn-primary"
            aria-label="Add a new note"
            title="Add new note (Alt+N)"
          >
            + Add Note
          </button>
        </div>
      </div>
    </header>
  );
}

/**
 * SEARCH BAR
 */
function SearchBar({ value, onChange }) {
  const inputRef = useRef(null);
  return (
    <div style={{ padding: 12 }}>
      <label htmlFor="search-notes" className="sr-only">
        Search notes
      </label>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: theme.surface,
          border: '1px solid #e5e7eb',
          borderRadius: 10,
          padding: '8px 10px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
        }}
      >
        <span aria-hidden style={{ color: '#6b7280' }}>🔎</span>
        <input
          id="search-notes"
          ref={inputRef}
          type="text"
          placeholder="Search notes…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: 14,
            color: theme.text,
            background: 'transparent'
          }}
        />
        {value ? (
          <button
            onClick={() => {
              onChange('');
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="btn-ghost"
          >
            ✕
          </button>
        ) : null}
      </div>
    </div>
  );
}

/**
 * NOTE LIST ITEM
 */
function NoteItem({ note, active, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className="note-item"
      style={{
        width: '100%',
        textAlign: 'left',
        background: active ? 'rgba(37,99,235,0.08)' : theme.surface,
        border: `1px solid ${active ? 'rgba(37,99,235,0.25)' : '#e5e7eb'}`,
        borderRadius: 12,
        padding: 12,
        cursor: 'pointer',
        transition: 'all .18s ease',
        outlineOffset: 2
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 8,
          alignItems: 'baseline'
        }}
      >
        <div
          style={{
            fontWeight: 600,
            color: theme.text,
            fontSize: 14,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: 220
          }}
          title={note.title || 'Untitled Note'}
        >
          {note.title || 'Untitled Note'}
        </div>
        <div style={{ fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>
          {formatTime(note.updatedAt)}
        </div>
      </div>
      {note.body ? (
        <div
          style={{
            fontSize: 12,
            color: '#6b7280',
            marginTop: 6,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '100%'
          }}
          title={note.body}
        >
          {note.body}
        </div>
      ) : null}
    </button>
  );
}

/**
 * NOTE LIST PANEL
 */
function NoteList({ notes, selectedId, onSelect, search, setSearch }) {
  const filtered = useMemo(() => {
    const lower = search.trim().toLowerCase();
    let data = notes;
    if (lower) {
      data = data.filter(
        n =>
          (n.title || '').toLowerCase().includes(lower) ||
          (n.body || '').toLowerCase().includes(lower)
      );
    }
    // sort by updated desc
    return [...data].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [notes, search]);

  return (
    <aside
      aria-label="Notes list"
      style={{
        borderRight: '1px solid #e5e7eb',
        background: `linear-gradient(180deg, rgba(243,244,246,0.8), rgba(255,255,255,0.9))`,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 300,
        maxWidth: 420
      }}
    >
      <SearchBar value={search} onChange={setSearch} />
      <div
        role="listbox"
        aria-label="Notes"
        tabIndex={0}
        style={{
          padding: 12,
          overflowY: 'auto',
          display: 'grid',
          gap: 10,
          flex: 1
        }}
      >
        {filtered.length === 0 ? (
          <EmptyState
            title="No notes found"
            subtitle={
              search
                ? 'Try a different search or clear the filter.'
                : 'Get started by creating your first note.'
            }
          />
        ) : (
          filtered.map(n => (
            <NoteItem
              key={n.id}
              note={n}
              active={n.id === selectedId}
              onClick={() => onSelect(n.id)}
            />
          ))
        )}
      </div>
    </aside>
  );
}

/**
 * EDITOR PANEL
 */
function Editor({
  note,
  onTitleChange,
  onBodyChange,
  onDeleteRequest
}) {
  if (!note) {
    return (
      <div
        style={{
          height: '100%',
          display: 'grid',
          placeItems: 'center',
          color: '#6b7280'
        }}
      >
        <EmptyState
          title="No note selected"
          subtitle="Choose a note from the left or create a new one."
          cta={null}
        />
      </div>
    );
  }

  return (
    <section
      aria-label="Note editor"
      style={{
        padding: 24,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center'
        }}
      >
        <label htmlFor="note-title" className="sr-only">
          Note title
        </label>
        <input
          id="note-title"
          value={note.title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Note title"
          style={{
            flex: 1,
            fontSize: 20,
            fontWeight: 700,
            color: theme.text,
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: '10px 12px',
            background: theme.surface,
            outlineColor: theme.primary,
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
          }}
        />
        <button
          onClick={onDeleteRequest}
          className="btn-danger"
          aria-label="Delete this note"
          title="Delete note"
        >
          Delete
        </button>
      </div>
      <div style={{ fontSize: 12, color: '#6b7280' }}>
        Last updated {formatTime(note.updatedAt)}
      </div>
      <label htmlFor="note-body" className="sr-only">
        Note content
      </label>
      <textarea
        id="note-body"
        value={note.body}
        onChange={(e) => onBodyChange(e.target.value)}
        placeholder="Write your note here…"
        style={{
          flex: 1,
          resize: 'none',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 14,
          fontSize: 14,
          lineHeight: 1.6,
          color: theme.text,
          background: theme.surface,
          outlineColor: theme.primary,
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
        }}
      />
    </section>
  );
}

/**
 * EMPTY STATE
 */
function EmptyState({ title, subtitle, cta }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        background: theme.surface,
        border: '1px dashed #e5e7eb',
        borderRadius: 16,
        boxShadow: theme.shadow,
        padding: 24,
        textAlign: 'center',
        maxWidth: 420,
        margin: '0 auto'
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          margin: '0 auto 12px',
          borderRadius: '50%',
          background: `linear-gradient(135deg, rgba(37,99,235,0.12), rgba(17,24,39,0.04))`,
          display: 'grid',
          placeItems: 'center'
        }}
        aria-hidden
      >
        📒
      </div>
      <div style={{ fontWeight: 700, color: theme.text, marginBottom: 6 }}>
        {title}
      </div>
      <div style={{ color: '#6b7280', marginBottom: cta ? 12 : 0 }}>{subtitle}</div>
      {cta}
    </div>
  );
}

/**
 * MODAL (for delete confirm)
 */
function Modal({ open, title, description, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.35)',
        display: 'grid',
        placeItems: 'center',
        padding: 16,
        zIndex: 50
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: theme.surface,
          color: theme.text,
          borderRadius: 14,
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          width: '100%',
          maxWidth: 420,
          padding: 20,
          border: '1px solid #e5e7eb'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span aria-hidden>⚠️</span>
          <h2 style={{ margin: 0, fontSize: 18 }}>{title}</h2>
        </div>
        <p style={{ marginTop: 8, color: '#6b7280' }}>{description}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
          <button className="btn-ghost" onClick={onCancel}>{cancelText}</button>
          <button className="btn-danger" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

/**
 * ROOT APP
 */
// PUBLIC_INTERFACE
function App() {
  /**
   * This is the root of the Notes app. It uses localStorage for persistence by default.
   * It does not call any backend unless env URLs are set (not used here).
   */
  const { notes, selectedId, setSelectedId, addNote, updateNote, deleteNote } = useLocalStorageNotes();
  const [search, setSearch] = useState('');
  const [showDelete, setShowDelete] = useState(false);

  const selected = useMemo(() => notes.find(n => n.id === selectedId) || null, [notes, selectedId]);

  // Keyboard shortcut: Alt+N to add new note
  useEffect(() => {
    const handler = (e) => {
      if (e.altKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        addNote();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [addNote]);

  const handleAdd = useCallback(() => {
    addNote();
  }, [addNote]);

  const handleTitleChange = useCallback(
    (val) => {
      if (!selected) return;
      updateNote(selected.id, { title: val });
    },
    [selected, updateNote]
  );

  const handleBodyChange = useCallback(
    (val) => {
      if (!selected) return;
      updateNote(selected.id, { body: val });
    },
    [selected, updateNote]
  );

  return (
    <div
      className="App"
      style={{
        background: theme.background,
        color: theme.text,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <style>{`
        .sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
        .btn-primary {
          background: ${theme.primary};
          color: white;
          border: none;
          border-radius: 10px;
          padding: 10px 14px;
          font-weight: 600;
          box-shadow: ${theme.shadow};
          transition: transform .15s ease, box-shadow .15s ease, opacity .15s ease;
          cursor: pointer;
        }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 10px 28px rgba(37,99,235,0.25); }
        .btn-primary:active { transform: translateY(0); }
        .btn-ghost {
          background: transparent;
          color: ${theme.text};
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 8px 12px;
          font-weight: 600;
          transition: background .15s ease, border-color .15s ease;
          cursor: pointer;
        }
        .btn-ghost:hover { background: #f3f4f6; border-color:#d1d5db; }
        .btn-danger {
          background: ${theme.error};
          color: white;
          border: none;
          border-radius: 10px;
          padding: 8px 12px;
          font-weight: 700;
          box-shadow: ${theme.shadow};
          cursor: pointer;
          transition: transform .15s ease, box-shadow .15s ease, opacity .15s ease;
        }
        .btn-danger:hover { transform: translateY(-1px); box-shadow: 0 10px 28px rgba(239,68,68,0.25); }
        .note-item:focus { outline: 2px solid ${theme.primary}; }
        @media (max-width: 900px) {
          .layout { grid-template-columns: 1fr !important; }
          .sidebar { min-height: 40vh; max-height: 50vh; }
        }
        .fab {
          position: fixed;
          right: 24px;
          bottom: 24px;
          background: linear-gradient(135deg, ${theme.primary}, #60a5fa);
          color: white;
          border: none;
          border-radius: 999px;
          padding: 14px 18px;
          box-shadow: 0 16px 32px rgba(37,99,235,0.35);
          font-weight: 800;
          cursor: pointer;
          transition: transform .15s ease, box-shadow .15s ease;
          z-index: 20;
        }
        .fab:hover { transform: translateY(-2px); box-shadow: 0 22px 44px rgba(37,99,235,0.45); }
      `}</style>

      <AppBar onAddNote={handleAdd} />

      <main
        className="layout"
        style={{
          maxWidth: 1280,
          margin: '16px auto',
          width: '100%',
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '360px 1fr',
          gap: 16,
          padding: '0 16px'
        }}
      >
        <div className="sidebar" style={{ borderRadius: 16, overflow: 'hidden' }}>
          <NoteList
            notes={notes}
            selectedId={selectedId}
            onSelect={setSelectedId}
            search={search}
            setSearch={setSearch}
          />
        </div>
        <div
          style={{
            background: theme.surface,
            borderRadius: 16,
            border: '1px solid #e5e7eb',
            boxShadow: theme.shadow,
            minHeight: 420
          }}
        >
          <Editor
            note={selected}
            onTitleChange={handleTitleChange}
            onBodyChange={handleBodyChange}
            onDeleteRequest={() => setShowDelete(true)}
          />
        </div>
      </main>

      {/* Floating Add Button for convenience */}
      <button
        className="fab"
        aria-label="Add new note"
        title="Add new note (Alt+N)"
        onClick={handleAdd}
      >
        + New
      </button>

      <Modal
        open={showDelete}
        title="Delete this note?"
        description="This action cannot be undone. Your note will be permanently removed."
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => setShowDelete(false)}
        onConfirm={() => {
          if (selected) {
            deleteNote(selected.id);
          }
          setShowDelete(false);
        }}
      />
    </div>
  );
}

export default App;
