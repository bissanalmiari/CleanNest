import "server-only";

import mongoose, {
  Schema,
  type Document,
  type Model,
  type Types,
} from "mongoose";

export interface IAddress extends Document {
  customerId: Types.ObjectId;
  serviceAreaId?: Types.ObjectId;

  label: string;
  city: string;
  area: string;
  street: string;

  building?: string;
  floor?: string;
  apartment?: string;
  postalCode?: string;
  landmark?: string;
  accessInstructions?: string;
  contactPhone?: string;

  isDefault: boolean;
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<IAddress>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer is required."],
      index: true,
    },

    /*
     * Optional temporarily for compatibility with existing
     * address records. New addresses should include it.
     */
    serviceAreaId: {
      type: Schema.Types.ObjectId,
      ref: "ServiceArea",
      default: undefined,
      index: true,
    },

    label: {
      type: String,
      required: [true, "Address label is required."],
      trim: true,
      minlength: [
        2,
        "Address label must contain at least 2 characters.",
      ],
      maxlength: [
        50,
        "Address label cannot exceed 50 characters.",
      ],
    },

    city: {
      type: String,
      required: [true, "City is required."],
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
      required: [true, "Area is required."],
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

    street: {
      type: String,
      required: [true, "Street is required."],
      trim: true,
      minlength: [
        2,
        "Street must contain at least 2 characters.",
      ],
      maxlength: [
        180,
        "Street cannot exceed 180 characters.",
      ],
    },

    building: {
      type: String,
      trim: true,
      maxlength: [
        100,
        "Building cannot exceed 100 characters.",
      ],
      default: "",
    },

    floor: {
      type: String,
      trim: true,
      maxlength: [
        30,
        "Floor cannot exceed 30 characters.",
      ],
      default: "",
    },

    apartment: {
      type: String,
      trim: true,
      maxlength: [
        30,
        "Apartment cannot exceed 30 characters.",
      ],
      default: "",
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

    landmark: {
      type: String,
      trim: true,
      maxlength: [
        180,
        "Landmark cannot exceed 180 characters.",
      ],
      default: "",
    },

    accessInstructions: {
      type: String,
      trim: true,
      maxlength: [
        500,
        "Access instructions cannot exceed 500 characters.",
      ],
      default: "",
    },

    contactPhone: {
      type: String,
      trim: true,
      maxlength: [
        30,
        "Contact phone cannot exceed 30 characters.",
      ],
      match: [
        /^[+\d][\d\s()-]{5,29}$/,
        "Contact phone format is invalid.",
      ],
      default: undefined,
    },

    isDefault: {
      type: Boolean,
      default: false,
      index: true,
    },

    /*
     * Soft deletion prevents old booking addresses from
     * disappearing from booking history.
     */
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
 * Used when displaying a customer's active saved addresses.
 */
addressSchema.index({
  customerId: 1,
  isActive: 1,
  createdAt: -1,
});

/*
 * Used to find the customer's default address.
 */
addressSchema.index({
  customerId: 1,
  isDefault: 1,
  isActive: 1,
});

/*
 * Used when validating that an address belongs to the
 * selected service area.
 */
addressSchema.index({
  customerId: 1,
  serviceAreaId: 1,
  isActive: 1,
});

const AddressModel =
  (mongoose.models.Address as
    | Model<IAddress>
    | undefined) ??
  mongoose.model<IAddress>(
    "Address",
    addressSchema,
  );

export default AddressModel;
