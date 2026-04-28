export function renderYaml(queueOrTasks) {
  const queue = Array.isArray(queueOrTasks) ? { tasks: queueOrTasks } : queueOrTasks;
  return `${toYaml(queue)}`;
}

export function toYaml(value, indent = 0) {
  if (Array.isArray(value)) return renderArray(value, indent);
  if (isPlainObject(value)) return renderObject(value, indent);
  return `${" ".repeat(indent)}${formatScalar(value)}\n`;
}

function renderObject(object, indent) {
  return Object.entries(object)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return value.length === 0
          ? `${" ".repeat(indent)}${key}: []\n`
          : `${" ".repeat(indent)}${key}:\n${renderArray(value, indent + 2)}`;
      }

      if (isPlainObject(value)) {
        return `${" ".repeat(indent)}${key}:\n${renderObject(value, indent + 2)}`;
      }

      return `${" ".repeat(indent)}${key}: ${formatScalar(value)}\n`;
    })
    .join("");
}

function renderArray(array, indent) {
  return array
    .map((item) => {
      if (isPlainObject(item)) {
        const [firstEntry, ...restEntries] = Object.entries(item);
        const [firstKey, firstValue] = firstEntry;
        const firstLine = `${" ".repeat(indent)}- ${firstKey}: ${formatInlineValue(firstValue, indent + 2)}\n`;
        const rest = restEntries
          .map(([key, value]) => {
            if (Array.isArray(value)) {
              return value.length === 0
                ? `${" ".repeat(indent + 2)}${key}: []\n`
                : `${" ".repeat(indent + 2)}${key}:\n${renderArray(value, indent + 4)}`;
            }

            if (isPlainObject(value)) {
              return `${" ".repeat(indent + 2)}${key}:\n${renderObject(value, indent + 4)}`;
            }

            return `${" ".repeat(indent + 2)}${key}: ${formatScalar(value)}\n`;
          })
          .join("");
        return `${firstLine}${rest}`;
      }

      return `${" ".repeat(indent)}- ${formatScalar(item)}\n`;
    })
    .join("");
}

function formatInlineValue(value, indent) {
  if (Array.isArray(value)) return value.length === 0 ? "[]" : `\n${renderArray(value, indent)}`;
  if (isPlainObject(value)) return `\n${renderObject(value, indent)}`;
  return formatScalar(value);
}

function formatScalar(value) {
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  if (value === null) return "null";
  const string = String(value);
  if (string.includes("\n")) return `|\n${string.split("\n").map((line) => `  ${line}`).join("\n")}`;
  return JSON.stringify(string);
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
