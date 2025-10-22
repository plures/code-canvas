<script>
  let { send, edge } = $props();
  
  let label = $state(edge?.label || '');
  let kind = $state(edge?.kind || 'implements');

  function handleSave() {
    send({
      type: 'UPDATE_EDGE',
      updates: {
        label,
        kind,
      },
    });
  }

  function handleCancel() {
    send({ type: 'CANCEL' });
  }
</script>

<div class="modal-overlay">
  <div class="modal">
    <h2>Edit Edge</h2>
    <div class="form-group">
      <label for="label">Label</label>
      <input id="label" type="text" bind:value={label} />
    </div>
    
    <div class="form-group">
      <label for="kind">Kind</label>
      <select id="kind" bind:value={kind}>
        <option value="implements">Implements</option>
        <option value="guards">Guards</option>
        <option value="tests">Tests</option>
        <option value="triggers">Triggers</option>
        <option value="docs">Documents</option>
      </select>
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
