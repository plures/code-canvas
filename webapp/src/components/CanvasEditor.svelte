<script>
  import { useMachine } from '@xstate/svelte';
  import { canvasEditorMachine } from '../machines/canvasEditorMachine.js';
  import NodeEditor from './NodeEditor.svelte';
  import EdgeEditor from './EdgeEditor.svelte';

  // Use XState machine - useMachine returns { snapshot, send, actorRef }
  const { snapshot, send } = useMachine(canvasEditorMachine);

  // Svelte 5 runes for reactive state
  let svgElement = $state(null);
  let draggedNode = $state(null);
  let dragOffset = $state({ x: 0, y: 0 });

  // Access context using store subscription ($snapshot is the store value)
  const nodes = $derived($snapshot?.context?.canvas?.nodes || []);
  const edges = $derived($snapshot?.context?.canvas?.edges || []);
  const selectedNodeId = $derived($snapshot?.context?.selectedNodeId);
  const isDirty = $derived($snapshot?.context?.isDirty || false);
  const zoom = $derived($snapshot?.context?.zoom || 1);

  // Node styles based on type
  const NODE_STYLES = {
    box: { fill: '#e1f5fe', stroke: '#01579b' },
    fsm: { fill: '#f3e5f5', stroke: '#4a148c' },
    control: { fill: '#e8f5e8', stroke: '#1b5e20' },
    doc: { fill: '#fff3e0', stroke: '#e65100' },
    database: { fill: '#fce4ec', stroke: '#880e4f' },
  };

  function handleNodeClick(nodeId) {
    send({ type: 'SELECT_NODE', nodeId });
  }

  function handleNodeDragStart(event, node) {
    draggedNode = node;
    const rect = event.target.getBoundingClientRect();
    dragOffset = {
      x: event.clientX - node.x * zoom,
      y: event.clientY - node.y * zoom,
    };
  }

  function handleNodeDrag(event) {
    if (!draggedNode) return;
    
    const newX = Math.round((event.clientX - dragOffset.x) / zoom / 20) * 20;
    const newY = Math.round((event.clientY - dragOffset.y) / zoom / 20) * 20;
    
    send({
      type: 'MOVE_NODE',
      x: newX,
      y: newY,
    });
  }

  function handleNodeDragEnd() {
    draggedNode = null;
  }

  function createNode() {
    const newNode = {
      id: `node-${Date.now()}`,
      type: 'box',
      label: 'New Node',
      x: 100,
      y: 100,
      w: 120,
      h: 60,
    };
    send({ type: 'CREATE_NODE' });
    send({ type: 'ADD_NODE', node: newNode });
  }

  function deleteSelected() {
    if (selectedNodeId) {
      send({ type: 'DELETE_NODE' });
    }
  }

  function handleSave() {
    send({ type: 'SAVE_CANVAS' });
    // TODO: Implement actual save logic
    console.log('Saving canvas:', snapshot.context.canvas);
  }

  function handleZoomIn() {
    send({ type: 'ZOOM_IN' });
  }

  function handleZoomOut() {
    send({ type: 'ZOOM_OUT' });
  }

  // Load demo canvas on mount
  $effect(() => {
    const demoCanvas = {
      nodes: [
        { id: 'fsm1', type: 'fsm', label: 'Lifecycle FSM', x: 100, y: 100, w: 200, h: 100 },
        { id: 'node1', type: 'control', label: 'Canvas Editor', x: 400, y: 100, w: 150, h: 80 },
        { id: 'node2', type: 'doc', label: 'Documentation', x: 250, y: 300, w: 150, h: 80 },
      ],
      edges: [
        { from: 'fsm1', to: 'node1', label: 'controls', kind: 'guards' },
        { from: 'node1', to: 'node2', label: 'documents', kind: 'docs' },
      ],
    };
    send({ type: 'LOAD_CANVAS', canvas: demoCanvas });
  });
</script>

<div class="canvas-editor">
  <div class="toolbar">
    <button onclick={createNode} class="btn">➕ Add Node</button>
    <button onclick={deleteSelected} class="btn" disabled={!selectedNodeId}>🗑️ Delete</button>
    <div class="toolbar-sep"></div>
    <button onclick={handleZoomIn} class="btn">🔍+ Zoom In</button>
    <button onclick={handleZoomOut} class="btn">🔍- Zoom Out</button>
    <span class="zoom-label">{Math.round(zoom * 100)}%</span>
    <div class="toolbar-sep"></div>
    <button onclick={handleSave} class="btn primary" class:dirty={isDirty}>
      💾 Save {isDirty ? '*' : ''}
    </button>
  </div>

  <div class="canvas-viewport">
    <svg
      bind:this={svgElement}
      class="canvas-svg"
      width="1200"
      height="800"
      style:transform="scale({zoom})"
    >
      <!-- Render edges -->
      {#each edges as edge, idx}
        {@const fromNode = nodes.find(n => n.id === edge.from)}
        {@const toNode = nodes.find(n => n.id === edge.to)}
        {#if fromNode && toNode}
          {@const x1 = fromNode.x + (fromNode.w || 120) / 2}
          {@const y1 = fromNode.y + (fromNode.h || 60) / 2}
          {@const x2 = toNode.x + (toNode.w || 120) / 2}
          {@const y2 = toNode.y + (toNode.h || 60) / 2}
          <g class="edge">
            <line
              {x1} {y1} {x2} {y2}
              stroke="#666"
              stroke-width="2"
              marker-end="url(#arrowhead)"
            />
            <text
              x={(x1 + x2) / 2}
              y={(y1 + y2) / 2}
              text-anchor="middle"
              font-size="12"
              fill="#333"
            >
              {edge.label || ''}
            </text>
          </g>
        {/if}
      {/each}

      <!-- Render nodes -->
      {#each nodes as node (node.id)}
        {@const style = NODE_STYLES[node.type] || NODE_STYLES.box}
        {@const isSelected = node.id === selectedNodeId}
        <g
          class="node"
          class:selected={isSelected}
          onclick={() => handleNodeClick(node.id)}
          role="button"
          tabindex="0"
        >
          <rect
            x={node.x}
            y={node.y}
            width={node.w || 120}
            height={node.h || 60}
            fill={style.fill}
            stroke={isSelected ? '#ff6b6b' : style.stroke}
            stroke-width={isSelected ? 3 : 2}
            rx="5"
            class="node-rect"
          />
          <text
            x={node.x + (node.w || 120) / 2}
            y={node.y + (node.h || 60) / 2}
            text-anchor="middle"
            dominant-baseline="middle"
            font-size="14"
            font-weight="600"
            pointer-events="none"
          >
            {node.label}
          </text>
        </g>
      {/each}

      <!-- Arrow marker definition -->
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 10 3, 0 6" fill="#666" />
        </marker>
      </defs>
    </svg>
  </div>

  {#if snapshot.value === 'editingNode'}
    <NodeEditor {send} node={nodes.find(n => n.id === selectedNodeId)} />
  {/if}

  {#if snapshot.value === 'editingEdge'}
    <EdgeEditor {send} edge={edges[selectedNodeId]} />
  {/if}
</div>

<style>
  .canvas-editor {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: #1e1e1e;
    color: #d4d4d4;
  }

  .toolbar {
    padding: 12px;
    background: #2d2d30;
    border-bottom: 1px solid #3e3e42;
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .btn {
    padding: 8px 12px;
    border: 1px solid #464647;
    background: #3e3e42;
    color: #d4d4d4;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.2s;
  }

  .btn:hover:not(:disabled) {
    background: #505052;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn.primary {
    background: #0e639c;
    border-color: #0e639c;
  }

  .btn.primary:hover {
    background: #1177bb;
  }

  .btn.dirty {
    background: #c27c0e;
    border-color: #c27c0e;
  }

  .toolbar-sep {
    width: 1px;
    height: 24px;
    background: #464647;
    margin: 0 4px;
  }

  .zoom-label {
    font-size: 12px;
    color: #d4d4d4;
    margin-left: 4px;
  }

  .canvas-viewport {
    flex: 1;
    overflow: auto;
    background: #252526;
    padding: 20px;
  }

  .canvas-svg {
    background: white;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    transform-origin: top left;
  }

  .node {
    cursor: pointer;
  }

  .node.selected .node-rect {
    filter: drop-shadow(0 0 8px rgba(255, 107, 107, 0.5));
  }

  .edge line {
    cursor: pointer;
  }

  .edge:hover line {
    stroke-width: 3;
  }
</style>
