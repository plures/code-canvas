<script>
  let { send, node } = $props();
  
  let label = $state(node?.label || '');
  let type = $state(node?.type || 'box');
  let width = $state(node?.w || 120);
  let height = $state(node?.h || 60);

  function handleSave() {
    send({
      type: 'UPDATE_NODE',
      updates: {
        label,
        type,
        w: width,
        h: height,
      },
    });
  }

  function handleCancel() {
    send({ type: 'CANCEL' });
  }
</script>

<div class="modal-overlay">
  <div class="modal">
    <h2>Edit Node</h2>
    <div class="form-group">
      <label for="label">Label</label>
      <input id="label" type="text" bind:value={label} />
    </div>
    
    <div class="form-group">
      <label for="type">Type</label>
      <select id="type" bind:value={type}>
        <option value="box">Box</option>
        <option value="fsm">FSM</option>
        <option value="control">Control</option>
        <option value="doc">Document</option>
        <option value="database">Database</option>
      </select>
    </div>

    <div class="form-group">
      <label for="width">Width</label>
      <input id="width" type="number" bind:value={width} min="60" step="20" />
    </div>

    <div class="form-group">
      <label for="height">Height</label>
      <input id="height" type="number" bind:value={height} min="40" step="20" />
    </div>

    <div class="modal-actions">
      <button onclick={handleCancel} class="btn">Cancel</button>
      <button onclick={handleSave} class="btn primary">Save</button>
    </div>
  </div>
</div>

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal {
    background: #2d2d30;
    border: 1px solid #3e3e42;
    border-radius: 8px;
    padding: 24px;
    min-width: 400px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  }

  h2 {
    margin: 0 0 16px 0;
    font-size: 18px;
    color: #d4d4d4;
  }

  .form-group {
    margin-bottom: 16px;
  }

  label {
    display: block;
    margin-bottom: 4px;
    font-size: 12px;
    color: #d4d4d4;
  }

  input,
  select {
    width: 100%;
    padding: 8px;
    background: #3c3c3c;
    border: 1px solid #464647;
    border-radius: 4px;
    color: #d4d4d4;
    font-size: 14px;
  }

  input:focus,
  select:focus {
    outline: none;
    border-color: #0e639c;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 20px;
  }

  .btn {
    padding: 8px 16px;
    border: 1px solid #464647;
    background: #3e3e42;
    color: #d4d4d4;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
  }

  .btn:hover {
    background: #505052;
  }

  .btn.primary {
    background: #0e639c;
    border-color: #0e639c;
  }

  .btn.primary:hover {
    background: #1177bb;
  }
</style>
