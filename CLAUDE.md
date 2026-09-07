# talma_monday_focus_areas_dashboard

Vercel app that shows Work Plan tasks across all department boards, filtered by Focus Area.

## What it does

- `GET /api/data` — loads tasks from every department board (Timeline, Status, Focus Areas, etc.)
- `POST /api/update-task` — updates Status / Timeline on a task from the UI
- `index.html` — front-end dashboard (Focus Areas × departments, Gantt, filters)

## Stack

- Static `index.html` + Node serverless API routes
- monday.com GraphQL API (v2024-10)

## Environment variables

- `MONDAY_API_TOKEN` — read/write access to all department boards

## Deployment

Vercel project: `monday-dashboard`  
URL: `https://monday-dashboard-cyan.vercel.app`

## Boards (Workspace: "Work Plan", id 5841490)

All **10** department task boards — Marketing, Projects, and Management included. Listed in [`api/data.js`](api/data.js) `BOARDS`:

| Board | ID |
|-------|-----|
| Full Year | `5094162683` |
| Technology | `5094574505` |
| Resource Development - Israel (board name: Resources - Israel) | `5094576859` |
| H.R | `5094580197` |
| Pedagogy | `5094581545` |
| Resources - USA | `5094583693` |
| Finance | `5094585976` |
| Projects | `5100890169` |
| Marketing | `5100889995` |
| Management | `5102164086` |

When adding a new department board, append it to `BOARDS` in `api/data.js` and redeploy.

## Related projects

- `monday-quarter-sync` — Quarter from Timeline
- `monday-recurrence` — recurring task generation
