/**
 * Lightweight JSX → React.createElement transpiler.
 * Handles the common JSX patterns LLMs produce.
 * Not a full parser — covers ~95% of LLM output.
 */

export function transformJSX(code: string): string {
  // If it already looks like pure createElement code, skip
  if (!code.includes("<") || !/<[A-Za-z]/.test(code)) return code;

  let result = "";
  let i = 0;

  while (i < code.length) {
    // Skip string literals
    if (code[i] === '"' || code[i] === "'" || code[i] === "`") {
      const quote = code[i];
      result += quote;
      i++;
      if (quote === "`") {
        // Template literal — handle ${} nesting
        while (i < code.length) {
          if (code[i] === "\\" && i + 1 < code.length) {
            result += code[i] + code[i + 1];
            i += 2;
            continue;
          }
          if (code[i] === "$" && code[i + 1] === "{") {
            result += "${";
            i += 2;
            let depth = 1;
            while (i < code.length && depth > 0) {
              if (code[i] === "{") depth++;
              else if (code[i] === "}") depth--;
              if (depth > 0) result += code[i];
              else result += "}";
              i++;
            }
            continue;
          }
          if (code[i] === "`") {
            result += "`";
            i++;
            break;
          }
          result += code[i];
          i++;
        }
      } else {
        while (i < code.length) {
          if (code[i] === "\\" && i + 1 < code.length) {
            result += code[i] + code[i + 1];
            i += 2;
            continue;
          }
          if (code[i] === quote) {
            result += quote;
            i++;
            break;
          }
          result += code[i];
          i++;
        }
      }
      continue;
    }

    // Skip line comments
    if (code[i] === "/" && code[i + 1] === "/") {
      while (i < code.length && code[i] !== "\n") {
        result += code[i];
        i++;
      }
      continue;
    }

    // Skip block comments
    if (code[i] === "/" && code[i + 1] === "*") {
      result += "/*";
      i += 2;
      while (i < code.length && !(code[i] === "*" && code[i + 1] === "/")) {
        result += code[i];
        i++;
      }
      if (i < code.length) {
        result += "*/";
        i += 2;
      }
      continue;
    }

    // Check for JSX opening tag
    if (code[i] === "<" && i + 1 < code.length) {
      const next = code[i + 1];

      // Closing tag </Tag>
      if (next === "/") {
        // Skip the closing tag entirely — it's consumed by the opening tag handler
        const closeEnd = code.indexOf(">", i);
        if (closeEnd !== -1) {
          i = closeEnd + 1;
          continue;
        }
      }

      // Self-closing or opening tag
      if (/[A-Za-z]/.test(next)) {
        // Check it's not inside a comparison (e.g., x < y)
        // Heuristic: look back for operator context
        const lookback = result.slice(-20).trim();
        if (lookback.endsWith("return") || lookback.endsWith("(") || lookback.endsWith(",") ||
            lookback.endsWith("?") || lookback.endsWith(":") || lookback.endsWith("&&") ||
            lookback.endsWith("||") || lookback.endsWith("=>") || lookback.endsWith("{") ||
            lookback.endsWith("[") || lookback.endsWith(";") || lookback.endsWith("\n") ||
            lookback === "" || lookback.endsWith("React.createElement")) {
          const parsed = parseJSXElement(code, i);
          if (parsed) {
            result += parsed.output;
            i = parsed.end;
            continue;
          }
        }
      }

      // Fragment <>...</>
      if (next === ">") {
        const parsed = parseJSXFragment(code, i);
        if (parsed) {
          result += parsed.output;
          i = parsed.end;
          continue;
        }
      }
    }

    result += code[i];
    i++;
  }

  return result;
}

interface ParseResult {
  output: string;
  end: number;
}

function parseJSXElement(code: string, start: number): ParseResult | null {
  let i = start + 1; // skip <

  // Read tag name
  let tagName = "";
  while (i < code.length && /[A-Za-z0-9._]/.test(code[i])) {
    tagName += code[i];
    i++;
  }
  if (!tagName) return null;

  // Determine if it's a component (uppercase) or HTML element (lowercase)
  const isComponent = /^[A-Z]/.test(tagName);
  const tagRef = isComponent ? tagName : `"${tagName}"`;

  // Parse attributes
  const attrs: string[] = [];
  let spreadAttrs: string[] = [];

  while (i < code.length) {
    // Skip whitespace
    while (i < code.length && /\s/.test(code[i])) i++;

    // End of tag
    if (code[i] === "/" && code[i + 1] === ">") {
      // Self-closing
      i += 2;
      const propsStr = buildProps(attrs, spreadAttrs);
      return { output: `React.createElement(${tagRef}, ${propsStr})`, end: i };
    }
    if (code[i] === ">") {
      i++; // skip >
      break;
    }

    // Spread attribute {...expr}
    if (code[i] === "{" && code[i + 1] === "." && code[i + 2] === "." && code[i + 3] === ".") {
      i += 4; // skip {...
      let expr = "";
      let depth = 1;
      while (i < code.length && depth > 0) {
        if (code[i] === "{") depth++;
        else if (code[i] === "}") {
          depth--;
          if (depth === 0) { i++; break; }
        }
        expr += code[i];
        i++;
      }
      spreadAttrs.push(expr.trim());
      continue;
    }

    // Attribute name
    let attrName = "";
    while (i < code.length && /[A-Za-z0-9_\-]/.test(code[i])) {
      attrName += code[i];
      i++;
    }
    if (!attrName) break;

    // Convert HTML attribute names to React
    const reactAttr = htmlToReactAttr(attrName);

    if (code[i] === "=") {
      i++; // skip =
      if (code[i] === "{") {
        // Expression value
        i++; // skip {
        let expr = "";
        let depth = 1;
        while (i < code.length && depth > 0) {
          if (code[i] === "{") depth++;
          else if (code[i] === "}") {
            depth--;
            if (depth === 0) { i++; break; }
          }
          expr += code[i];
          i++;
        }
        attrs.push(`${reactAttr}: ${transformJSX(expr.trim())}`);
      } else if (code[i] === '"' || code[i] === "'") {
        // String value
        const quote = code[i];
        i++;
        let val = "";
        while (i < code.length && code[i] !== quote) {
          val += code[i];
          i++;
        }
        i++; // skip closing quote
        attrs.push(`${reactAttr}: "${val}"`);
      }
    } else {
      // Boolean attribute
      attrs.push(`${reactAttr}: true`);
    }
  }

  // Parse children
  const children: string[] = [];
  while (i < code.length) {
    // Skip whitespace between children (but preserve text content)
    
    // Check for closing tag
    if (code[i] === "<" && code[i + 1] === "/") {
      // Find end of closing tag
      const closeEnd = code.indexOf(">", i);
      if (closeEnd !== -1) {
        i = closeEnd + 1;
        break;
      }
    }

    // JSX expression child {expr}
    if (code[i] === "{") {
      i++;
      let expr = "";
      let depth = 1;
      while (i < code.length && depth > 0) {
        if (code[i] === "{") depth++;
        else if (code[i] === "}") {
          depth--;
          if (depth === 0) { i++; break; }
        }
        expr += code[i];
        i++;
      }
      const trimmed = expr.trim();
      if (trimmed) children.push(transformJSX(trimmed));
      continue;
    }

    // Nested JSX element
    if (code[i] === "<") {
      if (code[i + 1] === ">" || (code[i + 1] && /[A-Za-z]/.test(code[i + 1]))) {
        const nested = code[i + 1] === ">"
          ? parseJSXFragment(code, i)
          : parseJSXElement(code, i);
        if (nested) {
          children.push(nested.output);
          i = nested.end;
          continue;
        }
      }
      break; // Unknown — bail
    }

    // Text content
    let text = "";
    while (i < code.length && code[i] !== "<" && code[i] !== "{") {
      text += code[i];
      i++;
    }
    const trimmedText = text.replace(/\s+/g, " ").trim();
    if (trimmedText) {
      children.push(`"${trimmedText.replace(/"/g, '\\"')}"`);
    }
  }

  const propsStr = buildProps(attrs, spreadAttrs);
  const args = [tagRef, propsStr, ...children].join(", ");
  return { output: `React.createElement(${args})`, end: i };
}

function parseJSXFragment(code: string, start: number): ParseResult | null {
  let i = start + 2; // skip <>

  const children: string[] = [];
  while (i < code.length) {
    // Check for closing fragment </>
    if (code[i] === "<" && code[i + 1] === "/" && code[i + 2] === ">") {
      i += 3;
      break;
    }

    if (code[i] === "{") {
      i++;
      let expr = "";
      let depth = 1;
      while (i < code.length && depth > 0) {
        if (code[i] === "{") depth++;
        else if (code[i] === "}") {
          depth--;
          if (depth === 0) { i++; break; }
        }
        expr += code[i];
        i++;
      }
      const trimmed = expr.trim();
      if (trimmed) children.push(transformJSX(trimmed));
      continue;
    }

    if (code[i] === "<" && code[i + 1] && /[A-Za-z]/.test(code[i + 1])) {
      const nested = parseJSXElement(code, i);
      if (nested) {
        children.push(nested.output);
        i = nested.end;
        continue;
      }
      break;
    }

    if (code[i] === "<" && code[i + 1] === ">") {
      const nested = parseJSXFragment(code, i);
      if (nested) {
        children.push(nested.output);
        i = nested.end;
        continue;
      }
      break;
    }

    let text = "";
    while (i < code.length && code[i] !== "<" && code[i] !== "{") {
      text += code[i];
      i++;
    }
    const trimmed = text.replace(/\s+/g, " ").trim();
    if (trimmed) children.push(`"${trimmed.replace(/"/g, '\\"')}"`);
  }

  const args = ["React.Fragment", "null", ...children].join(", ");
  return { output: `React.createElement(${args})`, end: i };
}

function buildProps(attrs: string[], spreads: string[]): string {
  if (attrs.length === 0 && spreads.length === 0) return "null";
  if (spreads.length > 0) {
    const base = attrs.length > 0 ? `{ ${attrs.join(", ")} }` : "{}";
    return `Object.assign(${base}, ${spreads.join(", ")})`;
  }
  return `{ ${attrs.join(", ")} }`;
}

function htmlToReactAttr(name: string): string {
  const map: Record<string, string> = {
    class: "className",
    for: "htmlFor",
    "clip-path": "clipPath",
    "fill-rule": "fillRule",
    "font-size": "fontSize",
    "stroke-width": "strokeWidth",
    "stroke-linecap": "strokeLinecap",
    "stroke-linejoin": "strokeLinejoin",
    tabindex: "tabIndex",
    readonly: "readOnly",
    maxlength: "maxLength",
    colspan: "colSpan",
    rowspan: "rowSpan",
    enctype: "encType",
    contenteditable: "contentEditable",
    crossorigin: "crossOrigin",
    viewBox: "viewBox",
  };
  // Handle onclick, onchange, etc.
  if (name.startsWith("on")) {
    return "on" + name.charAt(2).toUpperCase() + name.slice(3);
  }
  return map[name] ?? name;
}
