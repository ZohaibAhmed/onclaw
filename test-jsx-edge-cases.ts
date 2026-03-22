import { transformJSX } from "./src/lib/jsx-transform";
import { compileComponent } from "./src/lib/engine";
import React from "react";

interface TestCase {
  id: number;
  name: string;
  category: string;
  code: string;
  testTransform?: boolean;
  testCompile?: boolean;
}

interface TestResult {
  id: number;
  name: string;
  category: string;
  transformPass: boolean | null;
  compilePass: boolean | null;
  transformError?: string;
  compileError?: string;
}

const cases: TestCase[] = [
  // === JSX Transform Edge Cases ===
  { id: 1, name: "Single quotes in attributes", category: "jsx-transform",
    code: `const Component = () => <div className='hello' id='world'>test</div>`, testTransform: true, testCompile: true },
  { id: 2, name: "Double quotes in attributes", category: "jsx-transform",
    code: `const Component = () => <div className="hello" id="world">test</div>`, testTransform: true, testCompile: true },
  { id: 3, name: "Mixed quotes in attributes", category: "jsx-transform",
    code: `const Component = () => <div className='hello' id="world" data-x='y'>test</div>`, testTransform: true, testCompile: true },
  { id: 4, name: "Backtick template literal in expression", category: "jsx-transform",
    code: "const Component = () => <div className={`text-${true ? 'red' : 'blue'}`}>hello</div>", testTransform: true, testCompile: true },
  { id: 5, name: "Complex template literal", category: "jsx-transform",
    code: "const Component = () => <span>{`Hello ${'world'} count: ${1 + 2}`}</span>", testTransform: true, testCompile: true },
  { id: 6, name: "Multiline style object 10+ properties", category: "jsx-transform",
    code: `const Component = () => <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '20px', margin: '10px',
      backgroundColor: '#1a1d21', color: '#fff', borderRadius: '8px',
      fontSize: '14px', fontWeight: 'bold', lineHeight: '1.5',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>styled</div>`, testTransform: true, testCompile: true },
  { id: 7, name: "Nested ternary 3-deep", category: "jsx-transform",
    code: `const Component = (props) => <div>{props.x === 1 ? <span>one</span> : props.x === 2 ? <span>two</span> : props.x === 3 ? <span>three</span> : <span>other</span>}</div>`, testTransform: true, testCompile: true },
  { id: 8, name: "Array destructuring in map", category: "jsx-transform",
    code: `const Component = () => <div>{[[1,'a'],[2,'b']].map(([x,y]) => <div key={x}>{x}{y}</div>)}</div>`, testTransform: true, testCompile: true },
  { id: 9, name: "Object spread shorthand", category: "jsx-transform",
    code: `const Component = () => { const a = 1, b = 2, c = 3; return <div {...{a, b, c}} />; }`, testTransform: true, testCompile: true },
  { id: 10, name: "CSS-in-JS spread pattern", category: "jsx-transform",
    code: `const Component = (props) => { const base = {color:'red'}; const active = {color:'blue'}; return <div style={{...base, ...(props.active && active)}}>hi</div>; }`, testTransform: true, testCompile: true },
  { id: 11, name: "Consecutive JSX siblings (array return)", category: "jsx-transform",
    code: `const Component = () => [<div key="a">first</div>, <div key="b">second</div>, <div key="c">third</div>]`, testTransform: true, testCompile: true },
  { id: 12, name: "Self-closing tag then expression children", category: "jsx-transform",
    code: `const Component = () => <div><input />{true && <span>after</span>}</div>`, testTransform: true, testCompile: true },
  { id: 13, name: "Empty fragment with expression children", category: "jsx-transform",
    code: `const Component = () => <>{true && <div>a</div>}{false || <div>b</div>}</>`, testTransform: true, testCompile: true },
  { id: 14, name: "JSX spread with computed properties", category: "jsx-transform",
    code: `const Component = () => { const key = 'className'; return <div {...{[key]: 'test'}}>hi</div>; }`, testTransform: true, testCompile: true },
  { id: 15, name: "Numeric attribute values", category: "jsx-transform",
    code: `const Component = () => <input tabIndex={0} maxLength={100} />`, testTransform: true, testCompile: true },
  { id: 16, name: "Boolean attribute values", category: "jsx-transform",
    code: `const Component = () => <input disabled readOnly />`, testTransform: true, testCompile: true },
  { id: 17, name: "Data attributes", category: "jsx-transform",
    code: `const Component = () => <div data-testid="my-div" aria-label="label" data-custom="val">test</div>`, testTransform: true, testCompile: true },
  { id: 18, name: "Void HTML elements", category: "jsx-transform",
    code: `const Component = () => <div><input type="text" /><br /><hr /><img src="x.png" alt="x" /></div>`, testTransform: true, testCompile: true },
  { id: 19, name: "Fragment shorthand", category: "jsx-transform",
    code: `const Component = () => <><div>a</div><span>b</span></>`, testTransform: true, testCompile: true },
  { id: 20, name: "Nested fragments", category: "jsx-transform",
    code: `const Component = () => <><><div>deep</div></></>`, testTransform: true, testCompile: true },
  { id: 21, name: "Conditional rendering with &&", category: "jsx-transform",
    code: `const Component = (props) => <div>{props.show && <span>visible</span>}</div>`, testTransform: true, testCompile: true },
  { id: 22, name: "Map with complex JSX", category: "jsx-transform",
    code: `const Component = () => <ul>{[1,2,3].map(i => <li key={i} style={{color: i > 1 ? 'red' : 'blue'}}>{i}</li>)}</ul>`, testTransform: true, testCompile: true },
  { id: 23, name: "Nested components", category: "jsx-transform",
    code: `const Card = ({children}) => <div style={{border:'1px solid #ccc'}}>{children}</div>;
const Component = () => <Card><span>inside</span></Card>`, testTransform: true, testCompile: true },
  { id: 24, name: "Event handler inline arrow", category: "jsx-transform",
    code: `const Component = () => <button onClick={() => console.log('clicked')}>Click</button>`, testTransform: true, testCompile: true },
  { id: 25, name: "String expression child", category: "jsx-transform",
    code: `const Component = () => <div>{"hello " + "world"}</div>`, testTransform: true, testCompile: true },
  { id: 26, name: "Null/undefined children", category: "jsx-transform",
    code: `const Component = () => <div>{null}{undefined}{false}{0}</div>`, testTransform: true, testCompile: true },
  { id: 27, name: "Deeply nested elements", category: "jsx-transform",
    code: `const Component = () => <div><div><div><div><span>deep</span></div></div></div></div>`, testTransform: true, testCompile: true },
  { id: 28, name: "Multiple root elements via fragment", category: "jsx-transform",
    code: `const Component = () => <React.Fragment><div>a</div><div>b</div></React.Fragment>`, testTransform: true, testCompile: true },
  { id: 29, name: "Attribute with expression", category: "jsx-transform",
    code: `const Component = (props) => <div className={props.active ? 'active' : 'inactive'} style={{opacity: props.active ? 1 : 0.5}}>test</div>`, testTransform: true, testCompile: true },
  { id: 30, name: "SVG element", category: "jsx-transform",
    code: `const Component = () => <svg width="100" height="100"><circle cx="50" cy="50" r="40" fill="red" /></svg>`, testTransform: true, testCompile: true },
  { id: 31, name: "Whitespace between tags", category: "jsx-transform",
    code: `const Component = () => <div>  <span>  spaced  </span>  </div>`, testTransform: true, testCompile: true },
  { id: 32, name: "Multiline JSX return", category: "jsx-transform",
    code: `const Component = () => {
  return (
    <div>
      <h1>Title</h1>
      <p>Paragraph</p>
    </div>
  );
}`, testTransform: true, testCompile: true },

  // === ctx.queries usage ===
  { id: 33, name: "ctx.queries access", category: "compilation",
    code: `const Component = (props) => {
  const data = ctx.queries?.myQuery || [];
  return <div>{data.length} items</div>;
}`, testTransform: true, testCompile: true },
  { id: 34, name: "ctx with nested access", category: "compilation",
    code: `const Component = () => {
  const items = ctx.queries?.items?.results || [];
  return <ul>{items.map((item, i) => <li key={i}>{item}</li>)}</ul>;
}`, testTransform: true, testCompile: true },

  // === TypeScript stripping ===
  { id: 35, name: "TS: as assertion", category: "typescript",
    code: `const Component = () => {
  const x = {} as any;
  return <div>{String(x)}</div>;
}`, testTransform: true, testCompile: true },
  { id: 36, name: "TS: optional chaining with as", category: "typescript",
    code: `const Component = (props) => {
  const val = (props.item as any)?.field;
  return <div>{val || 'none'}</div>;
}`, testTransform: true, testCompile: true },
  { id: 37, name: "TS: const type annotation", category: "typescript",
    code: `const Component = () => {
  const name: string = "hello";
  const count: number = 42;
  return <div>{name} {count}</div>;
}`, testTransform: true, testCompile: true },
  { id: 38, name: "TS: interface declaration", category: "typescript",
    code: `interface MyProps {
  name: string;
  age: number;
}
const Component = (props) => <div>{props.name}</div>`, testTransform: true, testCompile: true },
  { id: 39, name: "TS: type declaration", category: "typescript",
    code: `type Status = 'active' | 'inactive';
const Component = () => {
  const s: Status = 'active';
  return <div>{s}</div>;
}`, testTransform: true, testCompile: true },
  { id: 40, name: "TS: generic useState", category: "typescript",
    code: `const Component = () => {
  const [val, setVal] = React.useState<string>("hi");
  return <div>{val}</div>;
}`, testTransform: true, testCompile: true },
  { id: 41, name: "TS: generic useRef", category: "typescript",
    code: `const Component = () => {
  const ref = React.useRef<HTMLDivElement>(null);
  return <div ref={ref}>ref test</div>;
}`, testTransform: true, testCompile: true },
  { id: 42, name: "TS: non-null assertion", category: "typescript",
    code: `const Component = () => {
  const items = [1, 2, 3];
  const first = items.find(x => x > 0)!;
  return <div>{first}</div>;
}`, testTransform: true, testCompile: true },
  { id: 43, name: "TS: satisfies keyword", category: "typescript",
    code: `const Component = () => {
  const config = {} satisfies Record<string, unknown>;
  return <div>satisfies test</div>;
}`, testTransform: true, testCompile: true },
  { id: 44, name: "TS: tuple type annotation", category: "typescript",
    code: `const Component = () => {
  const pair: [string, number] = ["hello", 42];
  return <div>{pair[0]} {pair[1]}</div>;
}`, testTransform: true, testCompile: true },
  { id: 45, name: "TS: intersection type annotation", category: "typescript",
    code: `type A = { x: number };
type B = { y: string };
const Component = () => {
  const val: A & B = { x: 1, y: 'hi' };
  return <div>{val.x} {val.y}</div>;
}`, testTransform: true, testCompile: true },
  { id: 46, name: "TS: const enum", category: "typescript",
    code: `const enum Status { Active = 0, Inactive = 1 }
const Component = () => <div>{0}</div>`, testTransform: true, testCompile: true },
  { id: 47, name: "TS: React.FC type", category: "typescript",
    code: `const Component: React.FC = () => <div>typed component</div>`, testTransform: true, testCompile: true },
  { id: 48, name: "TS: arrow with generic constraint", category: "typescript",
    code: `const Component = () => {
  const identity = <T extends string>(x: T): T => x;
  return <div>{identity("hello")}</div>;
}`, testTransform: true, testCompile: true },
  { id: 49, name: "TS: export default stripping", category: "typescript",
    code: `export default function Component() {
  return <div>exported</div>;
}`, testTransform: true, testCompile: true },
  { id: 50, name: "TS: import stripping", category: "typescript",
    code: `import React from 'react';
import { useState } from 'react';
const Component = () => <div>imports stripped</div>`, testTransform: true, testCompile: true },

  // === Additional edge cases ===
  { id: 51, name: "Emoji in JSX text", category: "jsx-transform",
    code: `const Component = () => <div>Hello 🌍 World 🎉</div>`, testTransform: true, testCompile: true },
  { id: 52, name: "Nested map with index", category: "jsx-transform",
    code: `const Component = () => <div>{[[1,2],[3,4]].map((row, i) => <div key={i}>{row.map((c, j) => <span key={j}>{c}</span>)}</div>)}</div>`, testTransform: true, testCompile: true },
  { id: 53, name: "Inline object in attribute", category: "jsx-transform",
    code: `const Component = () => <div style={{color: 'red', fontSize: 12}}>inline</div>`, testTransform: true, testCompile: true },
  { id: 54, name: "Ternary returning different element types", category: "jsx-transform",
    code: `const Component = (props) => props.loading ? <span>Loading...</span> : <div><h1>Content</h1></div>`, testTransform: true, testCompile: true },
  { id: 55, name: "String with angle brackets (not JSX)", category: "jsx-transform",
    code: `const Component = () => <div>{"1 < 2 && 3 > 1"}</div>`, testTransform: true, testCompile: true },
];

async function run() {
  const results: TestResult[] = [];

  for (const tc of cases) {
    const r: TestResult = { id: tc.id, name: tc.name, category: tc.category, transformPass: null, compilePass: null };

    // Test transform
    if (tc.testTransform) {
      try {
        const out = transformJSX(tc.code);
        // Basic sanity: should return a string, no uncaught throw
        r.transformPass = typeof out === "string" && out.length > 0;
      } catch (e: any) {
        r.transformPass = false;
        r.transformError = e.message?.slice(0, 200);
      }
    }

    // Test compile
    if (tc.testCompile) {
      try {
        const ctx = { queries: { myQuery: [1, 2, 3], items: { results: ["a", "b"] } }, actions: {} };
        const useCtx = tc.code.includes("ctx.");
        const fn = compileComponent(tc.code, React, useCtx ? ctx : undefined);
        r.compilePass = typeof fn === "function";
        // Try calling it
        if (fn) {
          try { fn({ active: true, show: true, loading: false, item: { field: "val" }, x: 1, name: "test", age: 25 }); } catch {}
        }
      } catch (e: any) {
        r.compilePass = false;
        r.compileError = e.message?.slice(0, 200);
      }
    }

    results.push(r);
  }

  // Summary
  const transformResults = results.filter(r => r.transformPass !== null);
  const compileResults = results.filter(r => r.compilePass !== null);
  const transformPass = transformResults.filter(r => r.transformPass).length;
  const compilePass = compileResults.filter(r => r.compilePass).length;
  const failures = results.filter(r => r.transformPass === false || r.compilePass === false);

  const output = {
    timestamp: new Date().toISOString(),
    totalCases: cases.length,
    transform: { total: transformResults.length, pass: transformPass, fail: transformResults.length - transformPass },
    compile: { total: compileResults.length, pass: compilePass, fail: compileResults.length - compilePass },
    failures: failures.map(f => ({ id: f.id, name: f.name, category: f.category, transformError: f.transformError, compileError: f.compileError })),
    results,
  };

  require("fs").writeFileSync("/tmp/onclaw-transform-results.json", JSON.stringify(output, null, 2));

  console.log(`\n=== JSX Transform & Compile Test Results ===`);
  console.log(`Total cases: ${cases.length}`);
  console.log(`Transform: ${transformPass}/${transformResults.length} pass`);
  console.log(`Compile:   ${compilePass}/${compileResults.length} pass`);
  console.log(`\nFailures (${failures.length}):`);
  for (const f of failures) {
    console.log(`  #${f.id} [${f.category}] ${f.name}`);
    if (f.transformError) console.log(`    Transform: ${f.transformError}`);
    if (f.compileError) console.log(`    Compile: ${f.compileError}`);
  }
}

run();
