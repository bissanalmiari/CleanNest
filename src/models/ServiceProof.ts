import "server-only";

import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export interface IServiceProofTask {
  key: string;
  label: string;
  completed: boolean;
  completedAt?: Date;
}

export interface IServiceProofPhoto {
  url: string;
  uploadedAt: Date;
}

export interface IServiceProofIssue {
  description: string;
  photos: IServiceProofPhoto[];
  reportedAt: Date;
}

export interface IServiceProof extends Document {
  bookingId: Types.ObjectId;
  assignmentId: Types.ObjectId;
  cleanerId: Types.ObjectId;
  checklist: IServiceProofTask[];
  beforePhotos: IServiceProofPhoto[];
  afterPhotos: IServiceProofPhoto[];
  issues: IServiceProofIssue[];
  onMyWayAt?: Date;
  checkedInAt?: Date;
  checkedOutAt?: Date;
  checkInLocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<IServiceProofTask>(
  {
    key: { type: String, required: true, trim: true, maxlength: 100 },
    label: { type: String, required: true, trim: true, maxlength: 180 },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: undefined },
  },
  { _id: false }
);

const photoSchema = new Schema<IServiceProofPhoto>(
  {
    url: { type: String, required: true, trim: true, maxlength: 2000 },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const issueSchema = new Schema<IServiceProofIssue>(
  {
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    photos: { type: [photoSchema], default: [] },
    reportedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const serviceProofSchema = new Schema<IServiceProof>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: "CleanerAssignment",
      required: true,
      unique: true,
    },
    cleanerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    checklist: { type: [taskSchema], default: [] },
    beforePhotos: { type: [photoSchema], default: [] },
    afterPhotos: { type: [photoSchema], default: [] },
    issues: { type: [issueSchema], default: [] },
    onMyWayAt: { type: Date, default: undefined },
    checkedInAt: { type: Date, default: undefined },
    checkedOutAt: { type: Date, default: undefined },
    checkInLocation: {
      latitude: { type: Number, min: -90, max: 90 },
      longitude: { type: Number, min: -180, max: 180 },
      accuracy: { type: Number, min: 0 },
    },
  },
  { timestamps: true, versionKey: false }
);

serviceProofSchema.index({ bookingId: 1, cleanerId: 1 }, { unique: true });

const ServiceProof =
  (mongoose.models.ServiceProof as Model<IServiceProof> | undefined) ??
  mongoose.model<IServiceProof>("ServiceProof", serviceProofSchema);

export default ServiceProof;
