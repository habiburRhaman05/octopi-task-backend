import { Schema, model, Document, Types } from 'mongoose';

export interface ResourceDocument extends Document {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  name: string;
  type: string;
  capacity: number;
  bufferTime: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const resourceSchema = new Schema<ResourceDocument>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    capacity: { type: Number, required: true, min: 1, default: 1 },
    bufferTime: { type: Number, required: true, min: 0, default: 0 },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

resourceSchema.index({ organizationId: 1 });
resourceSchema.index({ organizationId: 1, name: 1 }, { unique: true });

export const Resource = model<ResourceDocument>('Resource', resourceSchema);
