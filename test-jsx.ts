import { transformJSX } from "./src/lib/jsx-transform";

let passed = 0, failed = 0;
const failures: { name: string; error: string }[] = [];

function test(name: string, input: string, check: string, shouldBeGone = false) {
  try {
    const out = transformJSX(input);
    if (shouldBeGone) {
      if (out.includes(check)) throw new Error(`Expected "${check}" to be gone in: ${out.slice(0, 200)}`);
    } else {
      if (!out.includes(check)) throw new Error(`Expected "${check}" in: ${out.slice(0, 200)}`);
    }
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e: any) {
    failed++;
    failures.push({ name, error: e.message });
    console.log(`  ❌ ${name}: ${e.message.slice(0, 150)}`);
  }
}

console.log("\n🔧 JSX Transform Tests");
test("Self-closing tag", '<div />', 'React.createElement("div"');
test("String attribute", 'return <div className="foo" />', 'className: "foo"');
test("Expression attribute", 'return <div style={{color: "red"}} />', 'style: {color: "red"}');
test("Children text", 'return <p>Hello world</p>', '"Hello world"');
test("Nested tags", 'return <div><span>Hi</span></div>', 'React.createElement("span"');
test("Fragment", 'return <><div /><span /></>', 'React.Fragment');
test("Component uppercase", 'return <MyComp />', 'React.createElement(MyComp');
test("Boolean attr", 'return <input disabled />', 'disabled: true');
test("Spread attrs", 'return <div {...props} />', 'Object.assign');
test("class→className", 'return <div class="x" />', 'className: "x"');
test("for→htmlFor", 'return <label for="x" />', 'htmlFor: "x"');
test("Ternary JSX", 'return ok ? <A /> : <B />', 'React.createElement(A');
test("Logical AND JSX", 'return show && <Dialog />', 'React.createElement(Dialog');
test("5 levels deep", 'return <a><b><c><d><e>X</e></d></c></b></a>', '"X"');
test("No leftover JSX tags", 'return <a><b><c><d><e>X</e></d></c></b></a>', '<', true);
test("Event handler", 'return <input onChange={handleChange} />', 'onChange: handleChange');
test("SVG viewBox", 'return <svg viewBox="0 0 24 24" />', 'viewBox: "0 0 24 24"');
test("Dot notation", 'return <Motion.div />', 'React.createElement(Motion.div');
test("String not JSX", 'const x = "a < b";', '"a < b"');
test("Comment preserved", '// comment\nreturn <div />', '// comment');
test("Multiple components", 'const A = () => <h1>T</h1>;\nreturn <div><A /></div>', 'React.createElement(A');
test("Array JSX", 'return [<div key="a">A</div>]', 'key: "a"');
test("Arrow in onClick", 'return <button onClick={() => go()}>Go</button>', '() => go()');
test("Expression child", 'return <div>{count}</div>', 'count');
test("Map nested JSX", 'return <ul>{items.map(i => <li key={i}>{i}</li>)}</ul>', 'React.createElement("li"');
test("Template literal preserved", 'const x = `foo <div>bar</div>`;', '`foo <div>bar</div>`');
test("Inline styles complex", 'return <div style={{background: "linear-gradient(135deg, #1a1d21, #2d3748)", borderRadius: "12px"}} />', 'linear-gradient');
test("Conditional null", 'return condition ? <Active /> : null;', 'React.createElement(Active');
test("Empty expression child", 'return <div>{}</div>', 'React.createElement("div"');

// Full component patterns LLMs produce
console.log("\n🤖 LLM Output Pattern Tests");

test("useState component", `const Component = (props) => {
  const [count, setCount] = React.useState(0);
  return <div>
    <p>Count: {count}</p>
    <button onClick={() => setCount(c => c + 1)}>+</button>
  </div>;
};`, 'React.createElement("button"');

test("No leftover closing tags", `const Component = (props) => {
  return <div><span>Hi</span></div>;
};`, '</span>', true);

test("Map with key", `return <ul>{data.map(item => <li key={item.id}>{item.name}</li>)}</ul>`, 'key: item.id');

test("Multiple nested with styles", `return <div style={{display: "flex"}}>
  <aside style={{width: "200px"}}><nav><ul><li>Home</li></ul></nav></aside>
  <main><h1>Title</h1><p>Body</p></main>
</div>`, 'React.createElement("main"');

console.log(`\n${"═".repeat(50)}`);
console.log(`📊 JSX Transform: ${passed} passed, ${failed} failed`);
if (failures.length) {
  console.log("\n❌ Failures:");
  for (const f of failures) console.log(`  • ${f.name}: ${f.error.slice(0, 200)}`);
}
process.exit(failed > 0 ? 1 : 0);
