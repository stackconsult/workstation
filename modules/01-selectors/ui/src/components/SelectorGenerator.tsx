import React, { useState } from 'react';
import axios from 'axios';

interface SelectorResult {
  selector: string;
  confidence?: number;
  method?: string;
  matchCount?: number;
  valid?: boolean;
}

export function SelectorGenerator() {
  const [url, setUrl] = useState('');
  const [targetText, setTargetText] = useState('');
  const [selector, setSelector] = useState<SelectorResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateSelector = async () => {
    if (!url) {
      setError('URL is required');
      return;
    }

    setLoading(true);
    setError('');
    setSelector(null);

    try {
      const response = await axios.post('/api/selectors/generate', {
        url,
        targetText: targetText || undefined,
      });
      setSelector(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate selector');
    } finally {
      setLoading(false);
    }
  };

  const validateSelector = async (selectorToValidate: string) => {
    if (!url || !selectorToValidate) return;

    setLoading(true);
    try {
      const response = await axios.post('/api/selectors/validate', {
        url,
        selector: selectorToValidate,
      });
      setSelector(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Validation failed');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>CSS Selector Generator</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          <strong>Target URL:</strong>
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '14px',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          <strong>Target Text (optional):</strong>
        </label>
        <input
          type="text"
          value={targetText}
          onChange={(e) => setTargetText(e.target.value)}
          placeholder="Text content of the element"
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '14px',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}
        />
      </div>

      <button
        onClick={generateSelector}
        disabled={loading || !url}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          backgroundColor: loading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Generating...' : 'Generate Selector'}
      </button>

      {error && (
        <div
          style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '4px',
            color: '#721c24',
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {selector && (
        <div
          style={{
            marginTop: '20px',
            padding: '20px',
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '4px',
          }}
        >
          <h3>Generated Selector:</h3>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginTop: '10px',
            }}
          >
            <code
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#fff',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '14px',
              }}
            >
              {selector.selector}
            </code>
            <button
              onClick={() => copyToClipboard(selector.selector)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Copy
            </button>
          </div>

          {selector.confidence !== undefined && (
            <div style={{ marginTop: '15px' }}>
              <strong>Confidence:</strong> {(selector.confidence * 100).toFixed(0)}%
            </div>
          )}

          {selector.method && (
            <div style={{ marginTop: '5px' }}>
              <strong>Method:</strong> {selector.method}
            </div>
          )}

          {selector.matchCount !== undefined && (
            <div style={{ marginTop: '5px' }}>
              <strong>Matches:</strong> {selector.matchCount}
            </div>
          )}

          {selector.valid !== undefined && (
            <div style={{ marginTop: '5px' }}>
              <strong>Valid:</strong>{' '}
              <span style={{ color: selector.valid ? '#28a745' : '#dc3545' }}>
                {selector.valid ? 'Yes' : 'No'}
              </span>
            </div>
          )}

          <button
            onClick={() => validateSelector(selector.selector)}
            style={{
              marginTop: '15px',
              padding: '10px 20px',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Validate Selector
          </button>
        </div>
      )}
    </div>
  );
}
