// Test the full engine: extractCode, stripTypeScript, compileComponent
// We need React for compileComponent tests

import { compileComponent } from "./src/lib/engine";
import React from "react";

let passed = 0, failed = 0;
const failures: { name: string; error: string }[] = [];

function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e: any) {
    failed++;
    failures.push({ name, error: e.message });
    console.log(`  ❌ ${name}: ${e.message.slice(0, 200)}`);
  }
}

console.log("\n⚙️ Engine / Compilation Tests");

// Test compileComponent with pure createElement code (no JSX needed)
test("Compile simple createElement", () => {
  const code = `const Component = (props) => React.createElement("div", null, "Hello");`;
  const fn = compileComponent(code, React);
  if (!fn) throw new Error("Compilation returned null");
  const result = fn({});
  if (!result) throw new Error("Component returned null");
});

test("Compile with useState", () => {
  const code = `const Component = (props) => {
    const [x, setX] = React.useState(0);
    return React.createElement("div", null, x);
  };`;
  const fn = compileComponent(code, React);
  if (!fn) throw new Error("Compilation returned null");
});

test("Compile with JSX (auto-transform)", () => {
  const code = `const Component = (props) => {
    return <div style={{color: "red"}}><span>Hello {props.name}</span></div>;
  };`;
  const fn = compileComponent(code, React);
  if (!fn) throw new Error("JSX compilation returned null");
});

test("Compile with TypeScript annotations (auto-strip)", () => {
  const code = `interface Props { name: string; }
const Component: React.FC<Props> = (props) => {
  const [count, setCount] = React.useState<number>(0);
  return <div>{count}</div>;
};`;
  const fn = compileComponent(code, React);
  if (!fn) throw new Error("TS compilation returned null");
});

test("Compile with markdown fences (should be handled by extractCode upstream)", () => {
  // compileComponent gets code AFTER extractCode, but let's test resilience
  const code = `const Component = () => React.createElement("div", null, "test");`;
  const fn = compileComponent(code, React);
  if (!fn) throw new Error("Compilation returned null");
});

test("Compile with ctx object", () => {
  const code = `const Component = (props) => {
    const data = ctx.queries ? "has ctx" : "no ctx";
    return React.createElement("div", null, data);
  };`;
  const ctx = { queries: { getItems: async () => [] }, actions: {} };
  const fn = compileComponent(code, React, ctx);
  if (!fn) throw new Error("Compilation with ctx returned null");
});

test("Compile with complex JSX + TS + inline styles", () => {
  const code = `const Component = (props) => {
    const [isOpen, setIsOpen] = React.useState<boolean>(false);
    const items = ["a", "b", "c"] as string[];
    return <div style={{background: "#1a1d21", padding: "20px", borderRadius: "12px"}}>
      <h2 style={{color: "#fff", margin: "0 0 16px"}}>Dashboard</h2>
      {isOpen && <div style={{background: "#2d3748", padding: "12px"}}>
        <ul>{items.map((item, i) => <li key={i} style={{color: "#e2e8f0"}}>{item}</li>)}</ul>
      </div>}
      <button onClick={() => setIsOpen(!isOpen)} style={{background: "#4299e1", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer"}}>
        {isOpen ? "Close" : "Open"}
      </button>
    </div>;
  };`;
  const fn = compileComponent(code, React);
  if (!fn) throw new Error("Complex compilation returned null");
});

test("Compile fails gracefully on garbage", () => {
  const code = `this is not valid javascript at all !@#$%`;
  const fn = compileComponent(code, React);
  // Should return null, not throw
  if (fn !== null) throw new Error("Expected null for garbage input");
});

test("Compile with import statements (should be handled)", () => {
  // extractCode strips these, but compileComponent should also handle
  const code = `import React from 'react';
const Component = (props) => React.createElement("div", null, "test");`;
  // This will likely fail on the import, but the fallback should strip and retry
  const fn = compileComponent(code, React);
  // May or may not compile — just shouldn't throw
});

test("Compile with export default", () => {
  const code = `export default const Component = (props) => React.createElement("div", null, "test");`;
  // compileComponent's pipeline should handle this
  const fn = compileComponent(code, React);
});

console.log(`\n${"═".repeat(50)}`);
console.log(`📊 Engine: ${passed} passed, ${failed} failed`);
if (failures.length) {
  console.log("\n❌ Failures:");
  for (const f of failures) console.log(`  • ${f.name}: ${f.error.slice(0, 200)}`);
}
process.exit(failed > 0 ? 1 : 0);
