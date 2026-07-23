"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProfileSchema, type UpdateProfileValues } from "@/validators/userValidator";
import { useProfile } from "@/hooks/useProfile";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/shared/button";
import type { PublicUser } from "@/types/user";

interface Props {
  user: PublicUser;
  onSaved: (updatedUser: PublicUser) => void;
}

const fieldClass =
  "w-full rounded-card border border-navy/15 px-3.5 py-2.5 text-sm text-navy outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

export function EditProfileForm({ user, onSaved }: Props) {
  const { updateProfile, loading, error } = useProfile();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user.name,
      phone: user.phone ?? "",
      dateOfBirth: user.dateOfBirth ?? "",
      gender: user.gender ?? undefined,
      preferredLanguage: user.preferredLanguage,
      bio: user.bio ?? "",
    },
  });

  async function onSubmit(values: UpdateProfileValues) {
    const updatedUser = await updateProfile(values);
    if (updatedUser) onSaved(updatedUser);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}

      <Input
        label="Full name"
        autoComplete="name"
        error={errors.name?.message}
        {...register("name")}
      />
      <Input
        label="Phone"
        type="tel"
        autoComplete="tel"
        placeholder="+961 00 000 000"
        error={errors.phone?.message}
        {...register("phone")}
      />
      <Input label="Email" value={user.email} disabled readOnly />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Date of birth"
          type="date"
          error={errors.dateOfBirth?.message}
          {...register("dateOfBirth")}
        />

        <div className="space-y-1.5">
          <label htmlFor="gender" className="block text-sm font-medium text-navy">
            Gender
          </label>
          <select id="gender" className={fieldClass} {...register("gender")}>
            <option value="prefer_not_to_say">Prefer not to say</option>
            <option value="male">Male</option>
            <option value="female">Female</option>

          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="preferredLanguage" className="block text-sm font-medium text-navy">
          Preferred language
        </label>
        <select
          id="preferredLanguage"
          className={fieldClass}
          {...register("preferredLanguage")}
        >
          <option value="en">English</option>
          <option value="ar">Arabic</option>
          <option value="fr">French</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="bio" className="block text-sm font-medium text-navy">
          Bio (optional)
        </label>
        <textarea
          id="bio"
          rows={3}
          maxLength={300}
          placeholder="A short note about yourself..."
          className={fieldClass}
          {...register("bio")}
        />
        {errors.bio?.message && (
          <p className="text-xs font-medium text-red-600">{errors.bio.message}</p>
        )}
      </div>

      <Button type="submit" isLoading={loading} disabled={!isDirty}>
        Save changes
      </Button>
    </form>
  );
}