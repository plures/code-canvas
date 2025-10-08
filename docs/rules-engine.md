# Rules Engine Documentation

The Code Canvas guardian includes a comprehensive rules engine that processes `sot/rules.yaml`.

## Rule Types

### Invariants
Always enforced rules that maintain project quality:

- **File Size Limits**: Keeps documentation under 150 lines/3000 characters for better AI context
- **YAML Syntax Validation**: Ensures all configuration files are valid YAML
- **Commit Size Limits**: Encourages focused changes (max 10 files, 500 additions)

### Chores  
Conditional requirements triggered by specific changes:

- **Version Changes**: Version bumps must include changelog updates
- **Schema Changes**: Schema modifications require example and test updates  
- **Tool Changes**: Tool modifications need documentation updates

### Constraints
Activity-specific rules based on current FSM state:

- **Design Phase**: Restricts implementation files, allows planning documents
- **Implementation Phase**: Requires tests with any source code changes
- **Release Phase**: Limits changes to release-specific files

## Configuration

Edit `sot/rules.yaml` to customize:

```yaml
invariants:
  - id: small_docs
    description: Keep docs small for better context
    check:
      type: file_size
      patterns: ["docs/**/*.md"]
      max_lines: 150
      max_chars: 3000

chores:
  - id: version_changelog
    description: Version bumps require changelog
    when:
      patterns: ["package.json"]
      content_matches: ["version.*:"]
    then:
      must_change: ["CHANGELOG.md"]

constraints:
  - id: design_limits
    description: Design phase focus
    applies_to_activity: design
    forbidden_patterns: ["src/**/*.ts"]
```

## Validation Process

The guardian runs rules in this order:
1. **Invariants** - Check all universal rules
2. **Constraints** - Apply activity-specific restrictions  
3. **Chores** - Verify conditional requirements
4. **Lifecycle** - FSM-based path and chore validation

## Error Messages

Rules provide clear, actionable error messages:
- File size violations show actual vs. allowed limits
- YAML errors include line numbers and syntax details
- Missing chores list exactly what needs to be added
- Constraint violations explain activity restrictions

This multi-layered validation ensures consistent project quality while maintaining development workflow flexibility.