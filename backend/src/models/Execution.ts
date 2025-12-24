import mongoose, { Document, Schema } from 'mongoose';
import { ExecutionStatus, StepStatus, StepType } from '../types/workflow.types';

export interface IExecution extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  workflowId: mongoose.Types.ObjectId;
  trigger: {
    type: string;
    data: any;
  };
  steps: Array<{
    type: StepType;
    status: StepStatus;
    input: any;
    output: any;
    aiMetadata?: {
      intent: string;
      confidence: number;
      reasoning: string;
      keywords?: string[];
      urgencyScore?: number;
    };
    duration: number;
    error?: string;
    timestamp: Date;
  }>;
  status: ExecutionStatus;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
}

const ExecutionSchema = new Schema<IExecution>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    workflowId: {
      type: Schema.Types.ObjectId,
      ref: 'Workflow',
      required: true,
      index: true,
    },
    trigger: {
      type: { type: String, required: true },
      data: Schema.Types.Mixed,
    },
    steps: [
      {
        type: {
          type: String,
          enum: Object.values(StepType),
          required: true,
        },
        status: {
          type: String,
          enum: Object.values(StepStatus),
          required: true,
        },
        input: Schema.Types.Mixed,
        output: Schema.Types.Mixed,
        aiMetadata: {
          intent: String,
          confidence: Number,
          reasoning: String,
          keywords: [String],
          urgencyScore: Number,
        },
        duration: Number,
        error: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: Object.values(ExecutionStatus),
      default: ExecutionStatus.RUNNING,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: Date,
    duration: Number,
  },
  {
    timestamps: true,
  }
);

ExecutionSchema.index({ organizationId: 1, workflowId: 1, createdAt: -1 });
ExecutionSchema.index({ organizationId: 1, status: 1 });

export default mongoose.model<IExecution>('Execution', ExecutionSchema);