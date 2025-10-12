# JSON Canvas Compatibility

Code Canvas now provides full compatibility with the JSON Canvas 1.0 standard, enabling seamless interoperability with tools like Obsidian Canvas.

## Supported Features

### Node Types

- **text**: Basic text nodes with labels
- **file**: File attachment nodes with references
- **link**: URL link nodes with external references  
- **group**: Container nodes for organizing content
- **box**: Legacy YAML Canvas node type (maintained for compatibility)

### Property Formats

The system supports both property formats:

- **JSON Canvas standard**: `width`, `height`, `fromNode`, `toNode`
- **YAML Canvas legacy**: `w`, `h`, `from`, `to`

### Drag-and-Drop Editing

- Full interactive editing with 20px grid snapping
- Real-time text label positioning
- Property-agnostic calculations supporting both formats
- Live edge updates during node movement

## Usage Examples

### Interactive Editing

```bash
# Start canvas editor with JSON Canvas file
deno run -A tools/canvas-server-v2.ts --file my-canvas.canvas --port 8080

# Edit canvas in browser at http://localhost:8080
# - Drag nodes to reposition
# - Text labels follow automatically
# - Changes saved via REST API
```

### Format Conversion
```bash
# Convert YAML Canvas to JSON Canvas
deno run -A tools/enhanced-cli.ts render --format json input.canvas.yaml

# Convert JSON Canvas to YAML Canvas  
deno run -A tools/enhanced-cli.ts render --format yaml input.canvas

# Auto-detect format and render as SVG
deno run -A tools/enhanced-cli.ts render input.canvas
```

### Programmatic Usage
```typescript
import { detectFormat, toJSONCanvas, fromJSONCanvas } from './tools/jsoncanvas-compat.ts';

// Load any canvas format
const content = await Deno.readTextFile('canvas.file');
const format = detectFormat(content);
const canvas = format === 'json-canvas' 
  ? JSON.parse(content)
  : yaml.parse(content);

// Convert between formats
const jsonCanvas = toJSONCanvas(canvas);
const yamlCanvas = fromJSONCanvas(jsonCanvas);
```

## Compatibility Notes

- JSON Canvas files use `.canvas` extension
- YAML Canvas files use `.canvas.yaml` extension
- Property aliasing ensures backward compatibility
- All existing YAML Canvas features remain functional
- Enhanced rendering supports both formats natively