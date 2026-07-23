import "server-only";

import {
  Schema,
  model,
  models,
  type HydratedDocument,
  type InferSchemaType,
  type Model,
} from "mongoose";

const BLOCK_TYPES = [
  "holiday",
  "maintenance",
  "fully_booked",
  "staff_unavailable",
  "other",
] as const;

const blockedTimeSchema = new Schema(
  {
    /*
     * When serviceAreaId is empty, the block applies
     * to every CleanNest service area.
     *
     * When it is provided, only bookings in that
     * service area are blocked.
     */
    serviceAreaId: {
      type: Schema.Types.ObjectId,
      ref: "ServiceArea",
      default: undefined,
      index: true,
    },

    startDatetime: {
      type: Date,
      required: [
        true,
        "Blocked start date and time are required.",
      ],
      index: true,
    },

    endDatetime: {
      type: Date,
      required: [
        true,
        "Blocked end date and time are required.",
      ],
      index: true,
    },

    blockType: {
      type: String,
      enum: {
        values: BLOCK_TYPES,
        message: "Invalid blocked-time type.",
      },
      default: "other",
      required: true,
    },

    reason: {
      type: String,
      trim: true,
      maxlength: [
        500,
        "Blocked-time reason cannot exceed 500 characters.",
      ],
      default: "",
    },

    createdByUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [
        true,
        "The admin who created the blocked period is required.",
      ],
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
 * Ensure the blocked period has a valid duration.
 */
blockedTimeSchema.pre(
  "validate",
  function validateBlockedPeriod() {
    if (
      !this.startDatetime ||
      !this.endDatetime
    ) {
      return;
    }

    if (
      this.endDatetime.getTime() <=
      this.startDatetime.getTime()
    ) {
      this.invalidate(
        "endDatetime",
        "Blocked end time must be later than the start time.",
      );
    }
  },
);

/*
 * Used by the availability service to quickly locate
 * blocks that overlap a requested booking period.
 */
blockedTimeSchema.index({
  isActive: 1,
  startDatetime: 1,
  endDatetime: 1,
});

blockedTimeSchema.index({
  serviceAreaId: 1,
  isActive: 1,
  startDatetime: 1,
  endDatetime: 1,
});

export type BlockedTime =
  InferSchemaType<
    typeof blockedTimeSchema
  >;

export type BlockedTimeDocument =
  HydratedDocument<BlockedTime>;

const BlockedTimeModel =
  (models.BlockedTime as
    | Model<BlockedTime>
    | undefined) ??
  model<BlockedTime>(
    "BlockedTime",
    blockedTimeSchema,
  );

export default BlockedTimeModel;