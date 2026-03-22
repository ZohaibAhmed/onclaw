/**
 * ITERATION 3: JSX Transform Stress Test with Real LLM Patterns
 * Tests the specific JSX patterns that fail in production.
 */
import { transformJSX } from "./src/lib/jsx-transform";
import { compileComponent } from "./src/lib/engine";
import React from "react";

let passed = 0, failed = 0;
const failures: { name: string; error: string }[] = [];

function test(name: string, fn: () => void) {
  try { fn(); passed++; console.log(`  ✅ ${name}`); }
  catch (e: any) { failed++; failures.push({ name, error: e.message }); console.log(`  ❌ ${name}: ${e.message.slice(0, 250)}`); }
}

function assertNoJSX(code: string, context: string = "") {
  const out = transformJSX(code);
  const lines = out.split("\n");
  const leftover: string[] = [];
  lines.forEach((l, i) => {
    // Check for actual JSX tags (not inside strings)
    if (/<[a-zA-Z][^>]*>/.test(l) && !/".*<[a-zA-Z]/.test(l) && !'.*<[a-zA-Z]'.match(l)) {
      leftover.push(`Line ${i}: ${l.trim().slice(0, 100)}`);
    }
  });
  if (leftover.length > 0) {
    throw new Error(`Leftover JSX:\n${leftover.join("\n")}`);
  }
}

function assertCompiles(code: string, ctx?: any) {
  const fn = compileComponent(code, React, ctx);
  if (!fn) throw new Error("Compilation returned null");
}

console.log("\n━━━ ITERATION 3: JSX Transform Stress Test ━━━\n");

console.log("🔍 Multi-line return with parentheses");

test("Return statement with opening paren on same line", () => {
  const code = `const Component = () => {
  return (
    <div style={{padding: '20px'}}>
      <h1>Hello</h1>
    </div>
  );
};`;
  assertCompiles(code);
});

test("Return inside if statement", () => {
  const code = `const Component = () => {
  const show = true;
  if (!show) return null;
  return (
    <div>
      <p>Visible</p>
    </div>
  );
};`;
  assertCompiles(code);
});

test("Multiple returns with JSX (early return pattern)", () => {
  const code = `const Component = (props) => {
  if (props.loading) return <div style={{color: '#aaa'}}>Loading...</div>;
  if (props.error) return <div style={{color: '#f00'}}>Error: {props.error}</div>;
  return (
    <div>
      <h2>Content</h2>
      <p>{props.data}</p>
    </div>
  );
};`;
  assertCompiles(code);
});

console.log("\n🔍 Complex map patterns");

test("Map with multi-line JSX return", () => {
  const code = `const Component = () => {
  const items = [{id: 1, name: 'A'}, {id: 2, name: 'B'}];
  return (
    <div>
      {items.map((item) => (
        <div key={item.id} style={{padding: '8px', margin: '4px'}}>
          <span style={{fontWeight: 'bold'}}>{item.name}</span>
          <button onClick={() => console.log(item.id)}>Click</button>
        </div>
      ))}
    </div>
  );
};`;
  assertCompiles(code);
});

test("Map with arrow body (no parens)", () => {
  const code = `const Component = () => {
  const items = ['a', 'b', 'c'];
  return (
    <ul>
      {items.map((item, i) =>
        <li key={i} style={{padding: '4px'}}>{item}</li>
      )}
    </ul>
  );
};`;
  assertCompiles(code);
});

test("Map with block body and explicit return", () => {
  const code = `const Component = () => {
  const items = [{id: 1, name: 'A', active: true}, {id: 2, name: 'B', active: false}];
  return (
    <div>
      {items.map((item) => {
        const color = item.active ? '#22c55e' : '#666';
        return (
          <div key={item.id} style={{display: 'flex', gap: '8px', padding: '8px'}}>
            <div style={{width: '8px', height: '8px', borderRadius: '50%', background: color}} />
            <span style={{color: '#fff'}}>{item.name}</span>
          </div>
        );
      })}
    </div>
  );
};`;
  assertCompiles(code);
});

test("Nested map inside map", () => {
  const code = `const Component = () => {
  const groups = [
    {name: 'Group A', items: ['X', 'Y']},
    {name: 'Group B', items: ['Z']}
  ];
  return (
    <div>
      {groups.map((g, i) => (
        <div key={i}>
          <h3 style={{color: '#fff'}}>{g.name}</h3>
          <ul>
            {g.items.map((item, j) => (
              <li key={j}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};`;
  assertCompiles(code);
});

console.log("\n🔍 Conditional rendering patterns");

test("Ternary with JSX blocks", () => {
  const code = `const Component = () => {
  const [expanded, setExpanded] = React.useState(false);
  return (
    <div style={{padding: '16px', background: '#1a1d21'}}>
      <button onClick={() => setExpanded(!expanded)}>{expanded ? 'Collapse' : 'Expand'}</button>
      {expanded ? (
        <div style={{marginTop: '12px', padding: '12px', background: '#2d3748'}}>
          <p style={{color: '#e2e8f0'}}>Extended content here</p>
          <p style={{color: '#a0aec0'}}>More details...</p>
        </div>
      ) : (
        <p style={{color: '#666', marginTop: '8px'}}>Click to expand</p>
      )}
    </div>
  );
};`;
  assertCompiles(code);
});

test("Logical AND with complex JSX", () => {
  const code = `const Component = () => {
  const [items, setItems] = React.useState([{id: 1, name: 'Test'}]);
  return (
    <div>
      {items.length > 0 && (
        <div style={{padding: '8px'}}>
          <h4 style={{color: '#fff'}}>Results ({items.length})</h4>
          {items.map(item => (
            <div key={item.id} style={{padding: '4px', borderBottom: '1px solid #333'}}>
              {item.name}
            </div>
          ))}
        </div>
      )}
      {items.length === 0 && <p style={{color: '#666'}}>No results</p>}
    </div>
  );
};`;
  assertCompiles(code);
});

console.log("\n🔍 Single-quote string patterns (LLM common)");

test("All single-quote styles", () => {
  const code = `const Component = () => {
  return (
    <div style={{
      background: '#1e1e2e',
      padding: '20px',
      borderRadius: '12px',
      fontFamily: '-apple-system, sans-serif'
    }}>
      <h2 style={{color: '#cdd6f4', margin: '0 0 16px'}}>Dashboard</h2>
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'}}>
        <div style={{background: '#313244', padding: '16px', borderRadius: '8px'}}>
          <span style={{color: '#a6adc8', fontSize: '12px'}}>Revenue</span>
          <div style={{color: '#cdd6f4', fontSize: '24px', fontWeight: 'bold'}}>$127K</div>
        </div>
        <div style={{background: '#313244', padding: '16px', borderRadius: '8px'}}>
          <span style={{color: '#a6adc8', fontSize: '12px'}}>Users</span>
          <div style={{color: '#cdd6f4', fontSize: '24px', fontWeight: 'bold'}}>8.4K</div>
        </div>
      </div>
    </div>
  );
};`;
  assertCompiles(code);
});

console.log("\n🔍 SVG inline patterns");

test("SVG with multiple child elements", () => {
  const code = `const Component = () => {
  const data = [40, 65, 30, 80, 55];
  const max = Math.max(...data);
  return (
    <div style={{background: '#1e1e2e', padding: '20px', borderRadius: '12px'}}>
      <svg width="250" height="150">
        {data.map((val, i) => (
          <rect key={i} x={i * 50} y={150 - (val/max)*140} width="40" height={(val/max)*140} rx="4" fill="#89b4fa" />
        ))}
      </svg>
    </div>
  );
};`;
  assertCompiles(code);
});

test("SVG with path and circle", () => {
  const code = `const Component = () => {
  return (
    <div>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="#fff" stroke-width="2" />
        <path d="M2 17l10 5 10-5" stroke="#fff" stroke-width="2" />
        <circle cx="12" cy="12" r="3" fill="#fff" />
      </svg>
    </div>
  );
};`;
  assertCompiles(code);
});

console.log("\n🔍 Edge: typeof / instanceof in JSX expressions");

test("typeof in ternary inside JSX", () => {
  const code = `const Component = (props) => {
  return (
    <div>
      {typeof props.value === 'number' ? (
        <span style={{color: props.value > 0 ? '#22c55e' : '#ef4444'}}>
          {props.value > 0 ? '+' : ''}{props.value}%
        </span>
      ) : (
        <span style={{color: '#666'}}>{String(props.value)}</span>
      )}
    </div>
  );
};`;
  assertCompiles(code);
});

console.log("\n🔍 Form patterns");

test("Form with controlled inputs", () => {
  const code = `const Component = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  
  const handleSubmit = () => {
    if (!email || !password) {
      setError('Please fill all fields');
      return;
    }
    setError('');
  };
  
  return (
    <div style={{maxWidth: '400px', padding: '24px', background: '#1a1d21', borderRadius: '12px'}}>
      <h2 style={{color: '#fff', margin: '0 0 20px'}}>Login</h2>
      {error && <div style={{color: '#ef4444', marginBottom: '12px', fontSize: '13px'}}>{error}</div>}
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        style={{width: '100%', padding: '10px', borderRadius: '6px', background: '#2d3748', border: '1px solid #4a5568', color: '#fff', marginBottom: '12px', boxSizing: 'border-box'}}
      />
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        type="password"
        style={{width: '100%', padding: '10px', borderRadius: '6px', background: '#2d3748', border: '1px solid #4a5568', color: '#fff', marginBottom: '16px', boxSizing: 'border-box'}}
      />
      <button onClick={handleSubmit} style={{width: '100%', padding: '10px', borderRadius: '6px', background: '#4299e1', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '14px'}}>
        Sign In
      </button>
    </div>
  );
};`;
  assertCompiles(code);
});

console.log("\n🔍 Large component (stress test)");

test("Full dashboard with multiple sections", () => {
  const code = `const Component = () => {
  const [activeTab, setActiveTab] = React.useState('overview');
  const metrics = [
    {label: 'Revenue', value: '$127K', change: '+12.5%', up: true},
    {label: 'Users', value: '8.4K', change: '+8.2%', up: true},
    {label: 'Orders', value: '1.2K', change: '-3.1%', up: false},
    {label: 'Rate', value: '5.8%', change: '+1.4%', up: true},
  ];
  const tabs = ['overview', 'analytics', 'reports'];
  
  return (
    <div style={{background: '#0f172a', padding: '24px', borderRadius: '16px', fontFamily: '-apple-system, sans-serif'}}>
      <div style={{display: 'flex', gap: '8px', marginBottom: '20px'}}>
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '6px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            background: activeTab === tab ? '#3b82f6' : '#1e293b',
            color: activeTab === tab ? '#fff' : '#94a3b8',
            fontSize: '13px', textTransform: 'capitalize'
          }}>{tab}</button>
        ))}
      </div>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px'}}>
        {metrics.map((m, i) => (
          <div key={i} style={{background: '#1e293b', padding: '16px', borderRadius: '10px'}}>
            <div style={{color: '#94a3b8', fontSize: '12px', marginBottom: '8px'}}>{m.label}</div>
            <div style={{color: '#f1f5f9', fontSize: '22px', fontWeight: 700}}>{m.value}</div>
            <div style={{color: m.up ? '#22c55e' : '#ef4444', fontSize: '12px', marginTop: '4px'}}>
              {m.up ? '↑' : '↓'} {m.change}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};`;
  assertCompiles(code);
});

// Summary
console.log(`\n${"═".repeat(55)}`);
console.log(`📊 Iteration 3: ${passed} passed, ${failed} failed out of ${passed + failed}`);
if (failures.length) {
  console.log("\n❌ Failures:");
  for (const f of failures) { console.log(`  • ${f.name}: ${f.error.slice(0, 250)}`); }
}
process.exit(failed > 0 ? 1 : 0);
