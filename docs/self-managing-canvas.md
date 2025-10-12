# Self-Managing Design Canvas

The Self-Managing Design Canvas is a revolutionary approach to software architecture visualization and management. It creates a living, interactive representation of your application that serves as both documentation and a control interface.

## Core Concept

The canvas displays your application's architecture visually, where each node represents a component (FSM, control system, database, etc.) and edges show relationships. What makes it "self-managing" is that:

1. **The canvas manages itself** - The architecture canvas includes a node representing itself
2. **Drill-down capability** - Click any component to dive into its implementation or sub-canvas
3. **Direct editing** - Modify the canvas to change how the application behaves
4. **Team collaboration** - Multiple humans and AI assistants can work together visually

## Key Features

### Visual Architecture Management

- **Component Nodes**: FSM states, controls, databases, documents, files
- **Relationship Edges**: Triggers, guards, implementations, tests, documentation
- **Type-specific Styling**: Each node type has distinct visual appearance
- **Drill-down Indicators**: Blue icons show which nodes can be explored further

### Interactive Navigation

- **Navigation Stack**: Breadcrumb trail showing current location in architecture
- **Back Button**: Return to previous canvas level
- **Sidebar Navigation**: Click any level to jump directly there

### Multi-Modal Editing

- **Canvas View**: Visual drag-and-drop editing of architecture with grid snapping
- **Interactive Selection**: Click nodes/edges to select, double-click to drill down
- **Real-time Dragging**: Move nodes with live edge updates and position feedback
- **File View**: Direct code/config editing in embedded viewer
- **VS Code Integration**: Open files directly in your editor

### Self-Reference Loop

The architecture canvas contains a node representing itself (`meta-canvas`), creating a self-referential system where the design tool is part of the design it manages.

## Usage Patterns

### For Development Teams

```bash
# Start the self-managing canvas
deno task self-managing-canvas --port 8083

# Open in browser
http://localhost:8083
```

1. **High-level Overview**: See entire application architecture at a glance
2. **Component Exploration**: Drill down into specific systems
3. **Direct Editing**: Modify components from the visual interface
4. **Collaborative Design**: Multiple team members can work on the same canvas

### For AI Assistants

AI assistants can:

- **Read Architecture**: Understand system design from visual canvas
- **Suggest Changes**: Recommend architectural improvements
- **Update Design**: Modify canvas to reflect code changes
- **Explain Systems**: Use visual representation to explain functionality

### For Human Developers

Humans can:

- **Visual Understanding**: Quickly grasp complex system relationships
- **Design Planning**: Sketch out new features visually first
- **Code Navigation**: Jump directly to implementation files
- **Documentation**: Keep design docs synchronized with code

## Node Types and Drill-Down Patterns

### FSM Nodes (`type: "fsm"`)
- **Visual**: Purple border, FSM icon
- **Drill-down**: Link to lifecycle canvas or state machine definition
- **Use case**: State management, workflow control

### Control Nodes (`type: "control"`)
- **Visual**: Green border, control icon  
- **Drill-down**: Link to implementation file or control sub-canvas
- **Use case**: Services, APIs, UI components

### Database Nodes (`type: "database"`)
- **Visual**: Pink border, database icon
- **Drill-down**: Schema definition or admin interface
- **Use case**: Data storage, configuration

### Document Nodes (`type: "doc"`)
- **Visual**: Orange border, document icon
- **Drill-down**: Canvas files, design documents
- **Use case**: Design specs, documentation

## Self-Management Capabilities

### Architecture Reflection

The canvas maintains a real-time reflection of the application architecture:

```yaml
# Example: Guardian node reflects actual guardian.ts
- id: guardian
  type: control
  label: Guardian
  ref: "tools/guardian.ts"
  props:
    description: "FSM validation and rules engine"
    drillDown: "file"
```

### Behavior Modification

Changing the canvas can trigger changes in application behavior:

- **Add Node**: Creates new component scaffolding
- **Modify Edge**: Updates relationship/dependency
- **Change Properties**: Modifies component configuration
- **Remove Node**: Safely decommissions component

### Collaborative Intelligence

The system enables human-AI collaboration:

1. **Shared Visual Language**: Both humans and AI understand the canvas
2. **Real-time Updates**: Changes are immediately visible to all participants  
3. **Context Preservation**: Navigation history shows decision path
4. **Design Rationale**: Visual relationships explain architectural decisions

## Integration with Code Canvas FSM

The self-managing canvas integrates with the existing Code Canvas FSM system:

- **Activity Awareness**: Respects current FSM state (design/implementation/release)
- **Rule Enforcement**: Canvas changes trigger guardian validation
- **Lifecycle Management**: Canvas modifications follow allowed paths
- **History Tracking**: Navigation and changes logged in FSM history

## Future Enhancements

- **Real-time Collaboration**: Multiple simultaneous editors
- **AI Suggestions**: Automatic architectural improvement recommendations
- **Code Generation**: Generate scaffolding from canvas design

## Getting Started

1. **Start Server**: `deno task self-managing-canvas`
2. **Open Browser**: Navigate to `http://localhost:8083`
3. **Explore Architecture**: Click around the canvas to understand the system
4. **Drill Down**: Click blue drill-down icons to explore components
5. **Make Changes**: Edit nodes and edges to modify architecture
6. **Save Changes**: Click Save button to persist changes

## Interactive Features

### Node Selection and Editing
```bash
# Click any node to select it
- Selected nodes show blue outline
- Selection info appears in right sidebar
- Shows node type, position, size, and reference

# Drag nodes to move them
- Click and drag any node to reposition
- Automatically snaps to 20px grid
- Connected edges update in real-time
- Position changes shown in status bar
```

### Edge Interaction
```bash
# Click edges to select them
- Selected edges show blue highlight
- Edge info appears in sidebar
- Hover over edges for visual feedback

# Edge types show different styles:
- Solid lines: implements relationship
- Dashed lines: guards, triggers, tests, docs
```

### Drill-Down Navigation
```bash
# Click drill-down icons (blue circles with ↓)
- Shows component panel with options
- "View File" opens in embedded viewer
- "Edit in VS Code" launches external editor
- "Open Canvas" navigates to sub-canvas

# Double-click nodes for quick drill-down
- Files open in viewer modal
- Canvas files navigate to new canvas
- Navigation breadcrumb shows path
```

The self-managing canvas represents a new paradigm in software development where the design tool becomes part of the system it manages, creating a truly integrated development experience.