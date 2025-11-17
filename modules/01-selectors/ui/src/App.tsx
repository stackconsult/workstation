import React from 'react';
import { SelectorGenerator } from './components/SelectorGenerator';

function App() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <header
        style={{
          backgroundColor: '#343a40',
          color: 'white',
          padding: '20px',
          textAlign: 'center',
        }}
      >
        <h1>Agent 1: CSS Selector Builder</h1>
        <p style={{ margin: '10px 0 0 0', opacity: 0.9 }}>
          Generate, validate, and optimize CSS selectors for web automation
        </p>
      </header>

      <main style={{ padding: '40px 20px' }}>
        <SelectorGenerator />
      </main>

      <footer
        style={{
          backgroundColor: '#343a40',
          color: 'white',
          padding: '20px',
          textAlign: 'center',
          marginTop: '40px',
        }}
      >
        <p style={{ margin: 0, fontSize: '14px', opacity: 0.8 }}>
          Workstation Agent System - Agent 1: CSS Selector Builder
        </p>
      </footer>
    </div>
  );
}

export default App;
