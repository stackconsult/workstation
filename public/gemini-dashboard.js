// Gemini Dashboard - creditXcredit/workstation
const API = window.location.origin;
let workflow = null;
let token = null;


// Helper to escape HTML entities to prevent XSS
function escapeHTML(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function getToken() {
  if (token) return token;
  try {
    const r = await fetch(`${API}/auth/demo-token`);
    const d = await r.json();
    token = d.token;
    updateStatus(true);
    return token;
  } catch (e) {
    updateStatus(false, 'Auth failed');
    throw e;
  }
}

function updateStatus(ok, msg) {
  const el = document.getElementById('status');
  el.innerHTML = ok 
    ? '<span class="w-2 h-2 rounded-full bg-green-400"></span><span class="text-sm">Connected</span>'
    : `<span class="w-2 h-2 rounded-full bg-red-400"></span><span class="text-sm">${msg || 'Disconnected'}</span>`;
}

function addMsg(role, content, isWf = false) {
  const div = document.getElementById('messages');
  const empty = document.getElementById('emptyState');
  if (empty) empty.remove();

  const msg = document.createElement('div');
  msg.className = `fade-in ${role === 'user' ? 'flex justify-end' : 'flex justify-start'}`;

  let html;
  if (isWf) {
    // Escape workflow content before embedding as JSON in HTML
    html = `<div class="text-green-400 mb-2"><i class="fas fa-check-circle mr-1"></i>Workflow generated!</div>
            <pre class="text-xs bg-gray-900 p-2 rounded overflow-auto max-h-32">${escapeHTML(JSON.stringify(content, null, 2))}</pre>`;
  } else {
    // Escape user/assistant content before embedding
    html = escapeHTML(content);
  }

  msg.innerHTML = `<div class="max-w-[85%] px-4 py-3 rounded-2xl ${role === 'user' ? 'bg-blue-600 rounded-br-sm' : 'bg-gray-700 rounded-bl-sm'}">
    ${role !== 'user' ? '<i class="fas fa-robot text-purple-400 mr-2"></i>' : ''}${html}</div>`;
  div.appendChild(msg);
  div.scrollTop = div.scrollHeight;
}

function showTyping() {
  const div = document.getElementById('messages');
  const t = document.createElement('div');
  t.id = 'typing';
  t.className = 'flex justify-start fade-in';
  t.innerHTML = '<div class="bg-gray-700 px-4 py-3 rounded-2xl rounded-bl-sm"><span class="typing"><span class="inline-block w-2 h-2 bg-gray-400 rounded-full"></span><span class="inline-block w-2 h-2 bg-gray-400 rounded-full mx-1"></span><span class="inline-block w-2 h-2 bg-gray-400 rounded-full"></span></span></div>';
  div.appendChild(t);
  div.scrollTop = div.scrollHeight;
}

function hideTyping() {
  const t = document.getElementById('typing');
  if (t) t.remove();
}

async function send(prompt) {
  const t = await getToken();
  addMsg('user', prompt);
  showTyping();
  setLoading(true);

  try {
    const r = await fetch(`${API}/api/gemini/natural-workflow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` },
      body: JSON.stringify({ prompt })
    });
    const d = await r.json();
    hideTyping();

    if (d.success && d.workflow) {
      workflow = d.workflow;
      document.getElementById('workflow').textContent = JSON.stringify(workflow, null, 2);
      document.getElementById('execBtn').disabled = false;
      document.getElementById('saveBtn').disabled = false;
      addMsg('assistant', workflow, true);
    } else {
      addMsg('assistant', `<span class="text-red-400"><i class="fas fa-exclamation-triangle mr-2"></i>${d.error || 'Failed'}</span>`);
    }
  } catch (e) {
    hideTyping();
    addMsg('assistant', `<span class="text-red-400">Error: ${e.message}</span>`);
  } finally {
    setLoading(false);
  }
}

async function execute() {
  if (!workflow) return;
  const t = await getToken();
  setLoading(true);
  addMsg('assistant', '<i class="fas fa-spinner fa-spin mr-2"></i>Executing...');

  try {
    const cr = await fetch(`${API}/api/v2/workflows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` },
      body: JSON.stringify({ name: workflow.name, description: workflow.description, definition: { tasks: workflow.tasks } })
    });
    const cd = await cr.json();
    if (!cd.workflow_id) throw new Error('Failed to create workflow');

    const er = await fetch(`${API}/api/v2/workflows/${cd.workflow_id}/execute`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${t}` }
    });
    const ed = await er.json();
    if (!ed.execution_id) throw new Error('Failed to execute');

    poll(ed.execution_id, t);
  } catch (e) {
    setLoading(false);
    addMsg('assistant', `<span class="text-red-400">Execution failed: ${e.message}</span>`);
  }
}

async function poll(id, t, attempts = 0) {
  if (attempts > 60) { setLoading(false); addMsg('assistant', '<span class="text-yellow-400">Timeout</span>'); return; }

  try {
    const r = await fetch(`${API}/api/v2/executions/${id}`, { headers: { 'Authorization': `Bearer ${t}` } });
    const d = await r.json();

    if (d.status === 'completed' || d.status === 'failed') {
      setLoading(false);
      showResult(d);
      addMsg('assistant', d.status === 'completed' 
        ? '<span class="text-green-400"><i class="fas fa-check-circle mr-2"></i>Complete!</span>'
        : `<span class="text-red-400">Failed: ${d.error}</span>`);
    } else {
      setTimeout(() => poll(id, t, attempts + 1), 1000);
    }
  } catch (e) {
    setLoading(false);
    addMsg('assistant', `<span class="text-red-400">Poll error: ${e.message}</span>`);
  }
}

async function showResult(data) {
  const panel = document.getElementById('result');
  const content = document.getElementById('resultContent');
  panel.classList.remove('hidden');

  try {
    const t = await getToken();
    const r = await fetch(`${API}/api/gemini/generate-display`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` },
      body: JSON.stringify({ workflowResult: data })
    });
    const d = await r.json();
    content.innerHTML = d.success && d.html ? d.html : `<pre class="text-sm">${JSON.stringify(data, null, 2)}</pre>`;
  } catch {
    content.innerHTML = `<pre class="text-sm">${JSON.stringify(data, null, 2)}</pre>`;
  }
}

function setLoading(loading) {
  const send = document.getElementById('sendBtn');
  const exec = document.getElementById('execBtn');
  send.disabled = loading;
  exec.disabled = loading || !workflow;
  send.innerHTML = loading ? '<i class="fas fa-spinner fa-spin"></i>' : '<i class="fas fa-paper-plane"></i>';
}

function clear() {
  document.getElementById('messages').innerHTML = '<div class="text-center text-gray-500 py-8" id="emptyState"><i class="fas fa-magic text-4xl mb-4"></i><p>Describe what you want to automate</p></div>';
  workflow = null;
  document.getElementById('workflow').textContent = '// Generated workflow appears here';
  document.getElementById('result').classList.add('hidden');
  document.getElementById('execBtn').disabled = true;
  document.getElementById('saveBtn').disabled = true;
}

document.addEventListener('DOMContentLoaded', () => {
  getToken();

  document.getElementById('sendBtn').onclick = () => {
    const input = document.getElementById('prompt');
    const p = input.value.trim();
    if (p) { send(p); input.value = ''; }
  };

  document.getElementById('prompt').onkeypress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); document.getElementById('sendBtn').click(); }
  };

  document.getElementById('execBtn').onclick = execute;
  document.getElementById('clearBtn').onclick = clear;

  document.querySelectorAll('.quick').forEach(b => {
    b.onclick = () => { document.getElementById('prompt').value = b.dataset.p; document.getElementById('sendBtn').click(); };
  });

  document.getElementById('saveBtn').onclick = () => {
    if (!workflow) return;
    const saved = JSON.parse(localStorage.getItem('workflows') || '[]');
    saved.push({ ...workflow, savedAt: new Date().toISOString() });
    localStorage.setItem('workflows', JSON.stringify(saved));
    addMsg('assistant', '<span class="text-green-400"><i class="fas fa-save mr-2"></i>Saved!</span>');
  };
});
