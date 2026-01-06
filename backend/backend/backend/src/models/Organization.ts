import mongoose, { Document, Schema } from 'mongoose';
import { OrganizationPlan } from '../types/workflow.types';

export interface IOrganization extends Document {
  name: string;
  slug: string;
  plan: OrganizationPlan;
  settings: {
    aiConfidenceThreshold: number;
    requireApproval: boolean;
    webhookSecret: string;
  };
  usage: {
    workflowsExecuted: number;
    aiCallsThisMonth: number;
    storageUsedMB: number;
  };
  stripeCustomerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    plan: {
      type: String,
      enum: Object.values(OrganizationPlan),
      default: OrganizationPlan.FREE,
    },
    settings: {
      aiConfidenceThreshold: {
        type: Number,
        default: 0.7,
        min: 0,
        max: 1,
      },
      requireApproval: {
        type: Boolean,
        default: true,
      },
      webhookSecret: {
        type: String,
        required: true,
      },
    },
    usage: {
      workflowsExecuted: {
        type: Number,
        default: 0,
      },
      aiCallsThisMonth: {
        type: Number,
        default: 0,
      },
      storageUsedMB: {
        type: Number,
        default: 0,
      },
    },
    stripeCustomerId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IOrganization>('Organization', OrganizationSchema);