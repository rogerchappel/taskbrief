import { readFileSync } from "node:fs";
import { validateWorkspaceConfig } from "./schema.js";
import type { WorkspaceConfig } from "../types.js";

export function loadWorkspaceConfig(path: string): WorkspaceConfig {
  return parseWorkspaceConfig(readFileSync(path, "utf8"));
}

export function parseWorkspaceConfig(source: string): WorkspaceConfig {
  const trimmed = source.trim();
  if (trimmed === "") {
    throw new Error("Workspace config is empty.");
  }

  const parsed = trimmed.startsWith("{") ? JSON.parse(trimmed) : parseSimpleYaml(trimmed);
  return validateWorkspaceConfig(parsed);
}

interface YamlLine {
  indent: number;
  content: string;
}

function parseSimpleYaml(source: string): unknown {
  const lines = source
    .split(/\r?\n/)
    .map(stripComment)
    .filter((line) => line.trim() !== "")
    .map((line) => ({
      indent: line.match(/^ */)?.[0].length ?? 0,
      content: line.trim(),
    }));

  if (lines.length === 0) {
    return {};
  }

  return parseBlock(lines, 0, lines[0]?.indent ?? 0).value;
}

function parseBlock(
  lines: YamlLine[],
  start: number,
  indent: number,
): { value: unknown; next: number } {
  if (lines[start]?.content.startsWith("- ")) {
    return parseArray(lines, start, indent);
  }
  return parseObject(lines, start, indent);
}

function parseObject(
  lines: YamlLine[],
  start: number,
  indent: number,
): { value: Record<string, unknown>; next: number } {
  const output: Record<string, unknown> = {};
  let index = start;

  while (index < lines.length) {
    const line = lines[index];
    if (!line) break;
    if (line.indent < indent) break;
    if (line.indent > indent) {
      throw new Error(`Unexpected indentation near "${line.content}".`);
    }
    if (line.content.startsWith("- ")) break;

    const separator = line.content.indexOf(":");
    if (separator === -1) {
      throw new Error(`Expected key/value pair near "${line.content}".`);
    }

    const key = line.content.slice(0, separator).trim();
    const rawValue = line.content.slice(separator + 1).trim();
    if (key === "") {
      throw new Error(`Expected key near "${line.content}".`);
    }

    if (rawValue !== "") {
      output[key] = parseScalar(rawValue);
      index += 1;
      continue;
    }

    const nextLine = lines[index + 1];
    if (!nextLine || nextLine.indent <= line.indent) {
      output[key] = {};
      index += 1;
      continue;
    }

    const parsed = parseBlock(lines, index + 1, nextLine.indent);
    output[key] = parsed.value;
    index = parsed.next;
  }

  return { value: output, next: index };
}

function parseArray(
  lines: YamlLine[],
  start: number,
  indent: number,
): { value: unknown[]; next: number } {
  const output: unknown[] = [];
  let index = start;

  while (index < lines.length) {
    const line = lines[index];
    if (!line) break;
    if (line.indent < indent) break;
    if (line.indent !== indent || !line.content.startsWith("- ")) break;

    const rawValue = line.content.slice(2).trim();
    output.push(parseScalar(rawValue));
    index += 1;
  }

  return { value: output, next: index };
}

function parseScalar(value: string): unknown {
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null") return null;
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  if (value.startsWith("[") && value.endsWith("]")) {
    return value
      .slice(1, -1)
      .split(",")
      .map((item) => parseScalar(item.trim()))
      .filter((item) => item !== "");
  }
  return value;
}

function stripComment(line: string): string {
  const index = line.indexOf("#");
  return index === -1 ? line : line.slice(0, index);
}
