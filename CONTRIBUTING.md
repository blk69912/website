# Contributing

Thanks for helping. Keep changes small and focused; one idea per pull request.

## Setup

```bash
npm install
npm run dev
```

Before you open a pull request, run:

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

## Adding to the directory

Add one line to `data/directory.json` with `repo` (`owner/name`) and `category` (`mcp`, `skills`, or `agent-ready-web`). A weekly workflow fills in stars and descriptions, so you do not need to edit `data/directory.generated.json`.

Projects should be open source, maintained, and clearly about agents.

## Adding a tool

1. Write the logic as a pure function in `src/lib/`, with no DOM or network access.
2. Add tests in `tests/`.
3. Add a client component in `src/components/tools/` and a page in `src/app/tools/<name>/`.
4. Register the page in `src/content/site.ts` so it appears in the navigation, sitemap, `llms.txt`, and Markdown twins.

## Writing style

Interface copy is plain, sentence case, and says what happens. Errors say what went wrong and how to fix it.
