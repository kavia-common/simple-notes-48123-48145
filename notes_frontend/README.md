# Ocean Notes - Simple Notes App

A modern, responsive notes app built with React using the Ocean Professional theme. Notes are stored locally in your browser (localStorage) and persist across refreshes.

## Features
- Create, view, edit, and delete notes
- Local persistence via `localStorage`
- Notes list with search filter and sort by last updated (desc)
- Inline editing with title and body fields
- Delete confirmation modal
- Keyboard shortcut: Alt+N (Add new note)
- Ocean Professional theme: blue accents, subtle shadows, rounded corners

## Getting Started
In the project directory:
- `npm start` — start the development server (http://localhost:3000)
- `npm test` — run tests
- `npm run build` — build for production

No external backend is required. If environment variables like `REACT_APP_API_BASE` are present, they are ignored for this local app (no network calls are made).
