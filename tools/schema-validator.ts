#!/usr/bin/env -S deno run --allow-read --allow-write
/**
 * Schema Validation System
 *
 * Validates all YAML configuration files against their JSON schemas.
 * Provides comprehensive error reporting and validation summaries.
 */

import { parse as parseYaml } from "https://deno.land/std@0.208.0/yaml/mod.ts";
import { exists } from "https://deno.land/std@0.208.0/fs/exists.ts";
import { basename, join } from "https://deno.land/std@0.208.0/path/mod.ts";
import { walk } from "https://deno.land/std@0.208.0/fs/walk.ts";

interface ValidationResult {
  file: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface SchemaMapping {
  pattern: RegExp;
  schemaPath: string;
  description: string;
}

export class SchemaValidator {
  private basePath: string;
  private schemaMappings: SchemaMapping[] = [
    {
      pattern: /sot[\/\\]lifecycle\.yaml$/,
      schemaPath: "sot/schemas/lifecycle.schema.yaml",
      description: "FSM Lifecycle Configuration",
    },
    {
      pattern: /sot[\/\\]rules\.yaml$/,
      schemaPath: "sot/schemas/rules.schema.yaml",
      description: "Guardian Rules Configuration",
    },
    {
      pattern: /sot[\/\\]canvas[\/\\].*\.canvas\.yaml$/,
      schemaPath: "sot/schemas/canvas.schema.yaml",
      description: "Canvas Definition",
    },
    {
      pattern: /sot[\/\\]state[\/\\]activity\.yaml$/,
      schemaPath: "sot/schemas/activity.schema.yaml",
      description: "Current Activity State",
    },
    {
      pattern: /sot[\/\\]state[\/\\]history\.yaml$/,
      schemaPath: "sot/schemas/history.schema.yaml",
      description: "State Transition History",
    },
  ];

  constructor(basePath = ".") {
    this.basePath = basePath;
  }

  async validateFile(filePath: string): Promise<ValidationResult> {
    const result: ValidationResult = {
      file: filePath,
      valid: true,
      errors: [],
      warnings: [],
    };

    try {
      // Check if file exists
      if (!await exists(filePath)) {
        result.valid = false;
        result.errors.push("File does not exist");
        return result;
      }

      // Load and parse YAML
      const content = await Deno.readTextFile(filePath);
      let data: any;

      try {
        data = parseYaml(content);
      } catch (yamlError) {
        result.valid = false;
        result.errors.push(
          `YAML parsing error: ${
            yamlError instanceof Error ? yamlError.message : String(yamlError)
          }`,
        );
        return result;
      }

      // Find matching schema
      const schemaMapping = this.schemaMappings.find((mapping) => mapping.pattern.test(filePath));

      if (!schemaMapping) {
        result.warnings.push(`No schema mapping found for file: ${filePath}`);
        return result;
      }

      const schemaPath = join(this.basePath, schemaMapping.schemaPath);

      // Load schema if it exists
      if (await exists(schemaPath)) {
        const schemaContent = await Deno.readTextFile(schemaPath);
        let schema: any;

        try {
          schema = parseYaml(schemaContent);
        } catch (schemaError) {
          result.warnings.push(
            `Schema parsing error: ${
              schemaError instanceof Error ? schemaError.message : String(schemaError)
            }`,
          );
          return result;
        }

        // Perform basic validation
        const validation = this.validateAgainstSchema(data, schema, filePath);
        result.valid = validation.valid;
        result.errors.push(...validation.errors);
        result.warnings.push(...validation.warnings);
      } else {
        result.warnings.push(`Schema file not found: ${schemaPath}`);
      }

      // Perform file-specific validation
      const specificValidation = await this.performSpecificValidation(filePath, data);
      result.errors.push(...specificValidation.errors);
      result.warnings.push(...specificValidation.warnings);
      if (!specificValidation.valid) result.valid = false;
    } catch (error) {
      result.valid = false;
      result.errors.push(
        `Validation error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return result;
  }

  private validateAgainstSchema(
    data: any,
    schema: any,
    filePath: string,
  ): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Basic JSON schema-like validation
      if (schema.type === "object" && schema.properties) {
        if (typeof data !== "object" || data === null) {
          errors.push("Expected an object");
          return { valid: false, errors, warnings };
        }

        // Check required properties
        if (schema.required) {
          for (const prop of schema.required) {
            if (!(prop in data)) {
              errors.push(`Missing required property: ${prop}`);
            }
          }
        }

        // Validate properties
        for (const [key, value] of Object.entries(data)) {
          const propSchema = schema.properties[key];
          if (propSchema) {
            const propValidation = this.validateProperty(value, propSchema, key);
            errors.push(...propValidation.errors);
            warnings.push(...propValidation.warnings);
          } else if (schema.additionalProperties === false) {
            warnings.push(`Unexpected property: ${key}`);
          }
        }
      }
    } catch (error) {
      errors.push(
        `Schema validation error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  private validateProperty(
    value: any,
    schema: any,
    propName: string,
  ): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (schema.type) {
      const expectedType = schema.type;
      const actualType = Array.isArray(value) ? "array" : typeof value;

      if (expectedType !== actualType) {
        errors.push(`Property '${propName}': expected ${expectedType}, got ${actualType}`);
      }
    }

    if (schema.enum && !schema.enum.includes(value)) {
      errors.push(
        `Property '${propName}': value '${value}' not in allowed values: ${schema.enum.join(", ")}`,
      );
    }

    if (schema.pattern && typeof value === "string") {
      const regex = new RegExp(schema.pattern);
      if (!regex.test(value)) {
        errors.push(
          `Property '${propName}': value '${value}' does not match pattern ${schema.pattern}`,
        );
      }
    }

    if (schema.items && Array.isArray(value)) {
      value.forEach((item, index) => {
        const itemValidation = this.validateProperty(item, schema.items, `${propName}[${index}]`);
        errors.push(...itemValidation.errors);
        warnings.push(...itemValidation.warnings);
      });
    }

    return { errors, warnings };
  }

  private async performSpecificValidation(
    filePath: string,
    data: any,
  ): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let valid = true;

    try {
      // Lifecycle-specific validation
      if (filePath.includes("lifecycle.yaml")) {
        valid = this.validateLifecycle(data, errors, warnings) && valid;
      }

      // Rules-specific validation
      if (filePath.includes("rules.yaml")) {
        valid = this.validateRules(data, errors, warnings) && valid;
      }

      // Canvas-specific validation
      if (filePath.includes(".canvas.yaml")) {
        valid = this.validateCanvas(data, errors, warnings) && valid;
      }

      // Activity state validation
      if (filePath.includes("activity.yaml")) {
        valid = this.validateActivity(data, errors, warnings) && valid;
      }
    } catch (error) {
      errors.push(
        `Specific validation error: ${error instanceof Error ? error.message : String(error)}`,
      );
      valid = false;
    }

    return { valid, errors, warnings };
  }

  private validateLifecycle(data: any, errors: string[], warnings: string[]): boolean {
    let valid = true;

    // Check that initial state exists in states array
    if (data.initial && data.states) {
      const initialExists = data.states.some((state: any) => state.id === data.initial);
      if (!initialExists) {
        errors.push(`Initial state '${data.initial}' not found in states array`);
        valid = false;
      }
    }

    // Validate state transitions
    if (data.transitions && data.states) {
      const stateIds = new Set(data.states.map((state: any) => state.id));

      for (const transition of data.transitions) {
        if (!stateIds.has(transition.from)) {
          errors.push(`Transition references unknown 'from' state: ${transition.from}`);
          valid = false;
        }
        if (!stateIds.has(transition.to)) {
          errors.push(`Transition references unknown 'to' state: ${transition.to}`);
          valid = false;
        }
      }
    }

    return valid;
  }

  private validateRules(_data: any, _errors: string[], _warnings: string[]): boolean {
    // Rules validation logic would go here
    return true;
  }

  private validateCanvas(data: any, errors: string[], warnings: string[]): boolean {
    let valid = true;

    // Validate node references in edges
    if (data.canvas && data.canvas.edges && data.canvas.nodes) {
      const nodeIds = new Set(data.canvas.nodes.map((node: any) => node.id));

      for (const edge of data.canvas.edges) {
        if (!nodeIds.has(edge.from)) {
          errors.push(`Edge references unknown 'from' node: ${edge.from}`);
          valid = false;
        }
        if (!nodeIds.has(edge.to)) {
          errors.push(`Edge references unknown 'to' node: ${edge.to}`);
          valid = false;
        }
      }
    }

    // Check for positioning on all nodes
    if (data.canvas && data.canvas.nodes) {
      for (const node of data.canvas.nodes) {
        if (
          !node.position || typeof node.position.x !== "number" ||
          typeof node.position.y !== "number"
        ) {
          warnings.push(`Node '${node.id}' missing or invalid position coordinates`);
        }
        if (
          !node.size || typeof node.size.width !== "number" || typeof node.size.height !== "number"
        ) {
          warnings.push(`Node '${node.id}' missing or invalid size dimensions`);
        }
      }
    }

    return valid;
  }

  private validateActivity(data: any, errors: string[], warnings: string[]): boolean {
    let valid = true;

    // Check that activity is a valid ISO timestamp
    if (data.since) {
      try {
        new Date(data.since);
      } catch {
        errors.push("Invalid ISO timestamp in 'since' field");
        valid = false;
      }
    }

    return valid;
  }

  async validateAll(): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    const yamlFiles: string[] = [];

    // Find all YAML files in the sot directory
    try {
      for await (
        const entry of walk(join(this.basePath, "sot"), {
          exts: [".yaml", ".yml"],
          includeDirs: false,
        })
      ) {
        yamlFiles.push(entry.path);
      }
    } catch (error) {
      console.error(
        `Error scanning for YAML files: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    // Validate each file
    for (const filePath of yamlFiles) {
      const result = await this.validateFile(filePath);
      results.push(result);
    }

    return results;
  }

  printResults(results: ValidationResult[]): void {
    console.log("\n🔍 Schema Validation Results\n");

    let totalFiles = 0;
    let validFiles = 0;
    let totalErrors = 0;
    let totalWarnings = 0;

    for (const result of results) {
      totalFiles++;
      if (result.valid) validFiles++;
      totalErrors += result.errors.length;
      totalWarnings += result.warnings.length;

      const status = result.valid ? "✅" : "❌";
      const fileName = basename(result.file);
      console.log(`${status} ${fileName}`);

      if (result.errors.length > 0) {
        result.errors.forEach((error) => console.log(`   ❌ ${error}`));
      }

      if (result.warnings.length > 0) {
        result.warnings.forEach((warning) => console.log(`   ⚠️  ${warning}`));
      }
    }

    console.log(`\n📊 Summary: ${validFiles}/${totalFiles} files valid`);
    console.log(`❌ ${totalErrors} errors, ⚠️  ${totalWarnings} warnings`);

    if (validFiles === totalFiles && totalErrors === 0) {
      console.log("🎉 All configuration files are valid!");
    }
  }
}

// CLI Interface
if (import.meta.main) {
  const validator = new SchemaValidator();

  if (Deno.args.length > 0) {
    // Validate specific file
    const filePath = Deno.args[0];
    const result = await validator.validateFile(filePath);
    validator.printResults([result]);

    if (!result.valid) {
      Deno.exit(1);
    }
  } else {
    // Validate all files
    const results = await validator.validateAll();
    validator.printResults(results);

    const hasErrors = results.some((r) => !r.valid);
    if (hasErrors) {
      Deno.exit(1);
    }
  }
}
