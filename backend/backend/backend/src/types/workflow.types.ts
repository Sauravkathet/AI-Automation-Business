export enum TriggerType {
  WEBHOOK = 'webhook',
  SCHEDULE = 'schedule',
  MANUAL = 'manual',
}

export enum ConditionOperator {
  CONTAINS = 'contains',
  EQUALS = 'equals',
  MATCHES_INTENT = 'matches_intent',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
}

export enum ActionType {
  EMAIL = 'email',
  WEBHOOK = 'webhook',
  NOTIFICATION = 'notification',
  LOG = 'log',
}

export enum WorkflowStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  ARCHIVED = 'archived',
}

export enum ExecutionStatus {
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum StepStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

export enum StepType {
  CONDITION_CHECK = 'condition_check',
  ACTION_EXECUTE = 'action_execute',
  AI_ANALYSIS = 'ai_analysis',
}

export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

export enum OrganizationPlan {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

export interface TriggerConfig {
  type: TriggerType;
  config: {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    cron?: string;
  };
}

export interface WorkflowCondition {
  field: string;
  operator: ConditionOperator;
  value: string | number;
  aiIntent?: string;
  confidence?: number;
}

export interface WorkflowAction {
  type: ActionType;
  config: {
    to?: string;
    subject?: string;
    body?: string;
    url?: string;
    method?: string;
    payload?: any;
  };
  order: number;
}

export interface AIMetadata {
  intent: string;
  confidence: number;
  reasoning: string;
  keywords?: string[];
  urgencyScore?: number;
}

export interface ExecutionStep {
  type: StepType;
  status: StepStatus;
  input: any;
  output: any;
  aiMetadata?: AIMetadata;
  duration: number;
  error?: string;
  timestamp: Date;
}