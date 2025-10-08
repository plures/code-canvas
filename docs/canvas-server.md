# Canvas Server Guide

## Overview

Interactive web-based interface for viewing canvas files with live preview.

## Features

- 🎨 Interactive viewer with pan/zoom
- 🔍 Node search and filtering
- 💡 Hover tooltips
- 🎯 Node selection and highlighting
- 🔄 Live reload on file changes
- 💾 SVG export

## Quick Start

```bash
# Start server
deno task canvas serve

# Open browser
http://localhost:8080
```

## Usage

### Basic Commands

```bash
# Default canvas
deno task canvas serve

# Specific file
deno task canvas serve --file auth-example.canvas.yaml

# Custom port
deno task canvas serve --port 3000
```

### Interactive Controls

**Toolbar:**

- 🔍 Zoom In/Out - Adjust canvas size
- ↻ Reset - Return to original view
- ⛶ Fit - Auto-fit to screen
- 💾 Download - Export SVG

**Node Interaction:**

- **Click** - Select and highlight
- **Hover** - View tooltip
- **Search** - Filter by name/ID

## Interface

```text
┌────────────────────────────────────┐
│ Header: Canvas Server | Live       │
├───────────────┬────────────────────┤
│ Canvas Viewer │ Info Panel         │
│ [Toolbar]     │ - Search           │
│ [SVG]         │ - Nodes            │
│               │ - Details          │
├───────────────┴────────────────────┤
│ Status: Ready | X nodes            │
└────────────────────────────────────┘
```

## Development Workflow

1. Start server: `deno task canvas serve`
2. Edit canvas YAML in your editor
3. Browser auto-refreshes on save
4. Iterate quickly on design

## Advanced Options

```bash
# Multiple ports
deno task canvas serve -f demo.yaml -p 8080
deno task canvas serve -f auth.yaml -p 8081

# Disable watch
deno task canvas serve --no-watch
```

## Troubleshooting

**Port in use:** Try different port with `--port`

**File not found:** Ensure file exists in `sot/canvas/`

**No auto-reload:** Verify watch mode enabled

## API Endpoints

- `GET /` - Canvas viewer
- `GET /api/status` - Server status

## Tips

- Use multi-monitor for editing while viewing
- Dark mode built-in for comfortable viewing
- Responsive design for different screens
- Fast iteration with live updates

## Next Steps

- Add in-browser YAML editor
- Implement drag-and-drop positioning
- Export to PNG/PDF
- Collaboration features
