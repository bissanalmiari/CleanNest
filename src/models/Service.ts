import "server-only";

import {
  Schema,
  model,
  models,
  type HydratedDocument,
  type InferSchemaType,
  type Model,
} from "mongoose";

const serviceSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Service name is required."],
      trim: true,
      minlength: [2, "Service name must contain at least 2 characters."],
      maxlength: [100, "Service name cannot exceed 100 characters."],
    },

    slug: {
      type: String,
      required: [true, "Service slug is required."],
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: [120, "Service slug cannot exceed 120 characters."],
      match: [
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Service slug must use lowercase letters, numbers, and hyphens.",
      ],
    },

    shortDescription: {
      type: String,
      required: [true, "Short description is required."],
      trim: true,
      maxlength: [
        180,
        "Short description cannot exceed 180 characters.",
      ],
    },

    description: {
      type: String,
      required: [true, "Service description is required."],
      trim: true,
      maxlength: [
        3000,
        "Service description cannot exceed 3000 characters.",
      ],
    },

    category: {
      type: String,
      required: [true, "Service category is required."],
      trim: true,
      maxlength: [80, "Category cannot exceed 80 characters."],
    },

    price: {
      type: Number,
      required: [true, "Service price is required."],
      min: [0, "Service price cannot be negative."],
    },

    durationMinutes: {
      type: Number,
      required: [true, "Service duration is required."],
      min: [30, "Service duration must be at least 30 minutes."],
    },

    /*
     * The base price covers a property up to includedSquareMeters.
     * Larger properties are priced per additional square meter so each
     * service can scale differently (for example deep vs standard cleaning).
     */
    includedSquareMeters: {
      type: Number,
      min: [0, "Included property size cannot be negative."],
      max: [10000, "Included property size is too large."],
      default: 60,
    },

    pricePerAdditionalSquareMeter: {
      type: Number,
      min: [0, "The additional square-meter price cannot be negative."],
      max: [100, "The additional square-meter price is too large."],
      default: 0.4,
    },

    minutesPerAdditionalSquareMeter: {
      type: Number,
      min: [0, "The additional square-meter duration cannot be negative."],
      max: [60, "The additional square-meter duration is too large."],
      default: 0.75,
    },

    features: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: [
            150,
            "A service feature cannot exceed 150 characters.",
          ],
        },
      ],
      default: [],
    },

    imageUrl: {
      type: String,
      trim: true,
      default: "",
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
  },
);

/*
  Text index used by the services search API.
  It allows searching through the service name and descriptions.
*/
serviceSchema.index({
  name: "text",
  shortDescription: "text",
  description: "text",
});

/*
  Additional indexes used by filtering and sorting.
*/
serviceSchema.index({
  category: 1,
  isActive: 1,
});

serviceSchema.index({
  price: 1,
});

serviceSchema.index({
  createdAt: -1,
});

export type Service = InferSchemaType<typeof serviceSchema>;

export type ServiceDocument = HydratedDocument<Service>;

const ServiceModel =
  (models.Service as Model<Service> | undefined) ??
  model<Service>("Service", serviceSchema);

export default ServiceModel;
