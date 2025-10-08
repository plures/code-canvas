# Code Canvas MVP Roadmap Checklist

## 📋 Project Overview
**Code Canvas** is an AI Guardrails Kit that provides:
- Single Source of Truth (SoT) management
- FSM-controlled project lifecycle enforcement
- Pre-commit validation via guardian
- YAML-based canvas for visual design documentation
- Agent behavior contracts and constraints

---

## 🎯 MVP Core Features

### ✅ **Foundation (Currently Complete)**
- [x] Basic project structure with `sot/` directory
- [x] FSM lifecycle definition in `lifecycle.yaml`
- [x] Guardian pre-commit hook implementation
- [x] Basic task runner with Deno
- [x] YAML canvas schema definition
- [x] Agent contract template

### 🔄 **Phase 1: Core Validation & FSM (In Progress)**
- [ ] **Enhanced Guardian Validation**
  - [ ] Improve path matching logic for complex glob patterns
  - [ ] Add better error messages with suggestions
  - [ ] Validate YAML schema compliance for SoT files
  - [ ] Add dry-run mode for testing changes
  - [x] Fix Windows compatibility for file permissions

- [ ] **FSM Transition Logic**
  - [ ] Implement guard condition evaluation
  - [ ] Add transition validation before state changes
  - [ ] Create state transition history logging
  - [ ] Add rollback capability for failed transitions

- [ ] **Configuration Management**
  - [ ] Validate all YAML schemas on startup
  - [ ] Add configuration validation command
  - [ ] Create schema validation for lifecycle.yaml
  - [ ] Add rules.yaml implementation

### 🚀 **Phase 2: Canvas & Visualization**
- [ ] **Canvas Rendering Engine**
  - [ ] Create basic canvas renderer (HTML/SVG output)
  - [ ] Implement node positioning and edge routing
  - [ ] Add support for different node types (fsm, control, doc)
  - [ ] Create interactive canvas viewer

- [ ] **Canvas Editor**
  - [ ] YAML canvas editor with live preview
  - [ ] Drag-and-drop node positioning
  - [ ] Visual edge connection interface
  - [ ] Reference validation for node.ref paths

### 🔧 **Phase 3: Developer Experience**
- [ ] **CLI Enhancement**
  - [ ] Add `canvas render` command
  - [ ] Create `sot init` project initialization
  - [ ] Implement `activity switch <state>` command
  - [ ] Add `validate --fix` auto-correction mode

- [ ] **Integration & Tooling**
  - [ ] VS Code extension for canvas editing
  - [ ] Git hooks for multiple lifecycle events
  - [ ] CI/CD pipeline integration
  - [ ] Documentation generation from canvas

### 🤖 **Phase 4: AI Agent Integration**
- [ ] **Agent Logging System**
  - [ ] Create `logs/agent/` structure
  - [ ] Implement JSONL logging format
  - [ ] Add run tracing and decision tracking
  - [ ] Create agent behavior analytics

- [ ] **Smart Assistance**
  - [ ] Auto-suggest required chores
  - [ ] Intelligent state transition recommendations
  - [ ] Canvas validation with suggestions
  - [ ] Test generation based on canvas design

---

## 🛠 **Technical Implementation Tasks**

### **Immediate Priority (Week 1-2)**
1. [x] Fix guardian.ts path resolution for Windows compatibility
2. [ ] Add comprehensive error handling in guardian
3. [ ] Create validation for existing YAML files
4. [ ] Add unit tests for guardian logic
5. [ ] Document setup process for new projects

### **Short-term (Month 1)**
1. [ ] Implement rules.yaml processing
2. [ ] Create canvas validation engine
3. [ ] Add support for package.json alternatives (deno.json version)
4. [ ] Build basic HTML canvas renderer
5. [ ] Create comprehensive test suite

### **Medium-term (Month 2-3)**
1. [ ] Develop interactive canvas editor
2. [ ] Create VS Code extension
3. [ ] Implement state transition guards
4. [ ] Add agent logging infrastructure
5. [ ] Build documentation site

---

## 📊 **Success Metrics for MVP**

### **Core Functionality**
- [ ] Guardian blocks 100% of invalid state transitions
- [ ] All required chores enforced correctly
- [ ] Canvas renders accurately from YAML
- [ ] Agent contract prevents unauthorized actions

### **Developer Experience** 
- [ ] Setup time < 5 minutes for new projects
- [ ] Clear error messages with actionable suggestions
- [ ] Visual canvas editing without YAML knowledge
- [ ] Comprehensive documentation and examples

### **Validation & Testing**
- [ ] Full test coverage for guardian logic
- [ ] Integration tests for complete workflows
- [ ] Performance tests for large canvases
- [ ] Cross-platform compatibility (Windows/Mac/Linux)

---

## 🚨 **Critical Dependencies & Risks**

### **Technical Risks**
- [ ] Deno ecosystem maturity for complex tooling
- [ ] YAML schema validation performance at scale
- [ ] Cross-platform file path handling
- [ ] Git hook reliability across different environments

### **User Adoption Risks**
- [ ] Learning curve for YAML canvas syntax
- [ ] Integration complexity with existing workflows
- [ ] Performance impact of pre-commit validation
- [ ] Documentation clarity and completeness

---

## 📅 **Recommended Implementation Order**

1. **Week 1-2**: Fix current issues, add comprehensive validation
2. **Week 3-4**: Implement rules.yaml and enhanced FSM logic
3. **Month 2**: Build canvas rendering and basic editor
4. **Month 3**: Create VS Code extension and advanced features
5. **Month 4**: Polish, documentation, and community feedback

---

## 🔧 **Current Issues & Fixes**

### **Windows Compatibility**
The `prepare-hooks` task fails on Windows due to `chmod` not being supported. This has been identified and needs to be fixed in `tools/tasks.ts`.

### **Priority Fixes**
1. Make file permission setting conditional on OS
2. Improve error handling for cross-platform operations
3. Add Windows-specific installation instructions

---

## 📝 **Notes**
- This roadmap focuses on delivering a solid, functional MVP that demonstrates the core value proposition of FSM-controlled development workflows
- The innovative YAML canvas approach for visual documentation is a key differentiator
- Cross-platform compatibility is essential for adoption
- Documentation and developer experience are critical success factors