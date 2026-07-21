import mongoose, { Schema, Document, Types } from "mongoose";

// Junction table: which addons are offered for which service (N:N)
export interface IServiceAddon extends Document {
  serviceId: Types.ObjectId; // -> SERVICES.id
  addonId: Types.ObjectId; // -> ADDONS.id
}

const serviceAddonSchema = new Schema<IServiceAddon>(
  {
    serviceId: { type: Schema.Types.ObjectId, ref: "Service", required: true },
    addonId: { type: Schema.Types.ObjectId, ref: "Addon", required: true },
  },
  { timestamps: true }
);

// Composite PK equivalent (service_id, addon_id) must be unique
serviceAddonSchema.index({ serviceId: 1, addonId: 1 }, { unique: true });

export default mongoose.models.ServiceAddon ||
  mongoose.model<IServiceAddon>("ServiceAddon", serviceAddonSchema);
