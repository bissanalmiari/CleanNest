import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth";
import { connectDB } from "@/lib/db";

import AddonModel from "@/models/AddOn";
import ServiceModel from "@/models/Service";
import ServiceAddonModel from "@/models/ServiceAddon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADDON_SEED_DATA = [
  {
    name: "Inside Refrigerator",
    description: "Clean shelves, drawers, walls, and accessible surfaces inside the refrigerator.",
    price: 15,
    extraDurationMinutes: 30,
    maxQuantity: 1,
    sortOrder: 1,
  },
  {
    name: "Inside Oven",
    description: "Remove grease and residue from accessible surfaces inside the oven.",
    price: 18,
    extraDurationMinutes: 40,
    maxQuantity: 1,
    sortOrder: 2,
  },
  {
    name: "Interior Windows",
    description: "Clean interior glass surfaces, frames, and accessible window edges.",
    price: 6,
    extraDurationMinutes: 15,
    maxQuantity: 12,
    sortOrder: 3,
  },
  {
    name: "Sofa Cleaning",
    description: "Vacuum and clean accessible fabric surfaces on sofas and upholstered seating.",
    price: 12,
    extraDurationMinutes: 25,
    maxQuantity: 6,
    sortOrder: 4,
  },
  {
    name: "Kitchen Cabinets",
    description: "Clean accessible cabinet doors, handles, and exterior kitchen surfaces.",
    price: 20,
    extraDurationMinutes: 35,
    maxQuantity: 1,
    sortOrder: 5,
  },
  {
    name: "Balcony Cleaning",
    description: "Sweep and clean the accessible balcony floor, railing, and surface areas.",
    price: 14,
    extraDurationMinutes: 30,
    maxQuantity: 3,
    sortOrder: 6,
  },
];

export async function POST() {
  try {
    await requireRole("admin");
    await connectDB();

    /*
     * Load all services that have not been explicitly disabled.
     */
    const services = await ServiceModel.find({
      isActive: {
        $ne: false,
      },
    })
      .select("_id name")
      .lean()
      .exec();

    if (services.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No active cleaning services were found.",
        },
        {
          status: 404,
        }
      );
    }

    const seededAddons = [];

    /*
     * Create each add-on or update the existing one.
     */
    for (const addonData of ADDON_SEED_DATA) {
      const addon = await AddonModel.findOneAndUpdate(
        {
          name: addonData.name,
        },
        {
          $set: {
            description: addonData.description,

            price: addonData.price,

            extraDurationMinutes: addonData.extraDurationMinutes,

            maxQuantity: addonData.maxQuantity,

            isActive: true,
          },
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        }
      ).exec();

      seededAddons.push({
        addon,
        sortOrder: addonData.sortOrder,
      });
    }

    let createdOrUpdatedLinks = 0;

    /*
     * Connect every seeded add-on to every active service.
     */
    for (const service of services) {
      for (const { addon, sortOrder } of seededAddons) {
        await ServiceAddonModel.updateOne(
          {
            serviceId: service._id,

            addonId: addon._id,
          },
          {
            $set: {
              isActive: true,
              sortOrder,

              /*
               * Leave price and duration overrides empty.
               * The API will use Addon.price and
               * Addon.extraDurationMinutes.
               */
              overridePrice: undefined,

              overrideDurationMinutes: undefined,

              maxQuantity: undefined,
            },
          },
          {
            upsert: true,
          }
        ).exec();

        createdOrUpdatedLinks += 1;
      }
    }

    return NextResponse.json(
      {
        success: true,

        message: "Add-ons were created and linked to all active services.",

        data: {
          services: services.length,

          addons: seededAddons.length,

          serviceAddonLinks: createdOrUpdatedLinks,

          serviceNames: services.map((service) => service.name),

          addonNames: seededAddons.map(({ addon }) => addon.name),
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("POST /api/admin/dev/seed-addons failed:", error);

    const message = error instanceof Error ? error.message : "Unable to seed service add-ons.";

    const status =
      message.toLowerCase().includes("authorized") || message.toLowerCase().includes("admin")
        ? 403
        : 500;

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      {
        status,
      }
    );
  }
}
