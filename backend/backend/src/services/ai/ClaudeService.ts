import Anthropic from '@anthropic-ai/sdk';
import { config } from '../../config/env';
import logger from '../../utils/logger';
import { AppError } from '../../middleware/errorHandler';

export class ClaudeService {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: config.ANTHROPIC_API_KEY,
    });
  }

  // Generic Claude API call
  async sendMessage(
    prompt: string,
    systemPrompt?: string,
    maxTokens: number = 2048
  ): Promise<{
    content: string;
    usage: { input_tokens: number; output_tokens: number };
  }> {
    try {
      const startTime = Date.now();

      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const latency = Date.now() - startTime;

      logger.info('Claude API call successful', {
        latency,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      });

      const content = response.content[0].type === 'text' 
        ? response.content[0].text 
        : '';

      return {
        content,
        usage: {
          input_tokens: response.usage.input_tokens,
          output_tokens: response.usage.output_tokens,
        },
      };
    } catch (error: any) {
      logger.error('Claude API error:', error);
      
      if (error.status === 429) {
        throw new AppError(429, 'AI service rate limit exceeded');
      }
      
      throw new AppError(500, 'AI service unavailable');
    }
  }


  parseJsonResponse(content: string): any {
    try {

      const cleaned = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      return JSON.parse(cleaned);
    } catch (error) {
      logger.error('JSON parsing error:', { content, error });
      throw new AppError(500, 'Failed to parse AI response');
    }
  }
}

export default new ClaudeService();