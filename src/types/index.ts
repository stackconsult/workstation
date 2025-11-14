// Core types for the unified browser agent system

export enum AgentType {
  NAVIGATOR = 'navigator',
  PLANNER = 'planner',
  VALIDATOR = 'validator',
  EXECUTOR = 'executor',
  EXTRACTOR = 'extractor',
  ANALYZER = 'analyzer',
}

export enum AgentStatus {
  IDLE = 'idle',
  THINKING = 'thinking',
  EXECUTING = 'executing',
  WAITING = 'waiting',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export interface AgentConfig {
  id: string;
  type: AgentType;
  name: string;
  description: string;
  capabilities: string[];
  systemPrompt?: string;
}

export interface Task {
  id: string;
  type: string;
  description: string;
  priority: TaskPriority;
  assignedAgentId?: string;
  status: AgentStatus;
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface AgentMessage {
  id: string;
  from: string;
  to: string;
  type: 'task' | 'result' | 'status' | 'error';
  payload: any;
  timestamp: Date;
}

export interface WorkflowStep {
  id: string;
  type: string;
  config: Record<string, any>;
  nextSteps?: string[];
  onSuccess?: string;
  onError?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  initialStep: string;
}

// LLM Provider types
export enum LLMProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GEMINI = 'gemini',
  GROQ = 'groq',
  OLLAMA = 'ollama',
  CUSTOM = 'custom',
}

export interface LLMConfig {
  provider: LLMProvider;
  apiKey?: string;
  baseUrl?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  finishReason: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// Browser automation types
export interface BrowserAction {
  type: 'click' | 'type' | 'navigate' | 'extract' | 'scroll' | 'wait' | 'screenshot';
  selector?: string;
  value?: string;
  options?: Record<string, any>;
}

export interface PageElement {
  selector: string;
  tagName: string;
  text?: string;
  value?: string;
  attributes: Record<string, string>;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ExtractionResult {
  elements: PageElement[];
  text?: string;
  html?: string;
  screenshot?: string;
  metadata: Record<string, any>;
}

// Storage types
export interface UserSettings {
  llmConfigs: Record<string, LLMConfig>;
  defaultProvider: LLMProvider;
  privacyMode: 'local-only' | 'cloud-allowed';
  autoExecute: boolean;
  confirmActions: boolean;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
  agentType?: AgentType;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ConversationMessage[];
  createdAt: Date;
  updatedAt: Date;
}
