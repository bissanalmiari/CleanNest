import type {
  ServiceDetailsResponse,
  ServiceFilters,
  ServicesErrorResponse,
  ServicesResponse,
} from "@/types/service";

function getErrorMessage(
  response: ServicesErrorResponse,
  fallbackMessage: string,
) {
  return response.message || fallbackMessage;
}

export async function fetchServices(
  filters: ServiceFilters,
  signal?: AbortSignal,
): Promise<ServicesResponse> {
  const searchParams = new URLSearchParams();

  if (filters.search.trim()) {
    searchParams.set(
      "search",
      filters.search.trim(),
    );
  }

  if (filters.category) {
    searchParams.set(
      "category",
      filters.category,
    );
  }

  if (filters.minPrice.trim()) {
    searchParams.set(
      "minPrice",
      filters.minPrice.trim(),
    );
  }

  if (filters.maxPrice.trim()) {
    searchParams.set(
      "maxPrice",
      filters.maxPrice.trim(),
    );
  }

  searchParams.set("sort", filters.sort);
  searchParams.set(
    "page",
    String(filters.page),
  );
  searchParams.set("limit", "6");

  const response = await fetch(
    `/api/services?${searchParams.toString()}`,
    {
      method: "GET",
      signal,
      headers: {
        Accept: "application/json",
      },
    },
  );

  const result = (await response.json()) as
    | ServicesResponse
    | ServicesErrorResponse;

  if (!response.ok || !result.success) {
    throw new Error(
      getErrorMessage(
        result as ServicesErrorResponse,
        "Unable to load services.",
      ),
    );
  }

  return result as ServicesResponse;
}

export async function fetchServiceDetails(
  slug: string,
  signal?: AbortSignal,
): Promise<ServiceDetailsResponse> {
  const normalizedSlug = slug
    .trim()
    .toLowerCase();

  if (!normalizedSlug) {
    throw new Error(
      "Service slug is required.",
    );
  }

  const response = await fetch(
    `/api/services/${encodeURIComponent(
      normalizedSlug,
    )}`,
    {
      method: "GET",
      signal,
      headers: {
        Accept: "application/json",
      },
    },
  );

  const result = (await response.json()) as
    | ServiceDetailsResponse
    | ServicesErrorResponse;

  if (!response.ok || !result.success) {
    throw new Error(
      getErrorMessage(
        result as ServicesErrorResponse,
        "Unable to load the service.",
      ),
    );
  }

  return result as ServiceDetailsResponse;
}