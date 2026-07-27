"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Loader2,
  MapPin,
  ReceiptText,
  Sparkles,
  Minus,
  Plus,
  UserRound,
} from "lucide-react";

interface CustomerOption {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface ServiceOption {
  id: string;
  name: string;
  category: string;
  price: number;
  durationMinutes: number;
}

interface AddressOption {
  id: string;
  serviceAreaId: string;
  serviceAreaFee: number;
  label: string;
  city: string;
  area: string;
  street: string;
  building: string;
  floor: string;
  apartment: string;
  propertyType: "apartment" | "house" | "office" | "other";
  bedrooms: number;
  bathrooms: number;
  propertySize: number;
  isDefault: boolean;
}

interface AddOnOption {
  id: string;
  name: string;
  description: string;
  unitPrice: number;
  durationMinutes: number;
  maxQuantity: number;
}

interface AddOnSelection extends AddOnOption {
  quantity: number;
}

interface BookingOptions {
  customers: CustomerOption[];
  services: ServiceOption[];
  addresses: AddressOption[];
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100";

function calculateEndTime(startTime: string, durationMinutes: number) {
  const [hours = 0, minutes = 0] = startTime.split(":").map(Number);
  const total = hours * 60 + minutes + durationMinutes;

  if (total >= 24 * 60) return "";

  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(
    2,
    "0"
  )}`;
}

function todayInBeirut() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Beirut",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default function NewAdminBookingPage() {
  const router = useRouter();
  const [options, setOptions] = useState<BookingOptions>({
    customers: [],
    services: [],
    addresses: [],
  });
  const [customerId, setCustomerId] = useState("");
  const [addressId, setAddressId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [frequency, setFrequency] = useState("one_time");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
  const [customerNotes, setCustomerNotes] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [assignedCleanerName, setAssignedCleanerName] = useState("");
  const [availableAddOns, setAvailableAddOns] = useState<AddOnOption[]>([]);
  const [selectedAddOns, setSelectedAddOns] = useState<AddOnSelection[]>([]);
  const [loadingAddOns, setLoadingAddOns] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const selectedCustomer = options.customers.find((item) => item.id === customerId);
  const selectedService = options.services.find((item) => item.id === serviceId);
  const selectedAddress = options.addresses.find((item) => item.id === addressId);
  const addOnsDuration = selectedAddOns.reduce(
    (total, addOn) => total + addOn.durationMinutes * addOn.quantity,
    0
  );
  const addOnsAmount = selectedAddOns.reduce(
    (total, addOn) => total + addOn.unitPrice * addOn.quantity,
    0
  );
  const estimatedDuration = selectedService ? selectedService.durationMinutes + addOnsDuration : 0;
  const endTime = selectedService ? calculateEndTime(startTime, estimatedDuration) : "";
  const estimatedTotal = selectedService
    ? selectedService.price + addOnsAmount + (selectedAddress?.serviceAreaFee ?? 0)
    : 0;

  const propertySummary = useMemo(() => {
    if (!selectedAddress) return "";
    const parts = [selectedAddress.propertyType, `${selectedAddress.propertySize} m²`];
    if (selectedAddress.propertyType === "apartment" || selectedAddress.propertyType === "house") {
      parts.push(`${selectedAddress.bedrooms} bed`, `${selectedAddress.bathrooms} bath`);
    }
    return parts.join(" · ");
  }, [selectedAddress]);

  useEffect(() => {
    async function loadOptions() {
      try {
        const response = await fetch("/api/admin/bookings/options", { cache: "no-store" });
        const payload = (await response.json()) as ApiEnvelope<BookingOptions>;
        if (!response.ok || !payload.success || !payload.data) {
          throw new Error(payload.error || payload.message || "Could not load booking options.");
        }
        setOptions(payload.data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Could not load the form.");
      } finally {
        setLoading(false);
      }
    }
    void loadOptions();
  }, []);

  useEffect(() => {
    setAddressId("");
    setError("");

    if (!customerId) {
      setOptions((current) => ({ ...current, addresses: [] }));
      return;
    }

    let active = true;
    setLoadingAddresses(true);

    fetch(`/api/admin/bookings/options?customerId=${encodeURIComponent(customerId)}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        const payload = (await response.json()) as ApiEnvelope<BookingOptions>;
        if (!response.ok || !payload.success || !payload.data) {
          throw new Error(payload.error || payload.message || "Could not load saved addresses.");
        }
        if (!active) return;
        setOptions(payload.data);
        const preferred =
          payload.data.addresses.find((address) => address.isDefault) ?? payload.data.addresses[0];
        setAddressId(preferred?.id ?? "");
      })
      .catch((loadError) => {
        if (active) {
          setError(
            loadError instanceof Error ? loadError.message : "Could not load saved addresses."
          );
        }
      })
      .finally(() => {
        if (active) setLoadingAddresses(false);
      });

    return () => {
      active = false;
    };
  }, [customerId]);

  useEffect(() => {
    setAvailableAddOns([]);
    setSelectedAddOns([]);

    if (!serviceId) return;

    let active = true;
    setLoadingAddOns(true);

    fetch(`/api/customer/services/${encodeURIComponent(serviceId)}/add-ons`, {
      cache: "no-store",
    })
      .then(async (response) => {
        const payload = (await response.json()) as ApiEnvelope<{
          addOns: AddOnOption[];
        }>;
        if (!response.ok || !payload.success || !payload.data) {
          throw new Error(payload.error || payload.message || "Could not load extra touches.");
        }
        if (active) setAvailableAddOns(payload.data.addOns);
      })
      .catch((loadError) => {
        if (active) {
          setError(
            loadError instanceof Error ? loadError.message : "Could not load extra touches."
          );
        }
      })
      .finally(() => {
        if (active) setLoadingAddOns(false);
      });

    return () => {
      active = false;
    };
  }, [serviceId]);

  function changeAddOn(addOn: AddOnOption, difference: number) {
    setSelectedAddOns((current) => {
      const existing = current.find((item) => item.id === addOn.id);
      const nextQuantity = Math.max(
        0,
        Math.min(addOn.maxQuantity, (existing?.quantity ?? 0) + difference)
      );

      if (nextQuantity === 0) {
        return current.filter((item) => item.id !== addOn.id);
      }

      if (existing) {
        return current.map((item) =>
          item.id === addOn.id ? { ...item, quantity: nextQuantity } : item
        );
      }

      return [...current, { ...addOn, quantity: nextQuantity }];
    });
  }

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!selectedAddress || !selectedService || !endTime) {
      setError("Choose a valid customer address, service, and time before continuing.");
      return;
    }
    if (!selectedAddress.serviceAreaId) {
      setError("This saved address is not connected to an active service area.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          serviceId,
          addressId,
          serviceAreaId: selectedAddress.serviceAreaId,
          frequency,
          property: {
            propertyType: selectedAddress.propertyType,
            bedrooms: selectedAddress.bedrooms,
            bathrooms: selectedAddress.bathrooms,
            propertySize: selectedAddress.propertySize,
          },
          addOns: selectedAddOns.map((addOn) => ({
            addOnId: addOn.id,
            quantity: addOn.quantity,
          })),
          paymentMethod,
          customerNotes,
          bookingDate,
          startTime,
          endTime,
          assignedCleanerName,
          adminNotes,
        }),
      });
      const payload = (await response.json()) as ApiEnvelope<{
        booking: { id: string };
      }>;

      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error || payload.message || "Could not create the booking.");
      }

      router.push(`/admin/bookings/${payload.data.booking.id}`);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Could not create the booking."
      );
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="grid min-h-[70vh] place-items-center bg-[#f4f8fd]">
        <Loader2 className="animate-spin text-blue-600" size={34} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f8fd] px-4 py-7 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() => router.push("/admin/bookings")}
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-700"
        >
          <ArrowLeft size={17} /> Back to bookings
        </button>

        <section className="overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0e315a] via-[#114d7b] to-[#087eaa] p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">
                <Sparkles size={15} /> Front desk
              </p>
              <h1 className="font-heading text-3xl font-semibold sm:text-4xl">
                Create an onsite booking
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
                Book on behalf of a customer visiting or calling the company. Pricing and
                availability are verified by the system before creation.
              </p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white/80 backdrop-blur">
              <span className="block text-xs uppercase tracking-wider text-cyan-200">
                Booking source
              </span>
              Admin · Onsite
            </div>
          </div>
        </section>

        <form onSubmit={submitBooking} className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="flex flex-col gap-6">
            <section className="order-1 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="flex items-center gap-2 font-heading text-xl font-semibold text-slate-900">
                <UserRound size={20} className="text-blue-600" /> Customer and location
              </h2>

              <label className="mt-5 block text-sm font-semibold text-slate-700">
                Customer
                <select
                  value={customerId}
                  onChange={(event) => setCustomerId(event.target.value)}
                  className={inputClass}
                  required
                >
                  <option value="">Select an existing customer</option>
                  {options.customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} — {customer.email}
                    </option>
                  ))}
                </select>
              </label>

              {selectedCustomer && (
                <div className="mt-3 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-900">
                  {selectedCustomer.email}
                  {selectedCustomer.phone ? ` · ${selectedCustomer.phone}` : ""}
                </div>
              )}

              {loadingAddresses ? (
                <div className="mt-5 flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 size={17} className="animate-spin" /> Loading saved buildings…
                </div>
              ) : customerId && options.addresses.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  This customer has no saved building details. Add their address and property
                  details from the customer account before creating the booking.
                </div>
              ) : (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {options.addresses.map((address) => (
                    <button
                      type="button"
                      key={address.id}
                      onClick={() => setAddressId(address.id)}
                      className={`cursor-pointer rounded-2xl border p-4 text-left transition ${
                        addressId === address.id
                          ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                          : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                      }`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-900">{address.label}</span>
                        {address.isDefault && (
                          <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase text-emerald-700">
                            Default
                          </span>
                        )}
                      </span>
                      <span className="mt-2 block text-sm leading-5 text-slate-600">
                        {address.street}, {address.area}, {address.city}
                      </span>
                      <span className="mt-2 block text-xs font-medium capitalize text-blue-700">
                        {address.propertyType} · {address.propertySize} m²
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="order-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="flex items-center gap-2 font-heading text-xl font-semibold text-slate-900">
                <Plus size={20} className="text-blue-600" /> Extra touches
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Add the optional extras requested by the customer during the onsite booking.
              </p>

              {!serviceId ? (
                <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                  Select a cleaning service to see its available extra touches.
                </div>
              ) : loadingAddOns ? (
                <div className="mt-5 flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 size={17} className="animate-spin" /> Loading extra touches…
                </div>
              ) : availableAddOns.length === 0 ? (
                <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                  This service does not have any extra touches configured.
                </div>
              ) : (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {availableAddOns.map((addOn) => {
                    const quantity =
                      selectedAddOns.find((item) => item.id === addOn.id)?.quantity ?? 0;

                    return (
                      <div
                        key={addOn.id}
                        className={`rounded-2xl border p-4 transition ${
                          quantity > 0 ? "border-blue-400 bg-blue-50" : "border-slate-200 bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-slate-900">{addOn.name}</h3>
                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              {addOn.description}
                            </p>
                          </div>
                          <span className="shrink-0 text-sm font-bold text-blue-700">
                            +${addOn.unitPrice.toFixed(2)}
                          </span>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-xs text-slate-500">
                            +{addOn.durationMinutes} min each
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              aria-label={`Remove one ${addOn.name}`}
                              onClick={() => changeAddOn(addOn, -1)}
                              disabled={quantity === 0}
                              className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-blue-300 disabled:opacity-35"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-6 text-center text-sm font-bold text-slate-800">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              aria-label={`Add one ${addOn.name}`}
                              onClick={() => changeAddOn(addOn, 1)}
                              disabled={quantity >= addOn.maxQuantity}
                              className="grid h-8 w-8 place-items-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-700 disabled:opacity-35"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="order-2 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="flex items-center gap-2 font-heading text-xl font-semibold text-slate-900">
                <Sparkles size={20} className="text-blue-600" /> Choose the cleaning plan
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Select the main plan before choosing optional extra touches.
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                  Cleaning plan
                  <select
                    value={serviceId}
                    onChange={(event) => setServiceId(event.target.value)}
                    className={inputClass}
                    required
                  >
                    <option value="">Select a cleaning plan</option>
                    {options.services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} — ${service.price.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Date
                  <input
                    type="date"
                    value={bookingDate}
                    min={todayInBeirut()}
                    onChange={(event) => setBookingDate(event.target.value)}
                    className={inputClass}
                    required
                  />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Start time
                  <input
                    type="time"
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                    className={inputClass}
                    required
                  />
                  {startTime && selectedService && (
                    <span className="mt-2 block text-xs text-slate-500">
                      Estimated end: {endTime || "Choose an earlier time"}
                    </span>
                  )}
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Frequency
                  <select
                    value={frequency}
                    onChange={(event) => setFrequency(event.target.value)}
                    className={inputClass}
                  >
                    <option value="one_time">One time</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Every two weeks</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Payment method
                  <select
                    value={paymentMethod}
                    onChange={(event) => setPaymentMethod(event.target.value as "cash" | "card")}
                    className={inputClass}
                  >
                    <option value="cash">Cash onsite</option>
                    <option value="card">Card</option>
                  </select>
                </label>
                <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                  Cleaner name (optional)
                  <input
                    value={assignedCleanerName}
                    onChange={(event) => setAssignedCleanerName(event.target.value)}
                    maxLength={120}
                    placeholder="Assign now or leave for later"
                    className={inputClass}
                  />
                </label>
              </div>
            </section>

            <section className="order-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="flex items-center gap-2 font-heading text-xl font-semibold text-slate-900">
                <ReceiptText size={20} className="text-blue-600" /> Notes
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold text-slate-700">
                  Customer instructions
                  <textarea
                    value={customerNotes}
                    onChange={(event) => setCustomerNotes(event.target.value)}
                    maxLength={1000}
                    rows={4}
                    className={inputClass}
                    placeholder="Access or cleaning instructions"
                  />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Internal admin note
                  <textarea
                    value={adminNotes}
                    onChange={(event) => setAdminNotes(event.target.value)}
                    maxLength={2000}
                    rows={4}
                    className={inputClass}
                    placeholder="Visible to the admin team"
                  />
                </label>
              </div>
            </section>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-heading text-xl font-semibold text-slate-900">Booking summary</h2>
              <div className="mt-5 space-y-4 text-sm">
                <div className="flex gap-3">
                  <UserRound size={18} className="mt-0.5 shrink-0 text-blue-600" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Customer
                    </p>
                    <p className="mt-1 font-medium text-slate-800">
                      {selectedCustomer?.name || "Not selected"}
                    </p>
                  </div>
                </div>
                {selectedAddOns.length > 0 && (
                  <div className="rounded-xl bg-blue-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
                      Extra touches
                    </p>
                    <div className="mt-2 space-y-1.5">
                      {selectedAddOns.map((addOn) => (
                        <div
                          key={addOn.id}
                          className="flex items-center justify-between gap-3 text-xs"
                        >
                          <span className="text-slate-700">
                            {addOn.name} × {addOn.quantity}
                          </span>
                          <span className="font-semibold text-blue-700">
                            ${(addOn.unitPrice * addOn.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-3">
                  <MapPin size={18} className="mt-0.5 shrink-0 text-blue-600" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Building
                    </p>
                    <p className="mt-1 font-medium text-slate-800">
                      {selectedAddress
                        ? `${selectedAddress.street}, ${selectedAddress.area}`
                        : "Not selected"}
                    </p>
                    {propertySummary && (
                      <p className="mt-1 text-xs capitalize text-slate-500">{propertySummary}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  <Building2 size={18} className="mt-0.5 shrink-0 text-blue-600" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Service
                    </p>
                    <p className="mt-1 font-medium text-slate-800">
                      {selectedService?.name || "Not selected"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CalendarDays size={18} className="mt-0.5 shrink-0 text-blue-600" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Schedule
                    </p>
                    <p className="mt-1 font-medium text-slate-800">
                      {bookingDate || "No date"} {startTime ? `· ${startTime}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Clock3 size={18} className="mt-0.5 shrink-0 text-blue-600" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Estimated duration
                    </p>
                    <p className="mt-1 font-medium text-slate-800">
                      {selectedService ? `${estimatedDuration} minutes` : "Not available"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-200 pt-5">
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>Starting estimate</span>
                  <span className="font-heading text-2xl font-semibold text-slate-900">
                    ${estimatedTotal.toFixed(2)}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  Final property pricing and availability are calculated securely when you create
                  the booking.
                </p>
              </div>

              {error && (
                <div
                  role="alert"
                  className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-5 text-red-700"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={
                  submitting ||
                  !customerId ||
                  !addressId ||
                  !serviceId ||
                  !bookingDate ||
                  !startTime ||
                  !endTime
                }
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={18} />
                )}
                {submitting ? "Creating booking…" : "Create onsite booking"}
              </button>
              <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-400">
                <CreditCard size={13} />{" "}
                {paymentMethod === "cash" ? "Cash payment" : "Card payment"}
              </div>
            </div>
          </aside>
        </form>
      </div>
    </main>
  );
}
