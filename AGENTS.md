<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Environment variables

Whenever you add code that reads a new `process.env.X`, add `X=` to `.env` in the same change (empty value — never fill in real secrets yourself). This keeps `.env` a complete, accurate list of every env var the app actually needs, so setting up a new environment (staging, production) is just "fill in the blanks" instead of hunting through the codebase.
