/**
 * Node Editor Component
 * Edit node properties and parameters
 */

import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';

interface NodeEditorProps {
  node: Node;
  onUpdate: (nodeId: string, data: any) => void;
  onDelete: () => void;
}

export const NodeEditor: React.FC<NodeEditorProps> = ({
  node,
  onUpdate,
  onDelete,
}) => {
  const [label, setLabel] = useState(node.data.label || '');
  const [params, setParams] = useState(node.data.params || {});

  useEffect(() => {
    setLabel(node.data.label || '');
    setParams(node.data.params || {});
  }, [node]);

  const handleLabelChange = (newLabel: string) => {
    setLabel(newLabel);
    onUpdate(node.id, { label: newLabel });
  };

  const handleParamChange = (key: string, value: any) => {
    const newParams = { ...params, [key]: value };
    setParams(newParams);
    onUpdate(node.id, { params: newParams });
  };

  const addParam = () => {
    const key = prompt('Parameter name:');
    if (key) {
      handleParamChange(key, '');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h3>Edit Node</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Label
        </label>
        <input
          type="text"
          value={label}
          onChange={(e) => handleLabelChange(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Type
        </label>
        <input
          type="text"
          value={node.type || 'action'}
          disabled
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            background: '#f5f5f5',
          }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <label style={{ fontWeight: 'bold' }}>Parameters</label>
          <button onClick={addParam} style={{ fontSize: '12px', padding: '4px 8px' }}>
            + Add
          </button>
        </div>
        
        {Object.entries(params).map(([key, value]) => (
          <div key={key} style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '3px' }}>
              {key}
            </label>
            <input
              type="text"
              value={String(value)}
              onChange={(e) => handleParamChange(key, e.target.value)}
              style={{
                width: '100%',
                padding: '6px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            />
          </div>
        ))}
      </div>

      <button
        onClick={onDelete}
        style={{
          width: '100%',
          padding: '10px',
          background: '#f44336',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold',
        }}
      >
        🗑️ Delete Node
      </button>
    </div>
  );
};
