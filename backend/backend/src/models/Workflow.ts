import mongoose, { Document, Schema } from 'mongoose';
import {
  TriggerType,
  ConditionOperator,
  ActionType,
  WorkflowStatus,
} from '../types/workflow.types';

export interface IWorkflow extends Document {
  organizationId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  createdBy: mongoose.Types.ObjectId;
  naturalLanguage?: string;
  trigger: {
    type: TriggerType;
    config: any;
  };
  conditions: Array<{
    field: string;
    operator: ConditionOperator;
    value: string | number;
    aiIntent?: string;
    confidence?: number;
  }>;
  actions: Array<{
    type: ActionType;
    config: any;
    order: number;
  }>;
  aiGenerated: boolean;
  aiConfidence?: number;
  aiExplanation?: string;
  approvedBy?: mongoose.Types.ObjectId;
  status: WorkflowStatus;
  createdAt: Date;
  updatedAt: Date;
}

const WorkflowSchema = new Schema<IWorkflow>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    naturalLanguage: {
      type: String,
    },
    trigger: {
      type: {
        type: String,
        enum: Object.values(TriggerType),
        required: true,
      },
      config: {
        type: Schema.Types.Mixed,
        required: true,
      },
    },
    conditions: [
      {
        field: { type: String, required: true },
        operator: {
          type: String,
          enum: Object.values(ConditionOperator),
          required: true,
        },
        value: { type: Schema.Types.Mixed, required: true },
        aiIntent: String,
        confidence: { type: Number, min: 0, max: 1 },
      },
    ],
    actions: [
      {
        type: {
          type: String,
          enum: Object.values(ActionType),
          required: true,
        },
        config: {
          type: Schema.Types.Mixed,
          required: true,
        },
        order: { type: Number, required: true },
      },
    ],
    aiGenerated: {
      type: Boolean,
      default: false,
    },
    aiConfidence: {
      type: Number,
      min: 0,
      max: 1,
    },
    aiExplanation: {
      type: String,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: Object.values(WorkflowStatus),
      default: WorkflowStatus.DRAFT,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for multi-tenant queries
WorkflowSchema.index({ organizationId: 1, _id: 1 });
WorkflowSchema.index({ organizationId: 1, status: 1 });

export default mongoose.model<IWorkflow>('Workflow', WorkflowSchema);