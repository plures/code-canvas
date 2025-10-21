import { describe, it, expect } from 'vitest';
import { createActor } from 'xstate';
import { canvasEditorMachine } from '../src/machines/canvasEditorMachine.js';

describe('Canvas Editor Machine', () => {
  it('starts in idle state', () => {
    const actor = createActor(canvasEditorMachine);
    actor.start();
    
    expect(actor.getSnapshot().value).toBe('idle');
  });

  it('transitions to nodeSelected when SELECT_NODE is sent', () => {
    const actor = createActor(canvasEditorMachine);
    actor.start();
    
    actor.send({ type: 'SELECT_NODE', nodeId: 'test-node' });
    
    expect(actor.getSnapshot().value).toBe('nodeSelected');
    expect(actor.getSnapshot().context.selectedNodeId).toBe('test-node');
  });

  it('loads canvas data with LOAD_CANVAS event', () => {
    const actor = createActor(canvasEditorMachine);
    actor.start();
    
    const testCanvas = {
      nodes: [{ id: 'node1', x: 100, y: 100 }],
      edges: []
    };
    
    actor.send({ type: 'LOAD_CANVAS', canvas: testCanvas });
    
    expect(actor.getSnapshot().context.canvas.nodes).toHaveLength(1);
    expect(actor.getSnapshot().context.canvas.nodes[0].id).toBe('node1');
  });

  it('moves node with MOVE_NODE event', () => {
    const actor = createActor(canvasEditorMachine);
    actor.start();
    
    // Load initial canvas
    actor.send({
      type: 'LOAD_CANVAS',
      canvas: {
        nodes: [{ id: 'node1', x: 100, y: 100 }],
        edges: []
      }
    });
    
    // Select node
    actor.send({ type: 'SELECT_NODE', nodeId: 'node1' });
    
    // Move node
    actor.send({ type: 'MOVE_NODE', x: 200, y: 200 });
    
    const movedNode = actor.getSnapshot().context.canvas.nodes[0];
    expect(movedNode.x).toBe(200);
    expect(movedNode.y).toBe(200);
    expect(actor.getSnapshot().context.isDirty).toBe(true);
  });

  it('deletes node with DELETE_NODE event', () => {
    const actor = createActor(canvasEditorMachine);
    actor.start();
    
    // Load initial canvas
    actor.send({
      type: 'LOAD_CANVAS',
      canvas: {
        nodes: [{ id: 'node1', x: 100, y: 100 }],
        edges: [{ from: 'node1', to: 'node2' }]
      }
    });
    
    // Select and delete node
    actor.send({ type: 'SELECT_NODE', nodeId: 'node1' });
    actor.send({ type: 'DELETE_NODE' });
    
    expect(actor.getSnapshot().context.canvas.nodes).toHaveLength(0);
    expect(actor.getSnapshot().context.canvas.edges).toHaveLength(0);
    expect(actor.getSnapshot().value).toBe('idle');
  });
});
