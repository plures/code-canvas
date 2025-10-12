# JSON Canvas Compatibility Tests

## Test: Format Detection

**Given** a JSON Canvas file with standard properties:

```json
{
  "nodes": [
    {
      "id": "node1",
      "type": "text", 
      "text": "Sample",
      "x": 0,
      "y": 0,
      "width": 120,
      "height": 60
    }
  ],
  "edges": []
}
```

**When** calling `detectFormat(content)`  
**Then** should return `"json-canvas"`

## Test: Property Aliasing

**Given** a node with JSON Canvas properties:

```javascript
const node = {
  id: "test",
  x: 100, 
  y: 200,
  width: 150,
  height: 80
}
```

**When** accessing `node.w || node.width || 120`  
**Then** should return `150`

**When** accessing `node.h || node.height || 60`  
**Then** should return `80`

## Test: Drag-and-Drop Text Positioning

**Given** a JSON Canvas node being dragged
**When** `updateNodePosition()` is called  
**Then** text element should be positioned at center with proper fallbacks:
- `textX = x + (w || width || 120) / 2`
- `textY = y + (h || height || 60) / 2 + 5`

## Test: Bi-directional Conversion

**Given** YAML Canvas with `w/h` properties  
**When** converting with `toJSONCanvas()`  
**Then** should produce JSON Canvas with `width/height` properties

**Given** JSON Canvas with `width/height` properties  
**When** converting with `fromJSONCanvas()`  
**Then** should produce YAML Canvas with `w/h` properties

## Integration Test: Interactive Editor

**Given** canvas server running with JSON Canvas file  
**When** dragging a node in the browser  
**Then:**

- Node rectangle should move to new position
- Text label should follow and remain centered using width/height properties
- No NaN values in console logs (fixed property aliasing)
- Position updates should be saved via API
- Both w/h and width/height property formats work correctly

## Test: Canvas Server V2 Features

**Given** canvas-server-v2.ts with dual format support  
**When** starting server with --file flag  
**Then:**

- Auto-detects YAML vs JSON Canvas format
- Drag-and-drop works with both property formats
- Text positioning uses proper width/height fallbacks
- API endpoints handle both node formats

**Status:** ✅ All tests pass based on browser testing and console log verification
