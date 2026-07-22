import "server-only";

import type {
  FilterQuery,
  SortOrder,
} from "mongoose";

import { connectDB } from "@/lib/db";
import ServiceModel, {
  type Service,
} from "@/models/Service";

export type ServiceSort =
  | "newest"
  | "oldest"
  | "price-asc"
  | "price-desc"
  | "name-asc"
  | "name-desc";

export type GetServicesOptions = {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: ServiceSort;
  page?: number;
  limit?: number;
};

const sortOptions: Record<
  ServiceSort,
  Record<string, SortOrder>
> = {
  newest: {
    createdAt: -1,
  },

  oldest: {
    createdAt: 1,
  },

  "price-asc": {
    price: 1,
  },

  "price-desc": {
    price: -1,
  },

  "name-asc": {
    name: 1,
  },

  "name-desc": {
    name: -1,
  },
};

function escapeRegularExpression(
  value: string,
) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );
}

export async function getServices(
  options: GetServicesOptions = {},
) {
  await connectDB();

  const page = Math.max(
    1,
    options.page ?? 1,
  );

  const limit = Math.min(
    50,
    Math.max(1, options.limit ?? 9),
  );

  const skip = (page - 1) * limit;

  const filter: FilterQuery<Service> = {
    isActive: true,
  };

  const search = options.search?.trim();
  const category = options.category?.trim();

  if (search) {
    const searchExpression = new RegExp(
      escapeRegularExpression(search),
      "i",
    );

    filter.$or = [
      {
        name: searchExpression,
      },
      {
        shortDescription: searchExpression,
      },
      {
        description: searchExpression,
      },
      {
        category: searchExpression,
      },
    ];
  }

  if (category) {
    filter.category = new RegExp(
      `^${escapeRegularExpression(category)}$`,
      "i",
    );
  }

  if (
    options.minPrice !== undefined ||
    options.maxPrice !== undefined
  ) {
    const priceFilter: {
      $gte?: number;
      $lte?: number;
    } = {};

    if (options.minPrice !== undefined) {
      priceFilter.$gte =
        options.minPrice;
    }

    if (options.maxPrice !== undefined) {
      priceFilter.$lte =
        options.maxPrice;
    }

    filter.price = priceFilter;
  }

  const selectedSort =
    options.sort ?? "newest";

  const [
    services,
    totalServices,
    availableCategories,
  ] = await Promise.all([
    ServiceModel.find(filter)
      .sort(sortOptions[selectedSort])
      .skip(skip)
      .limit(limit)
      .lean(),

    ServiceModel.countDocuments(filter),

    ServiceModel.distinct("category", {
      isActive: true,
    }),
  ]);

  const serializedServices = services.map(
    (service) => {
      const {
        _id,
        ...serviceData
      } = service;

      return {
        id: String(_id),
        ...serviceData,
      };
    },
  );

  const categories = availableCategories
    .filter(
      (
        categoryName,
      ): categoryName is string =>
        typeof categoryName === "string",
    )
    .sort(
      (
        firstCategory,
        secondCategory,
      ) =>
        firstCategory.localeCompare(
          secondCategory,
        ),
    );

  const totalPages = Math.max(
    1,
    Math.ceil(totalServices / limit),
  );

  return {
    services: serializedServices,

    categories,

    pagination: {
      page,
      limit,
      totalServices,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

export async function getServiceBySlug(
  slug: string,
) {
  await connectDB();

  const normalizedSlug = slug
    .trim()
    .toLowerCase();

  const service = await ServiceModel.findOne({
    slug: normalizedSlug,
    isActive: true,
  }).lean();

  if (!service) {
    return null;
  }

  const {
    _id,
    ...serviceData
  } = service;

  return {
    id: String(_id),
    ...serviceData,
  };
}

export default getServices;