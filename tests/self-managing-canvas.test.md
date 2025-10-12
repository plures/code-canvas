# Self-Managing Canvas Tests

## Test: Architecture Canvas Loading

**Given** the code-canvas-architecture.canvas.yaml file exists  
**When** starting the self-managing canvas server  
**Then:**

- Server should load on specified port
- Canvas should display all core components (guardian, fsm-manager, canvas-server, etc.)
- Each node should have drill-down indicators where applicable
- Navigation breadcrumb should show current canvas name

## Test: Drill-Down Functionality

**Given** a node with `ref` property and `drillDown` type  
**When** clicking the drill-down icon  
**Then:**

- Should show drill-down panel with component info
- Panel should display description from `props.description`
- Should offer appropriate action based on `drillDown` type:
  - "canvas": Open Canvas button
  - "file": View File and Edit in VS Code buttons

## Test: Canvas Navigation

**Given** a node with `drillDown: "canvas"`  
**When** selecting "Open Canvas" from drill-down panel  
**Then:**

- Should navigate to referenced canvas file
- Navigation stack should update in sidebar
- Breadcrumb should show navigation path
- Back button should become visible

## Test: File Viewing

**Given** a node with `drillDown: "file"`  
**When** selecting "View File" from drill-down panel  
**Then:**

- File viewer modal should open
- Should display file content in monospace font
- File path should be shown in modal header
- Close button should hide the modal

## Test: Self-Reference Loop

**Given** the meta-canvas node in architecture canvas  
**When** drilling down into itself  
**Then:**

- Should reload the same canvas (self-reference)
- Navigation should handle circular reference gracefully
- No infinite loops should occur

## Test: VS Code Integration

**Given** a file reference node  
**When** clicking "Edit in VS Code"  
**Then:**

- Should attempt to open file in VS Code via `code` command
- Status message should confirm action
- Drill-down panel should close

## Test: API Endpoints

**Given** self-managing canvas server running  
**When** making API requests  
**Then:**

- `/api/canvas?file=<name>` returns canvas JSON data
- `/api/render?file=<name>` returns SVG content
- `/api/file?path=<path>` returns file text content
- `/api/edit-file` (POST) triggers VS Code opening

## Integration Test: Team Workflow

**Given** team member opens architecture canvas  
**When** exploring the application design  
**Then:**

- Can visually understand overall architecture
- Can drill down into specific components
- Can edit files directly from canvas
- Changes to canvas reflect in application behavior
- Multiple team members can collaborate on visual design