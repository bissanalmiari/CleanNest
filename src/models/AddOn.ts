import "server-only";

import {
  Schema,
  model,
  models,
  type HydratedDocument,
  type InferSchemaType,
  type Model,
} from "mongoose";

const addonSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Add-on name is required."],
      trim: true,
      minlength: [2, "Add-on name must contain at least 2 characters."],
      maxlength: [100, "Add-on name cannot exceed 100 characters."],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, "Add-on description cannot exceed 500 characters."],
      default: "",
    },

    price: {
      type: Number,
      required: [true, "Add-on price is required."],
      min: [0, "Add-on price cannot be negative."],
    },

    extraDurationMinutes: {
      type: Number,
      required: true,
      min: [0, "Extra duration cannot be negative."],
      max: [1440, "Extra duration cannot exceed 24 hours."],
      default: 0,
    },

    maxQuantity: {
      type: Number,
      required: true,
      min: [1, "Maximum quantity must be at least one."],
      max: [50, "Maximum quantity cannot exceed 50."],
      default: 10,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

addonSchema.index({
  name: "text",
  description: "text",
});

addonSchema.index({
  isActive: 1,
  createdAt: -1,
});

export type Addon = InferSchemaType<typeof addonSchema>;

export type AddonDocument = HydratedDocument<Addon>;

const AddonModel = (models.Addon as Model<Addon> | undefined) ?? model<Addon>("Addon", addonSchema);

export default AddonModel;
