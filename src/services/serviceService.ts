// src/services/serviceService.ts

import "server-only";
import { connectDB } from "@/lib/db";
import Service from "@/models/Service";

export async function getActiveServices() {
    await connectDB();

    return Service.find({
        isActive: true,
    })
        .sort({ name: 1 })
        .lean()
        .exec();
}

export async function getServiceById(id: string) {
    await connectDB();

    return Service.findById(id).lean().exec();
}