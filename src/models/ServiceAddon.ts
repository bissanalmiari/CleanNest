import "server-only";

import {
  Schema,
  model,
  models,
  type HydratedDocument,
  type InferSchemaType,
  type Model,
} from "mongoose";

const serviceAddonSchema = new Schema(
  {
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      required: [true, "Service is required."],
      index: true,
    },

    addonId: {
      type: Schema.Types.ObjectId,
      ref: "Addon",
      required: [true, "Add-on is required."],
      index: true,
    },

    /*
     * An add-on can have a different price for a
     * specific service.
     *
     * When this is undefined, Addon.price is used.
     */
    overridePrice: {
      type: Number,
      min: [0, "Override price cannot be negative."],
      default: undefined,
    },

    /*
     * Allows a service-specific duration.
     * When undefined, Addon.extraDurationMinutes is used.
     */
    overrideDurationMinutes: {
      type: Number,
      min: [0, "Override duration cannot be negative."],
      max: [1440, "Override duration cannot exceed 24 hours."],
      default: undefined,
    },

    /*
     * Allows different quantity limits for each service.
     * When undefined, Addon.maxQuantity is used.
     */
    maxQuantity: {
      type: Number,
      min: [1, "Maximum quantity must be at least one."],
      max: [50, "Maximum quantity cannot exceed 50."],
      default: undefined,
    },

    sortOrder: {
      type: Number,
      min: [0, "Sort order cannot be negative."],
      default: 0,
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

/*
 * A particular add-on can only be connected to a
 * service once.
 */
serviceAddonSchema.index(
  {
    serviceId: 1,
    addonId: 1,
  },
  {
    unique: true,
  }
);

serviceAddonSchema.index({
  serviceId: 1,
  isActive: 1,
  sortOrder: 1,
});

export type ServiceAddon = InferSchemaType<typeof serviceAddonSchema>;

export type ServiceAddonDocument = HydratedDocument<ServiceAddon>;

const ServiceAddonModel =
  (models.ServiceAddon as Model<ServiceAddon> | undefined) ??
  model<ServiceAddon>("ServiceAddon", serviceAddonSchema);

export default ServiceAddonModel;
