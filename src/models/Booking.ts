import { Schema, model, Document, Types } from 'mongoose';
import { BookingStatus } from '../types';

export interface BookingDocument extends Document {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  resourceId: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  bufferStartTime: Date;
  bufferEndTime: Date;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<BookingDocument>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    resourceId: {
      type: Schema.Types.ObjectId,
      ref: 'Resource',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    bufferStartTime: { type: Date, required: true },
    bufferEndTime: { type: Date, required: true },
    status: {
      type: String,
      enum: Object.values(BookingStatus),
      required: true,
      default: BookingStatus.CONFIRMED,
    },
  },
  { timestamps: true }
);

bookingSchema.index({ organizationId: 1 });

bookingSchema.index({
  organizationId: 1,
  resourceId: 1,
  status: 1,
  bufferStartTime: 1,
  bufferEndTime: 1,
});

bookingSchema.index({
  organizationId: 1,
  resourceId: 1,
  startTime: 1,
  endTime: 1,
});

export const Booking = model<BookingDocument>('Booking', bookingSchema);
