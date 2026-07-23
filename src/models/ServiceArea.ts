import "server-only";

import {
  Schema,
  model,
  models,
  type HydratedDocument,
  type InferSchemaType,
  type Model,
} from "mongoose";

const serviceAreaSchema = new Schema(
  {
    city: {
      type: String,
      required: [
        true,
        "City is required.",
      ],
      trim: true,
      minlength: [
        2,
        "City must contain at least 2 characters.",
      ],
      maxlength: [
        80,
        "City cannot exceed 80 characters.",
      ],
    },

    area: {
      type: String,
      required: [
        true,
        "Area is required.",
      ],
      trim: true,
      minlength: [
        2,
        "Area must contain at least 2 characters.",
      ],
      maxlength: [
        100,
        "Area cannot exceed 100 characters.",
      ],
    },

    postalCode: {
      type: String,
      trim: true,
      maxlength: [
        20,
        "Postal code cannot exceed 20 characters.",
      ],
      default: "",
    },

    serviceFee: {
      type: Number,
      required: true,
      min: [
        0,
        "Service fee cannot be negative.",
      ],
      default: 0,
    },

    maximumConcurrentBookings: {
      type: Number,
      required: true,
      min: [
        1,
        "Maximum concurrent bookings must be at least one.",
      ],
      max: [
        100,
        "Maximum concurrent bookings cannot exceed 100.",
      ],
      default: 3,
    },

    isActive: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

serviceAreaSchema.index(
  {
    city: 1,
    area: 1,
  },
  {
    unique: true,
    collation: {
      locale: "en",
      strength: 2,
    },
  },
);

serviceAreaSchema.index({
  isActive: 1,
  city: 1,
  area: 1,
});

export type ServiceArea =
  InferSchemaType<
    typeof serviceAreaSchema
  >;

export type ServiceAreaDocument =
  HydratedDocument<ServiceArea>;

const ServiceAreaModel: Model<ServiceArea> =
  (models.ServiceArea as
    | Model<ServiceArea>
    | undefined) ??
  model<ServiceArea>(
    "ServiceArea",
    serviceAreaSchema,
  );

export default ServiceAreaModel;