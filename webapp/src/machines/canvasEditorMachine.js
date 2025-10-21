import { createMachine, assign } from 'xstate';

/**
 * Canvas Editor FSM Machine
 * Manages the state of the canvas editor including selection, editing, and operations
 */
export const canvasEditorMachine = createMachine({
  id: 'canvasEditor',
  initial: 'idle',
  context: {
    canvas: { nodes: [], edges: [] },
    selectedNodeId: null,
    selectedEdgeId: null,
    clipboard: null,
    isDirty: false,
    zoom: 1,
    panX: 0,
    panY: 0,
  },
  states: {
    idle: {
      on: {
        SELECT_NODE: {
          actions: assign({
            selectedNodeId: ({ event }) => event.nodeId,
            selectedEdgeId: null,
          }),
          target: 'nodeSelected',
        },
        SELECT_EDGE: {
          actions: assign({
            selectedEdgeId: ({ event }) => event.edgeId,
            selectedNodeId: null,
          }),
          target: 'edgeSelected',
        },
        CREATE_NODE: {
          target: 'creatingNode',
        },
        CREATE_EDGE: {
          target: 'creatingEdge',
        },
        LOAD_CANVAS: {
          actions: assign({
            canvas: ({ event }) => event.canvas,
            isDirty: false,
          }),
        },
      },
    },
    nodeSelected: {
      on: {
        DESELECT: {
          actions: assign({ selectedNodeId: null }),
          target: 'idle',
        },
        EDIT_NODE: {
          target: 'editingNode',
        },
        DELETE_NODE: {
          actions: assign({
            canvas: ({ context }) => ({
              nodes: context.canvas.nodes.filter(n => n.id !== context.selectedNodeId),
              edges: context.canvas.edges.filter(
                e => e.from !== context.selectedNodeId && e.to !== context.selectedNodeId
              ),
            }),
            selectedNodeId: null,
            isDirty: true,
          }),
          target: 'idle',
        },
        MOVE_NODE: {
          actions: assign({
            canvas: ({ context, event }) => ({
              ...context.canvas,
              nodes: context.canvas.nodes.map(node =>
                node.id === context.selectedNodeId
                  ? { ...node, x: event.x, y: event.y }
                  : node
              ),
            }),
            isDirty: true,
          }),
        },
        RESIZE_NODE: {
          actions: assign({
            canvas: ({ context, event }) => ({
              ...context.canvas,
              nodes: context.canvas.nodes.map(node =>
                node.id === context.selectedNodeId
                  ? { ...node, w: event.width, h: event.height }
                  : node
              ),
            }),
            isDirty: true,
          }),
        },
      },
    },
    edgeSelected: {
      on: {
        DESELECT: {
          actions: assign({ selectedEdgeId: null }),
          target: 'idle',
        },
        EDIT_EDGE: {
          target: 'editingEdge',
        },
        DELETE_EDGE: {
          actions: assign({
            canvas: ({ context }) => ({
              ...context.canvas,
              edges: context.canvas.edges.filter(
                (e, idx) => idx !== context.selectedEdgeId
              ),
            }),
            selectedEdgeId: null,
            isDirty: true,
          }),
          target: 'idle',
        },
      },
    },
    creatingNode: {
      on: {
        ADD_NODE: {
          actions: assign({
            canvas: ({ context, event }) => ({
              ...context.canvas,
              nodes: [...context.canvas.nodes, event.node],
            }),
            isDirty: true,
          }),
          target: 'idle',
        },
        CANCEL: {
          target: 'idle',
        },
      },
    },
    creatingEdge: {
      on: {
        ADD_EDGE: {
          actions: assign({
            canvas: ({ context, event }) => ({
              ...context.canvas,
              edges: [...context.canvas.edges, event.edge],
            }),
            isDirty: true,
          }),
          target: 'idle',
        },
        CANCEL: {
          target: 'idle',
        },
      },
    },
    editingNode: {
      on: {
        UPDATE_NODE: {
          actions: assign({
            canvas: ({ context, event }) => ({
              ...context.canvas,
              nodes: context.canvas.nodes.map(node =>
                node.id === context.selectedNodeId
                  ? { ...node, ...event.updates }
                  : node
              ),
            }),
            isDirty: true,
          }),
          target: 'nodeSelected',
        },
        CANCEL: {
          target: 'nodeSelected',
        },
      },
    },
    editingEdge: {
      on: {
        UPDATE_EDGE: {
          actions: assign({
            canvas: ({ context, event }) => ({
              ...context.canvas,
              edges: context.canvas.edges.map((edge, idx) =>
                idx === context.selectedEdgeId
                  ? { ...edge, ...event.updates }
                  : edge
              ),
            }),
            isDirty: true,
          }),
          target: 'edgeSelected',
        },
        CANCEL: {
          target: 'edgeSelected',
        },
      },
    },
  },
  on: {
    SAVE_CANVAS: {
      actions: assign({ isDirty: false }),
    },
    ZOOM_IN: {
      actions: assign({
        zoom: ({ context }) => Math.min(context.zoom * 1.2, 3),
      }),
    },
    ZOOM_OUT: {
      actions: assign({
        zoom: ({ context }) => Math.max(context.zoom / 1.2, 0.1),
      }),
    },
    PAN: {
      actions: assign({
        panX: ({ event }) => event.x,
        panY: ({ event }) => event.y,
      }),
    },
  },
});
