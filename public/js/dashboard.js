// Dashboard JavaScript
const API_BASE = window.location.origin;
let authToken = localStorage.getItem('authToken');
let currentWorkflowId = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
    if (!authToken) {
        window.location.href = '/login.html';
        return;
    }

    await loadUserInfo();
    await loadDashboardStats();
    setupEventListeners();
    setupNavigation();
});

// Setup navigation
function setupNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            showView(view);
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

function showView(viewName) {
    document.querySelectorAll('.view-content').forEach(v => v.classList.remove('active'));
    document.getElementById(`${viewName}-view`).classList.add('active');
    
    if (viewName === 'workflows') loadWorkflows();
    if (viewName === 'agents') loadAgents();
    if (viewName === 'analytics') setupAnalytics();
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('logout-btn').addEventListener('click', logout);
    document.getElementById('create-workflow-btn').addEventListener('click', () => openWorkflowModal());
    document.getElementById('workflow-category-filter').addEventListener('change', loadWorkflows);
    document.getElementById('refresh-agents-btn').addEventListener('click', loadAgents);
    document.getElementById('load-analytics-btn').addEventListener('click', loadAnalytics);
    document.querySelector('.close-modal').addEventListener('click', closeWorkflowModal);
    document.querySelector('.cancel-btn').addEventListener('click', closeWorkflowModal);
    document.getElementById('workflow-form').addEventListener('submit', saveWorkflow);
    document.getElementById('add-action-btn').addEventListener('click', addActionField);
}

// Load user info
async function loadUserInfo() {
    try {
        const response = await fetch(`${API_BASE}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (response.ok) {
            const data = await response.json();
            document.getElementById('user-info').textContent = data.user.email;
        }
    } catch (error) {
        console.error('Error loading user info:', error);
    }
}

// Load dashboard statistics
async function loadDashboardStats() {
    try {
        const response = await fetch(`${API_BASE}/api/dashboard`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (response.ok) {
            const data = await response.json();
            displayDashboardStats(data);
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

function displayDashboardStats(data) {
    document.getElementById('total-workflows').textContent = data.totalWorkflows || 0;
    document.getElementById('total-executions').textContent = data.totalExecutions || 0;
    const successRate = data.totalExecutions > 0 
        ? ((data.successfulExecutions / data.totalExecutions) * 100).toFixed(1)
        : 0;
    document.getElementById('success-rate').textContent = `${successRate}%`;
    
    // Recent executions
    const executionsList = document.getElementById('recent-executions-list');
    if (data.recentExecutions && data.recentExecutions.length > 0) {
        executionsList.innerHTML = data.recentExecutions.map(exec => `
            <div class="execution-item">
                <div>
                    <div class="execution-name">${exec.workflow_name || 'Workflow'}</div>
                    <div class="execution-time">${new Date(exec.created_at).toLocaleString()}</div>
                </div>
                <span class="execution-status status-${exec.status}">${exec.status}</span>
            </div>
        `).join('');
    } else {
        executionsList.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><p>No executions yet</p></div>';
    }
    
    // Agent system status
    loadAgentSystemStatus();
}

async function loadAgentSystemStatus() {
    try {
        const response = await fetch(`${API_BASE}/api/agents/system/overview`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (response.ok) {
            const data = await response.json();
            const statusDiv = document.getElementById('agent-system-status');
            document.getElementById('active-agents').textContent = `${data.runningAgents || 0}/21`;
            
            statusDiv.innerHTML = `
                <div class="status-row">
                    <span>Total Agents</span>
                    <strong>${data.totalAgents || 21}</strong>
                </div>
                <div class="status-row">
                    <span>Running</span>
                    <strong style="color: #155724">${data.runningAgents || 0}</strong>
                </div>
                <div class="status-row">
                    <span>Healthy</span>
                    <strong style="color: #155724">${data.healthyAgents || 0}</strong>
                </div>
                <div class="status-row">
                    <span>Pending Tasks</span>
                    <strong>${data.pendingTasks || 0}</strong>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading agent system status:', error);
    }
}

// Workflows
async function loadWorkflows() {
    const category = document.getElementById('workflow-category-filter').value;
    const url = category 
        ? `${API_BASE}/api/workflows?category=${category}`
        : `${API_BASE}/api/workflows`;
    
    try {
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (response.ok) {
            const data = await response.json();
            displayWorkflows(data.workflows || []);
        }
    } catch (error) {
        console.error('Error loading workflows:', error);
    }
}

function displayWorkflows(workflows) {
    const workflowsList = document.getElementById('workflows-list');
    if (workflows.length === 0) {
        workflowsList.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📋</div><p>No workflows yet. Create your first workflow!</p></div>';
        return;
    }
    
    workflowsList.innerHTML = workflows.map(wf => `
        <div class="workflow-card">
            <div class="workflow-header">
                <div class="workflow-title">${wf.name}</div>
                <span class="workflow-category">${wf.category}</span>
            </div>
            <div class="workflow-stats">
                <span>⚡ ${wf.total_executions || 0} executions</span>
                <span>✅ ${wf.success_rate || 0}% success</span>
                <span>⏱️ ${wf.avg_duration ? (wf.avg_duration / 1000).toFixed(2) + 's' : 'N/A'}</span>
            </div>
            <div class="workflow-actions-bar">
                <button class="btn btn-primary btn-small" onclick="executeWorkflow(${wf.id})">▶️ Run</button>
                <button class="btn btn-secondary btn-small" onclick="editWorkflow(${wf.id})">✏️ Edit</button>
                <button class="btn btn-secondary btn-small" onclick="deleteWorkflow(${wf.id})">🗑️ Delete</button>
            </div>
        </div>
    `).join('');
}

// Agents
async function loadAgents() {
    try {
        const response = await fetch(`${API_BASE}/api/agents`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (response.ok) {
            const data = await response.json();
            displayAgents(data.agents || []);
        }
    } catch (error) {
        console.error('Error loading agents:', error);
    }
}

function displayAgents(agents) {
    const agentsList = document.getElementById('agents-list');
    agentsList.innerHTML = agents.map(agent => `
        <div class="agent-card">
            <div class="agent-header">
                <div>
                    <div class="agent-name">${agent.name}</div>
                    <small>${agent.capabilities || 'General automation'}</small>
                </div>
                <span class="agent-status-badge status-${agent.status}">${agent.status}</span>
            </div>
            <div style="font-size: 0.9rem; color: #7f8c9a; margin-top: 0.5rem;">
                Health: ${agent.health_status || 'unknown'}
            </div>
            <div class="agent-stats-row">
                <span>Tasks: ${agent.tasks_count || 0}</span>
                <span>Success: ${agent.success_rate || 0}%</span>
            </div>
        </div>
    `).join('');
}

// Analytics
function setupAnalytics() {
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    document.getElementById('analytics-start-date').value = thirtyDaysAgo;
    document.getElementById('analytics-end-date').value = today;
}

async function loadAnalytics() {
    const startDate = document.getElementById('analytics-start-date').value;
    const endDate = document.getElementById('analytics-end-date').value;
    
    try {
        const response = await fetch(
            `${API_BASE}/api/dashboard/analytics?startDate=${startDate}&endDate=${endDate}`,
            { headers: { 'Authorization': `Bearer ${authToken}` } }
        );
        if (response.ok) {
            const data = await response.json();
            displayAnalytics(data.analytics || []);
        }
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

function displayAnalytics(analytics) {
    const content = document.getElementById('analytics-content');
    if (analytics.length === 0) {
        content.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📊</div><p>No analytics data for selected date range</p></div>';
        return;
    }
    
    const totalExecs = analytics.reduce((sum, day) => sum + day.total_executions, 0);
    const avgSuccess = analytics.length > 0 
        ? analytics.reduce((sum, day) => sum + parseFloat(day.success_rate), 0) / analytics.length
        : 0;
    
    content.innerHTML = `
        <div class="analytics-grid">
            <div class="analytics-card">
                <h3>Total Executions</h3>
                <div class="stat-value">${totalExecs}</div>
            </div>
            <div class="analytics-card">
                <h3>Avg Success Rate</h3>
                <div class="stat-value">${avgSuccess.toFixed(1)}%</div>
            </div>
            <div class="analytics-card">
                <h3>Unique Workflows</h3>
                <div class="stat-value">${analytics[0]?.unique_workflows || 0}</div>
            </div>
        </div>
    `;
}

// Modal functions
function openWorkflowModal(workflowId = null) {
    currentWorkflowId = workflowId;
    document.getElementById('workflow-modal').classList.add('active');
    document.getElementById('modal-title').textContent = workflowId ? 'Edit Workflow' : 'Create Workflow';
    document.getElementById('workflow-actions').innerHTML = '';
    
    if (workflowId) {
        // Load workflow data
        loadWorkflowForEdit(workflowId);
    } else {
        document.getElementById('workflow-form').reset();
    }
}

function closeWorkflowModal() {
    document.getElementById('workflow-modal').classList.remove('active');
    currentWorkflowId = null;
}

function addActionField() {
    const actionsList = document.getElementById('workflow-actions');
    const actionId = Date.now();
    const actionHTML = `
        <div class="action-item" data-action-id="${actionId}">
            <select class="action-type">
                <option value="navigate">Navigate</option>
                <option value="click">Click</option>
                <option value="fill">Fill</option>
                <option value="wait">Wait</option>
                <option value="screenshot">Screenshot</option>
            </select>
            <input type="text" placeholder="Value/URL" class="action-value" style="flex: 1; margin-left: 0.5rem;">
            <button type="button" class="btn btn-secondary btn-small" onclick="this.parentElement.remove()">Remove</button>
        </div>
    `;
    actionsList.insertAdjacentHTML('beforeend', actionHTML);
}

async function saveWorkflow(e) {
    e.preventDefault();
    
    const name = document.getElementById('workflow-name').value;
    const category = document.getElementById('workflow-category').value;
    const description = document.getElementById('workflow-description').value;
    
    const actions = Array.from(document.querySelectorAll('.action-item')).map(item => ({
        type: item.querySelector('.action-type').value,
        value: item.querySelector('.action-value').value
    }));
    
    const method = currentWorkflowId ? 'PUT' : 'POST';
    const url = currentWorkflowId 
        ? `${API_BASE}/api/workflows/${currentWorkflowId}`
        : `${API_BASE}/api/workflows`;
    
    try {
        const response = await fetch(url, {
            method,
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, category, description, actions })
        });
        
        if (response.ok) {
            closeWorkflowModal();
            loadWorkflows();
        } else {
            alert('Error saving workflow');
        }
    } catch (error) {
        console.error('Error saving workflow:', error);
        alert('Error saving workflow');
    }
}

async function executeWorkflow(workflowId) {
    // Integration with existing execution system
    alert(`Execute workflow ${workflowId} - Integration with execution API needed`);
}

async function editWorkflow(workflowId) {
    openWorkflowModal(workflowId);
}

async function deleteWorkflow(workflowId) {
    if (!confirm('Are you sure you want to delete this workflow?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/api/workflows/${workflowId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (response.ok) {
            loadWorkflows();
        }
    } catch (error) {
        console.error('Error deleting workflow:', error);
    }
}

async function loadWorkflowForEdit(workflowId) {
    try {
        const response = await fetch(`${API_BASE}/api/workflows/${workflowId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (response.ok) {
            const data = await response.json();
            const wf = data.workflow;
            document.getElementById('workflow-name').value = wf.name;
            document.getElementById('workflow-category').value = wf.category;
            document.getElementById('workflow-description').value = wf.description || '';
            
            const actionsList = document.getElementById('workflow-actions');
            actionsList.innerHTML = '';
            if (wf.actions && wf.actions.length > 0) {
                wf.actions.forEach(action => {
                    addActionField();
                    const lastAction = actionsList.lastElementChild;
                    lastAction.querySelector('.action-type').value = action.type;
                    lastAction.querySelector('.action-value').value = action.value;
                });
            }
        }
    } catch (error) {
        console.error('Error loading workflow:', error);
    }
}

function logout() {
    localStorage.removeItem('authToken');
    window.location.href = '/login.html';
}
