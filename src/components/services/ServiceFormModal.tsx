// src/components/services/ServiceFormModal.tsx
"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { ImagePlus, Loader2, Trash2, X } from "lucide-react";

export interface ServiceFormData {
  _id?: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  category: string;
  price: number;
  durationMinutes: number;
  includedSquareMeters: number;
  pricePerAdditionalSquareMeter: number;
  minutesPerAdditionalSquareMeter: number;
  imageUrl?: string;
  isActive: boolean;
}

interface ServiceFormModalProps {
  mode: "create" | "edit";
  initialData?: ServiceFormData;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormState {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  category: string;
  price: string;
  durationMinutes: string;
  includedSquareMeters: string;
  pricePerAdditionalSquareMeter: string;
  minutesPerAdditionalSquareMeter: string;
  isActive: boolean;
}

type FieldErrors = Partial<Record<keyof FormState, string>>;

const EMPTY_FORM: FormState = {
  name: "",
  slug: "",
  shortDescription: "",
  description: "",
  category: "",
  price: "",
  durationMinutes: "",
  includedSquareMeters: "60",
  pricePerAdditionalSquareMeter: "0.40",
  minutesPerAdditionalSquareMeter: "0.75",
  isActive: true,
};

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MIN_IMAGE_WIDTH = 800;
const MIN_IMAGE_HEIGHT = 500;

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toFormState(data?: ServiceFormData): FormState {
  if (!data) return EMPTY_FORM;
  return {
    name: data.name,
    slug: data.slug,
    shortDescription: data.shortDescription,
    description: data.description,
    category: data.category,
    price: String(data.price),
    durationMinutes: String(data.durationMinutes),
    includedSquareMeters: String(data.includedSquareMeters ?? 60),
    pricePerAdditionalSquareMeter: String(data.pricePerAdditionalSquareMeter ?? 0.4),
    minutesPerAdditionalSquareMeter: String(data.minutesPerAdditionalSquareMeter ?? 0.75),
    isActive: data.isActive,
  };
}

export default function ServiceFormModal({
  mode,
  initialData,
  onClose,
  onSuccess,
}: ServiceFormModalProps) {
  const [form, setForm] = useState<FormState>(toFormState(initialData));
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.imageUrl || null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [createdServiceId, setCreatedServiceId] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  function clearObjectUrl() {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setImageError(null);

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageError("Choose a JPEG, PNG, or WEBP image.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setImageError("The image must be smaller than 5 MB.");
      return;
    }

    try {
      const bitmap = await createImageBitmap(file);
      const isLargeEnough = bitmap.width >= MIN_IMAGE_WIDTH && bitmap.height >= MIN_IMAGE_HEIGHT;
      bitmap.close();

      if (!isLargeEnough) {
        setImageError(`Use an image at least ${MIN_IMAGE_WIDTH} × ${MIN_IMAGE_HEIGHT} pixels.`);
        return;
      }
    } catch {
      setImageError("The selected image could not be read.");
      return;
    }

    clearObjectUrl();

    const objectUrl = URL.createObjectURL(file);
    objectUrlRef.current = objectUrl;
    setSelectedImage(file);
    setImagePreview(objectUrl);
    setImageRemoved(false);
  }

  function removeImage() {
    clearObjectUrl();
    setSelectedImage(null);
    setImagePreview(null);
    setImageRemoved(Boolean(initialData?.imageUrl));
    setImageError(null);
  }

  const handleNameChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: slugTouched ? prev.slug : slugify(value),
    }));
  };

  const validate = (): boolean => {
    const nextErrors: FieldErrors = {};

    if (!form.name.trim()) nextErrors.name = "Name is required";
    if (!form.slug.trim()) {
      nextErrors.slug = "Slug is required";
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug.trim())) {
      nextErrors.slug = "Use lowercase letters, numbers, and hyphens only";
    }
    if (!form.shortDescription.trim()) {
      nextErrors.shortDescription = "Short description is required";
    } else if (form.shortDescription.trim().length > 180) {
      nextErrors.shortDescription = "Short description cannot exceed 180 characters";
    }
    if (!form.description.trim()) {
      nextErrors.description = "Description is required";
    }
    if (!form.category.trim()) nextErrors.category = "Category is required";

    const price = Number(form.price);
    if (!form.price || Number.isNaN(price) || price <= 0) {
      nextErrors.price = "Enter a price greater than 0";
    }

    const duration = Number(form.durationMinutes);
    if (!form.durationMinutes || Number.isNaN(duration) || duration < 30) {
      nextErrors.durationMinutes = "Duration must be at least 30 minutes";
    }

    const includedSize = Number(form.includedSquareMeters);
    if (Number.isNaN(includedSize) || includedSize < 0) {
      nextErrors.includedSquareMeters = "Included size cannot be negative";
    }

    const sizeRate = Number(form.pricePerAdditionalSquareMeter);
    if (Number.isNaN(sizeRate) || sizeRate < 0) {
      nextErrors.pricePerAdditionalSquareMeter = "Size rate cannot be negative";
    }

    const sizeMinutes = Number(form.minutesPerAdditionalSquareMeter);
    if (Number.isNaN(sizeMinutes) || sizeMinutes < 0) {
      nextErrors.minutesPerAdditionalSquareMeter = "Additional duration cannot be negative";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setSubmitError(null);

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      shortDescription: form.shortDescription.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      price: Number(form.price),
      durationMinutes: Number(form.durationMinutes),
      includedSquareMeters: Number(form.includedSquareMeters),
      pricePerAdditionalSquareMeter: Number(form.pricePerAdditionalSquareMeter),
      minutesPerAdditionalSquareMeter: Number(form.minutesPerAdditionalSquareMeter),
      isActive: form.isActive,
    };

    try {
      let serviceId = initialData?._id ?? createdServiceId;
      const isExistingService = Boolean(serviceId);
      const url = isExistingService ? `/api/admin/services/${serviceId}` : "/api/admin/services";
      const method = isExistingService ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json: {
        success: boolean;
        data?: {
          _id?: string;
        };
        error?: string;
        issues?: Record<string, string>;
      } = await res.json();

      if (!res.ok || !json.success) {
        if (json.issues) {
          setErrors(json.issues as FieldErrors);
        }
        throw new Error(json.error ?? "Failed to save service");
      }

      serviceId = serviceId ?? json.data?._id ?? null;

      if (!serviceId) {
        throw new Error("The saved service did not return a valid ID.");
      }

      setCreatedServiceId(serviceId);

      if (selectedImage) {
        const imageFormData = new FormData();
        imageFormData.set("file", selectedImage);

        const imageResponse = await fetch(`/api/admin/services/${serviceId}/image`, {
          method: "POST",
          body: imageFormData,
        });
        const imageResult: {
          success?: boolean;
          error?: string;
        } = await imageResponse.json();

        if (!imageResponse.ok || !imageResult.success) {
          throw new Error(
            imageResult.error ??
              "The service was saved, but its image could not be uploaded. Try saving again."
          );
        }
      } else if (imageRemoved) {
        const imageResponse = await fetch(`/api/admin/services/${serviceId}/image`, {
          method: "DELETE",
        });
        const imageResult: {
          success?: boolean;
          error?: string;
        } = await imageResponse.json();

        if (!imageResponse.ok || !imageResult.success) {
          throw new Error(
            imageResult.error ??
              "The service was saved, but its image could not be removed. Try saving again."
          );
        }
      }

      onSuccess();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to save service");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-navy/40 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-lg overflow-hidden rounded-card border border-navy/[0.06] bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-navy/[0.06] px-6 py-4">
          <h2 className="font-heading text-lg font-semibold text-navy">
            {mode === "create" ? "Add Service" : "Edit Service"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-navy/40 transition-colors hover:bg-surface-soft hover:text-navy"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5">
          {submitError && (
            <div className="rounded-xl border border-status-cancelled/20 bg-status-cancelled/5 px-3.5 py-2.5 text-sm font-medium text-status-cancelled">
              {submitError}
            </div>
          )}

          <div className="rounded-2xl border border-primary/10 bg-primary-light/30 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative h-32 w-full overflow-hidden rounded-xl border border-primary/10 bg-[linear-gradient(135deg,#0b2545,#1675cf)] sm:w-48 sm:shrink-0">
                {imagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imagePreview}
                    alt="Service cover preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-cyan-200">
                    <ImagePlus className="h-7 w-7" />
                    <span className="mt-2 text-[10px] font-extrabold uppercase tracking-[0.12em]">
                      No cover image
                    </span>
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-navy">Service cover image</p>
                <p className="mt-1 text-xs leading-5 text-navy/50">
                  Landscape JPEG, PNG, or WEBP. Minimum 800 × 500 pixels, maximum 5 MB.
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => imageInputRef.current?.click()}
                    className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-white transition hover:bg-primary-dark disabled:opacity-50"
                  >
                    <ImagePlus className="h-4 w-4" />
                    {imagePreview ? "Replace image" : "Choose image"}
                  </button>

                  {imagePreview && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={removeImage}
                      className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </button>
                  )}
                </div>

                <input
                  ref={imageInputRef}
                  type="file"
                  accept={ALLOWED_IMAGE_TYPES.join(",")}
                  disabled={saving}
                  onChange={(event) => {
                    void handleImageChange(event);
                  }}
                  className="hidden"
                />

                {imageError && (
                  <p className="mt-2 text-xs font-medium text-status-cancelled">{imageError}</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-navy/50">
              Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full rounded-xl border border-navy/10 bg-surface-soft/60 px-3.5 py-2.5 text-sm text-navy focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10"
              placeholder="Standard Home Cleaning"
            />
            {errors.name && (
              <p className="mt-1 text-xs font-medium text-status-cancelled">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-navy/50">
              Slug
            </label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setForm({ ...form, slug: e.target.value });
              }}
              className="w-full rounded-xl border border-navy/10 bg-surface-soft/60 px-3.5 py-2.5 text-sm text-navy focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10"
              placeholder="standard-home-cleaning"
            />
            {errors.slug && (
              <p className="mt-1 text-xs font-medium text-status-cancelled">{errors.slug}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-navy/50">
              Short Description
            </label>
            <input
              type="text"
              value={form.shortDescription}
              onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
              maxLength={180}
              className="w-full rounded-xl border border-navy/10 bg-surface-soft/60 px-3.5 py-2.5 text-sm text-navy focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10"
              placeholder="Reliable, thorough home cleaning"
            />
            {errors.shortDescription && (
              <p className="mt-1 text-xs font-medium text-status-cancelled">
                {errors.shortDescription}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-navy/50">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              maxLength={3000}
              className="w-full rounded-xl border border-navy/10 bg-surface-soft/60 px-3.5 py-2.5 text-sm text-navy focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10"
              placeholder="Full details of what's included in this service..."
            />
            {errors.description && (
              <p className="mt-1 text-xs font-medium text-status-cancelled">{errors.description}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-navy/50">
              Category
            </label>
            <input
              type="text"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full rounded-xl border border-navy/10 bg-surface-soft/60 px-3.5 py-2.5 text-sm text-navy focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10"
              placeholder="Residential"
            />
            {errors.category && (
              <p className="mt-1 text-xs font-medium text-status-cancelled">{errors.category}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-navy/50">
                Price ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full rounded-xl border border-navy/10 bg-surface-soft/60 px-3.5 py-2.5 text-sm text-navy focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10"
                placeholder="80"
              />
              {errors.price && (
                <p className="mt-1 text-xs font-medium text-status-cancelled">{errors.price}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-navy/50">
                Duration (min)
              </label>
              <input
                type="number"
                min="30"
                step="5"
                value={form.durationMinutes}
                onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                className="w-full rounded-xl border border-navy/10 bg-surface-soft/60 px-3.5 py-2.5 text-sm text-navy focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10"
                placeholder="120"
              />
              {errors.durationMinutes && (
                <p className="mt-1 text-xs font-medium text-status-cancelled">
                  {errors.durationMinutes}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-primary/10 bg-primary-light/35 p-4">
            <div className="mb-4">
              <p className="text-sm font-semibold text-navy">Dynamic size pricing</p>
              <p className="mt-1 text-xs leading-5 text-navy/50">
                The base price covers the included area. Every additional square meter increases
                both price and estimated cleaning time.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-navy/50">
                  Included m²
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.includedSquareMeters}
                  onChange={(e) => setForm({ ...form, includedSquareMeters: e.target.value })}
                  className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10"
                />
                {errors.includedSquareMeters && (
                  <p className="mt-1 text-xs text-status-cancelled">
                    {errors.includedSquareMeters}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-navy/50">
                  $ per extra m²
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.pricePerAdditionalSquareMeter}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      pricePerAdditionalSquareMeter: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10"
                />
                {errors.pricePerAdditionalSquareMeter && (
                  <p className="mt-1 text-xs text-status-cancelled">
                    {errors.pricePerAdditionalSquareMeter}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-navy/50">
                  Min per extra m²
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.05"
                  value={form.minutesPerAdditionalSquareMeter}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      minutesPerAdditionalSquareMeter: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10"
                />
                {errors.minutesPerAdditionalSquareMeter && (
                  <p className="mt-1 text-xs text-status-cancelled">
                    {errors.minutesPerAdditionalSquareMeter}
                  </p>
                )}
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2.5 text-sm font-medium text-navy">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-navy/20 text-primary focus:ring-primary/30"
            />
            Active (visible to customers)
          </label>

          <div className="flex justify-end gap-3 border-t border-navy/[0.06] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-navy/10 px-4 py-2.5 text-sm font-semibold text-navy/60 transition-colors hover:bg-surface-soft"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(30,111,217,0.25)] transition-all hover:brightness-105 disabled:opacity-50"
            >
              {saving && <Loader2 size={15} className="animate-spin" />}
              {saving ? "Saving..." : mode === "create" ? "Add Service" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
