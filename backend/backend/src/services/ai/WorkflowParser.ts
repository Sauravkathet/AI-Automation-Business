import ClaudeService from './ClaudeService';
import logger from '../../utils/logger';
import { TriggerType, ActionType, ConditionOperator } from '../../types/workflow.types';

const WORKFLOW_PARSER_SYSTEM_PROMPT = `You are an expert at converting natural language business workflow descriptions into structured automation rules.

Your task is to analyze the user's workflow description and extract:
1. **Trigger**: What initiates the workflow (webhook, schedule, or manual)
2. **Conditions**: What criteria must be met for the workflow to execute
3. **Actions**: What should happen when conditions are met
4. **Intent Classification**: The primary intent (urgent, complaint, query, feedback, general)

Return ONLY a valid JSON object with this exact structure:

{
  "trigger": {
    "type": "webhook" | "schedule" | "manual",
    "config": {}
  },
  "conditions": [{
    "field": "message.text",
    "operator": "contains" | "equals" | "matches_intent" |