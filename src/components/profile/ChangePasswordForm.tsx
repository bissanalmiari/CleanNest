"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordSchema, type ChangePasswordValues } from "@/validators/userValidator";
import { useProfile } from "@/hooks/useProfile";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/shared/button";

interface Props {
  onDone: () => void;
}

export function ChangePasswordForm({ onDone }: Props) {
  const { changePassword, loading, error, setError } = useProfile();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmNewPassword: "" },
  });

  async function onSubmit(values: ChangePasswordValues) {
    const result = await changePassword(values);
    if (result !== null) {
      reset();
      onDone();
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
      {error && <Alert variant="error">{error}</Alert>}

      <Input label="Current password" type="password" autoComplete="current-password"
        error={errors.currentPassword?.message} {...register("currentPassword")} />
      <Input label="New password" type="password" autoComplete="new-password"
        error={errors.newPassword?.message} {...register("newPassword")} />
      <Input label="Confirm new password" type="password" autoComplete="new-password"
        error={errors.confirmNewPassword?.message} {...register("confirmNewPassword")} />

      <div className="flex gap-3">
        <Button type="submit" isLoading={loading}>Update password</Button>
        <Button type="button" variant="ghost" onClick={() => { reset(); setError(null); onDone(); }}>
          Cancel
        </Button>
      </div>
    </form>
  );
}