// addressService: data-access layer for the Address collection (Saved Addresses).
import "server-only";
import { connectDB } from "@/lib/db";
import Address, { type IAddress } from "@/models/Address";
import { NotFoundError } from "@/lib/apiError";
import type { Address as AddressDTO } from "@/types/user";
import type { CreateAddressValues, UpdateAddressValues } from "@/validators/addressValidator";

function toDTO(doc: IAddress): AddressDTO {
  return {
    id: doc._id.toString(),
    customerId: doc.customerId.toString(),
    label: doc.label,
    city: doc.city,
    area: doc.area,
    street: doc.street,
    building: doc.building ?? undefined,
    floor: doc.floor ?? undefined,
    apartment: doc.apartment ?? undefined,
    isDefault: doc.isDefault,
  };
}

/** All saved addresses for a customer, default address first, then newest first. */
export async function getAddresses(customerId: string): Promise<AddressDTO[]> {
  await connectDB();
  const docs = await Address.find({ customerId }).sort({ isDefault: -1, createdAt: -1 });
  return docs.map(toDTO);
}

async function findOwnedAddress(customerId: string, addressId: string): Promise<IAddress> {
  const doc = await Address.findOne({ _id: addressId, customerId });
  if (!doc) throw new NotFoundError("Address not found");
  return doc;
}

/**
 * Creates a new address for the customer. If this is their first address, or
 * `isDefault` was explicitly requested, it's set as the default and any
 * previous default is cleared (a customer can only have one default at a time).
 */
export async function createAddress(
  customerId: string,
  input: CreateAddressValues
): Promise<AddressDTO> {
  await connectDB();

  const existingCount = await Address.countDocuments({ customerId });
  const shouldBeDefault = input.isDefault || existingCount === 0;

  if (shouldBeDefault) {
    await Address.updateMany({ customerId, isDefault: true }, { $set: { isDefault: false } });
  }

  const doc = await Address.create({
    ...input,
    customerId,
    isDefault: shouldBeDefault,
  });

  return toDTO(doc);
}

/** Updates an address the customer owns. Ownership is enforced by the query filter. */
export async function updateAddress(
  customerId: string,
  addressId: string,
  input: UpdateAddressValues
): Promise<AddressDTO> {
  await connectDB();

  const doc = await findOwnedAddress(customerId, addressId);

  if (input.isDefault === true) {
    await Address.updateMany(
      { customerId, isDefault: true, _id: { $ne: doc._id } },
      { $set: { isDefault: false } }
    );
  }

  Object.assign(doc, input);
  await doc.save();

  return toDTO(doc);
}

/**
 * Deletes an address the customer owns. If it was the default, promotes the
 * most recently created remaining address (if any) to be the new default —
 * a customer with saved addresses should always have exactly one default.
 */
export async function deleteAddress(customerId: string, addressId: string): Promise<void> {
  await connectDB();

  const doc = await findOwnedAddress(customerId, addressId);
  const wasDefault = doc.isDefault;
  await doc.deleteOne();

  if (wasDefault) {
    const next = await Address.findOne({ customerId }).sort({ createdAt: -1 });
    if (next) {
      next.isDefault = true;
      await next.save();
    }
  }
}

/** Sets one address as the customer's default, clearing any previous default. */
export async function setDefaultAddress(
  customerId: string,
  addressId: string
): Promise<AddressDTO> {
  await connectDB();

  const doc = await findOwnedAddress(customerId, addressId);

  await Address.updateMany(
    { customerId, isDefault: true, _id: { $ne: doc._id } },
    { $set: { isDefault: false } }
  );

  doc.isDefault = true;
  await doc.save();

  return toDTO(doc);
}