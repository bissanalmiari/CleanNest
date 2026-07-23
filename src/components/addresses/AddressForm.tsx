"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createAddressSchema,
  type CreateAddressValues,
} from "@/validators/addressValidator";
import { type z } from "zod";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/shared/button";
import type { Address } from "@/types/user";

interface AddressFormProps {
  /** Pass an existing address to pre-fill the form for editing. */
  address?: Address;
  onSubmit: (values: CreateAddressValues) => Promise<unknown>;
  loading: boolean;
  error: string | null;
  submitLabel: string;
}

export function AddressForm({
  address,
  onSubmit,
  loading,
  error,
  submitLabel,
}: AddressFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.input<typeof createAddressSchema>>({
    resolver: zodResolver(createAddressSchema),
    defaultValues: {
      label: address?.label ?? "",
      city: address?.city ?? "",
      area: address?.area ?? "",
      street: address?.street ?? "",
      building: address?.building ?? "",
      floor: address?.floor ?? "",
      apartment: address?.apartment ?? "",
      isDefault: address?.isDefault ?? false,
    },
  });

  async function handleFormSubmit(values: z.input<typeof createAddressSchema>) {
    await onSubmit(values as CreateAddressValues);
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}

      <Input
        label="Label"
        placeholder="Home, Office, Parents' house..."
        error={errors.label?.message}
        {...register("label")}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input label="City" error={errors.city?.message} {...register("city")} />
        <Input label="Area" error={errors.area?.message} {...register("area")} />
      </div>

      <Input label="Street" error={errors.street?.message} {...register("street")} />

      <div className="grid grid-cols-3 gap-4">
        <Input
          label="Building (optional)"
          error={errors.building?.message}
          {...register("building")}
        />
        <Input label="Floor (optional)" error={errors.floor?.message} {...register("floor")} />
        <Input
          label="Apartment (optional)"
          error={errors.apartment?.message}
          {...register("apartment")}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-navy/80">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-navy/20 text-primary focus:ring-primary/30"
          {...register("isDefault")}
        />
        Set as default address
      </label>

      <Button type="submit" isLoading={loading} className="w-full">
        {submitLabel}
      </Button>
    </form>
  );
}