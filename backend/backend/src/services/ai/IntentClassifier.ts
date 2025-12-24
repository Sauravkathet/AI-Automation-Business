import ClaudeService from './ClaudeService';
import logger from '../../utils/logger';
import { AIMetadata } from '../../types/workflow.types';

const INTENT_CLASSIFIER_SYSTEM_PROMPT = `You are an expert at analyzing customer messages and classifying their intent with high accuracy.

Analyze the message and classify its intent into ONE of these categories:
- **urgent**: Requires immediate attention (angry, time-sensitive, critical issues)
- **complaint**: Customer dissatisfaction (problems, frustration, but not urgent)
- **query**: Information request (questions, clarifications)
- **feedback**: General feedback (suggestions, praise, comments)
- **spam**: Irrelevant or promotional content

Return ONLY a valid JSON object:

{
  "intent": "urgent" | "complaint" | "query" | "feedback" | "spam",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of classification",
  "keywords": ["key", "phrases", "found"],
  "urgencyScore": 0-10,
  "alternativeIntents": [
    {"intent": "string", "confidence": 0.0-1.0}
  ]
}

Scoring guidelines:
- Confidence >0.85: Very clear intent
- Confidence 0.7-0.85: Probable intent
- Confidence <0.7: Ambiguous, needs human review
- UrgencyScore: 0 (not urgent) to 10 (critical emergency)`;

export class IntentClassifier {
  async classifyIntent(message: string): Promise<AIMetadata> {
    try {
      logger.info('Classifying message intent', { 
        messageLength: message.length 
      });

      const prompt = `Message to classify:
"${message}"

Classify this message's intent.`;

      const response = await ClaudeService.sendMessage(
        prompt,
        INTENT_CLASSIFIER_SYSTEM_PROMPT,
        800
      );

      const classification = ClaudeService.parseJsonResponse(response.content);

      logger.info('Intent classified', {
        intent: classification.intent,
        confidence: classification.confidence,
        urgencyScore: classification.urgencyScore,
      });

      return {
        intent: classification.intent,
        confidence: classification.confidence,
        reasoning: classification.reasoning,
        keywords: classification.keywords,
        urgencyScore: classification.urgencyScore,
      };
    } catch (error) {
      logger.error('Intent classification error:', error);
      throw error;
    }
  }

  // Batch classification for multiple messages
  async classifyBatch(messages: string[]): Promise<AIMetadata[]> {
    try {
      const classifications = await Promise.all(
        messages.map(msg => this.classifyIntent(msg))
      );

      return classifications;
    } catch (error) {
      logger.error('Batch classification error:', error);
      throw error;
    }
  }
}

export default new IntentClassifier();