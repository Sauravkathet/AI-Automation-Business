import mongoose, { Document, Schema } from 'mongoose';

export interface IAIAnalysis extends Document {
  organizationId: mongoose.Types.ObjectId;
  executionId: mongoose.Types.ObjectId;
  inputText: string;
  detectedIntent: string;
  confidence: number;
  reasoning: string;
  alternativeIntents: Array<{
    intent: string;
    confidence: number;
  }>;
  modelUsed: string;
  tokensUsed: number;
  latency: number;
  createdAt: Date;
}

const AIAnalysisSchema = new Schema<IAIAnalysis>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    executionId: {
      type: Schema.Types.ObjectId,
      ref: 'Execution',
      required: true,
      index: true,
    },
    inputText: {
      type: String,
      required: true,
    },
    detectedIntent: {
      type: String,
      required: true,
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    reasoning: {
      type: String,
      required: true,
    },
    alternativeIntents: [
      {
        intent: String,
        confidence: Number,
      },
    ],
    modelUsed: {
      type: String,
      required: true,
    },
    tokensUsed: {
      type: Number,
      required: true,
    },
    latency: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IAIAnalysis>('AIAnalysis', AIAnalysisSchema);