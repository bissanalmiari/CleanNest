"use client";

import Link from "next/link";
import { Star, Trash2 } from "lucide-react";
import { Button } from "@/components/shared/button";
import type { Address } from "@/types/user";

interface AddressCardProps {
  address: Address;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
  busy: boolean;
}

export function AddressCard({ address, onDelete, onSetDefault, busy }: AddressCardProps) {
  const lines = [
    address.street,
    [address.building && `Bldg ${address.building}`, address.floor && `Floor ${address.floor}`, address.apartment && `Apt ${address.apartment}`]
      .filter(Boolean)
      .join(", "),
    `${address.area}, ${address.city}`,
  ].filter(Boolean);

  return (
    <div className="flex flex-col justify-between gap-4 rounded-card border border-navy/10 bg-surface p-5 shadow-card sm:flex-row sm:items-start">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <p className="font-heading font-semibold text-navy">{address.label}</p>
          {address.isDefault && (
            <span className="rounded-full bg-primary-light px-2 py-0.5 text-xs font-medium text-primary">
              Default
            </span>
          )}
        </div>
        {lines.map((line, i) => (
          <p key={i} className="text-sm text-navy/60">
            {line}
          </p>
        ))}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {!address.isDefault && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => onSetDefault(address.id)}
          >
            <Star className="h-4 w-4" /> Set default
          </Button>
        )}
        <Link href={`/addresses/${address.id}/edit`}>
          <Button type="button" variant="secondary" size="sm">
            Edit
          </Button>
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={busy}
          onClick={() => onDelete(address.id)}
          className="text-red-500 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}