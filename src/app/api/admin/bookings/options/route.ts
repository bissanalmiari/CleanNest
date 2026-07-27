import { NextRequest } from "next/server";
import { Types } from "mongoose";

import { AppError, errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";
import { requireUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import AddressModel from "@/models/Address";
import ServiceModel from "@/models/Service";
import ServiceAreaModel from "@/models/ServiceArea";
import UserModel from "@/models/User";

async function requireAdmin() {
  const user = await requireUser();

  if (user.role !== "admin") {
    throw new AppError("Admins only", 403);
  }

  return user;
}

function normalizeLocation(value: string) {
  return value.trim().toLowerCase();
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    await connectDB();

    const customerId = new URL(request.url).searchParams.get("customerId")?.trim();

    if (customerId && !Types.ObjectId.isValid(customerId)) {
      throw new AppError("Customer ID is invalid.", 422);
    }

    const [customers, services, serviceAreas, addresses] = await Promise.all([
      UserModel.find({ role: "customer", status: "active" })
        .select("_id name email phone")
        .sort({ name: 1 })
        .limit(500)
        .lean(),
      ServiceModel.find({ isActive: true })
        .select("_id name category price durationMinutes")
        .sort({ name: 1 })
        .lean(),
      ServiceAreaModel.find({ isActive: true })
        .select("_id city area serviceFee")
        .sort({ city: 1, area: 1 })
        .lean(),
      customerId
        ? AddressModel.find({
            customerId: new Types.ObjectId(customerId),
            isActive: true,
          })
            .select(
              "_id serviceAreaId label city area street building floor apartment propertyType bedrooms bathrooms propertySize isDefault"
            )
            .sort({ isDefault: -1, createdAt: -1 })
            .lean()
        : Promise.resolve([]),
    ]);

    const areaByLocation = new Map(
      serviceAreas.map((area) => [
        `${normalizeLocation(area.city)}::${normalizeLocation(area.area)}`,
        area,
      ])
    );

    return successResponse({
      customers: customers.map((customer) => ({
        id: customer._id.toString(),
        name: customer.name,
        email: customer.email,
        phone: customer.phone ?? "",
      })),
      services: services.map((service) => ({
        id: service._id.toString(),
        name: service.name,
        category: service.category,
        price: service.price,
        durationMinutes: service.durationMinutes,
      })),
      addresses: addresses.map((address) => {
        const matchedArea = areaByLocation.get(
          `${normalizeLocation(address.city)}::${normalizeLocation(address.area)}`
        );
        const serviceArea = address.serviceAreaId
          ? serviceAreas.find((area) => area._id.toString() === address.serviceAreaId?.toString())
          : matchedArea;

        return {
          id: address._id.toString(),
          serviceAreaId: serviceArea?._id.toString() ?? "",
          serviceAreaFee: serviceArea?.serviceFee ?? 0,
          label: address.label,
          city: address.city,
          area: address.area,
          street: address.street,
          building: address.building ?? "",
          floor: address.floor ?? "",
          apartment: address.apartment ?? "",
          propertyType: address.propertyType,
          bedrooms: address.bedrooms,
          bathrooms: address.bathrooms,
          propertySize: address.propertySize,
          isDefault: address.isDefault,
        };
      }),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
