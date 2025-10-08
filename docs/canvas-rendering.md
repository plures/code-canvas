# Canvas Rendering Engine

The Canvas Rendering Engine transforms YAML canvas definitions into rich visual representations.

## Features

### 🎨 Visual Node Types
- **FSM**: Finite State Machine components with special state indicators
- **Control**: UI components and interactive elements  
- **Database**: Data storage and persistence layers
- **Box**: Generic components and services
- **Doc**: Documentation and design specifications

### 🔗 Edge Relationships
- **Implements**: Orange solid lines (design → code)
- **Guards**: Blue dashed lines (FSM constraints)
- **Triggers**: Red dashed lines (event flows)
- **Tests**: Green dashed lines (test coverage)
- **Docs**: Purple dashed lines (documentation links)

### 📁 Output Formats
- **SVG**: Scalable vector graphics for embedding
- **HTML**: Interactive web pages with zoom controls

## Usage

```bash
# Render single canvas
deno task render-canvas sot/canvas/demo.canvas.yaml output

# Render all canvas files
deno task render-all output

# Direct usage
deno run -A tools/canvas-renderer.ts sot/canvas/demo.canvas.yaml output
```

## Canvas YAML Structure

```yaml
nodes:
  - id: unique-identifier
    type: fsm|control|database|box|doc
    label: Display Name
    x: 100        # X coordinate
    y: 50         # Y coordinate  
    w: 200        # Width
    h: 80         # Height
    ref: path/to/file.ext  # Optional file reference
    props:        # Optional properties
      key: value

edges:
  - from: source-node-id
    to: target-node-id
    kind: implements|guards|triggers|tests|docs
    label: Edge Description  # Optional
```

## Interactive Features

The generated HTML files include:
- **Zoom Controls**: In/Out/Reset zoom functionality
- **Clickable Nodes**: Console logging for integration potential
- **Download**: Export SVG directly from browser
- **Responsive**: Adapts to different screen sizes

## Integration Points

- **VS Code**: Could open referenced files on node click
- **Git Hooks**: Validate canvas files before commit
- **CI/CD**: Generate visual documentation automatically
- **Documentation**: Embed SVG in markdown files

## Visual Styling

Each node type has distinct colors and styling:
- FSM nodes have thick purple borders and state indicators
- Control nodes are green (interactive elements)
- Database nodes are pink (data persistence)
- Doc nodes are orange (documentation)
- Box nodes are blue (generic components)

Edge styles vary by relationship type to show different architectural concerns at a glance.