import ClaudeService from './ClaudeService';
import logger from '../../utils/logger';

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
    "operator": "contains" | "equals" | "matches_intent" | "greater_than" | "less_than",
    "value": "string or number",
    "confidence": 0.0-1.0
  }],
  "actions": [{
    "type": "email" | "webhook" | "notification" | "log",
    "config": {
      "to": "email if type is email",
      "subject": "subject if type is email",
      "body": "message content",
      "url": "url if type is webhook"
    },
    "order": 1
  }],
  "intent": "urgent" | "complaint" | "query" | "feedback" | "general",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of your choices"
}

Rules:
- Use "matches_intent" operator for intent-based conditions
- Assign confidence scores based on clarity of the description
- Default trigger is "webhook" unless scheduling is mentioned
- Extract specific email addresses and URLs if mentioned
- If email/notification recipient is not specified, use placeholder "{{user.email}}"`;

export class WorkflowParser {
  async parseNaturalLanguage(naturalLanguage: string) {
    try {
      logger.info('Parsing workflow from natural language', { naturalLanguage });

      const prompt = `Natural language workflow description:
"${naturalLanguage}"

Convert this into a structured workflow JSON.`;

      const response = await ClaudeService.sendMessage(
        prompt,
        WORKFLOW_PARSER_SYSTEM_PROMPT,
        1500
      );

      const parsed = ClaudeService.parseJsonResponse(response.content);

      // Validate parsed structure
      this.validateParsedWorkflow(parsed);

      logger.info('Workflow parsed successfully', { 
        intent: parsed.intent, 
        confidence: parsed.confidence 
      });

      return {
        workflow: parsed,
        tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
      };
    } catch (error) {
      logger.error('Workflow parsing error:', error);
      throw error;
    }
  }

  private validateParsedWorkflow(workflow: any) {
    if (!workflow.trigger || !workflow.trigger.type) {
      throw new Error('Invalid trigger in parsed workflow');
    }

    if (!Array.isArray(workflow.actions) || workflow.actions.length === 0) {
      throw new Error('No actions defined in parsed workflow');
    }

    if (!workflow.intent || !workflow.confidence) {
      throw new Error('Missing intent classification in parsed workflow');
    }

    if (workflow.confidence < 0 || workflow.confidence > 1) {
      throw new Error('Invalid confidence score');
    }
  }
}

export default new WorkflowParser();