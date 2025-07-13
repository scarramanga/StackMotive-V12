
# StackMotive Build Rules — Non-Negotiables

## 1. No Placeholder or Mock Data  
- No `TODO:` comments, no `mock*` imports, no `console.log("fake data")`.  
- If real data is unavailable:
  - Use hard-coded realistic values **only if defined in the block plan**.
  - Or render a fallback `null`, `loading`, or empty state with explicit placeholder markup (e.g., `ComingSoon` component).
- Mocking is never default — only allowed if explicitly approved.

## 2. Real, Connected Data or Clearly Defined Stub  
- All logic must be wired to:
  - Actual API calls (if available)
  - Zustand or Supabase-backed state
  - Or clearly defined static objects
- No assumed props or imaginary sources.

## 3. SSR-Safe and Mobile-First by Default  
- Components must:
  - Avoid `window`, `document`, `localStorage` unless guarded
  - Render cleanly on both server and client
  - Use Tailwind or utility CSS to ensure mobile responsiveness by default

## 4. Fully Typed (TypeScript)  
- No `any` unless absolutely unavoidable and justified
- All props, state, hooks, utilities must be fully typed
- Interfaces or types must be shared across layers (engine, UI, hooks)

## 5. Use Zustand and Supabase Auth  
- All session, auth, or user state must go through:
  - `useSessionStore`, `usePortfolioStore`, etc.
  - Supabase for auth state and persistence
- No legacy context, redux, or temporary stores allowed

## 6. Block Implementation Must Match Canonical Markdown  
- Block number = GitHub Issue number:  
  - Block 1 = #189  
  - Block 2 = #190  
  - Block 3 = #191  
  - …and so on  
- This mapping must be enforced in commit messages and GitHub workflow.

## 7. Prompt Format for Cursor is Locked  
- All development prompts must follow the verified format with:
  - Bullet-point breakdown of plan
  - Code examples using triple-backtick formatting
  - Commit instructions at the end in code block
- No Markdown fluff, no visual styling experiments.

## 8. Every Block Must Auto-Close Its GitHub Issue  
- Final commit message must include:
  ```
  Closes #XYZ
  ```
- This allows automatic closure and clean audit trail on GitHub.
