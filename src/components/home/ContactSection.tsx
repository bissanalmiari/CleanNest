"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Headphones,
  LoaderCircle,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";

type FormValues = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

type ContactItem = {
  icon: LucideIcon;
  title: string;
  value: string;
  description: string;
  href?: string;
  iconClass: string;
  glowClass: string;
};

const initialValues: FormValues = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

const contactItems: ContactItem[] = [
  {
    icon: Mail,
    title: "Email Support",
    value: "support@cleannest.com",
    description: "Send us your questions at any time.",
    href: "mailto:support@cleannest.com",
    iconClass: "bg-blue-50 text-blue-600",
    glowClass: "bg-blue-400/15",
  },
  {
    icon: Phone,
    title: "Call CleanNest",
    value: "+961 1 234 567",
    description: "Speak directly with our support team.",
    href: "tel:+9611234567",
    iconClass: "bg-emerald-50 text-emerald-600",
    glowClass: "bg-emerald-400/15",
  },
  {
    icon: MapPin,
    title: "Service Area",
    value: "Beirut, Lebanon",
    description: "Cleaning services across supported areas.",
    iconClass: "bg-violet-50 text-violet-600",
    glowClass: "bg-violet-400/15",
  },
  {
    icon: Clock3,
    title: "Working Hours",
    value: "Monday – Saturday",
    description: "8:00 AM until 7:00 PM.",
    iconClass: "bg-amber-50 text-amber-600",
    glowClass: "bg-amber-400/15",
  },
];

const supportSteps = [
  {
    number: "01",
    title: "Send your message",
    description: "Tell us what you need help with.",
  },
  {
    number: "02",
    title: "We review your request",
    description: "Our team checks the details carefully.",
  },
  {
    number: "03",
    title: "Receive assistance",
    description: "We respond with the appropriate support.",
  },
];

const particles = [
  {
    top: "10%",
    left: "5%",
    size: 6,
    duration: 6,
    delay: 0,
  },
  {
    top: "24%",
    left: "94%",
    size: 9,
    duration: 8,
    delay: 1,
  },
  {
    top: "72%",
    left: "6%",
    size: 8,
    duration: 7,
    delay: 0.6,
  },
  {
    top: "88%",
    left: "80%",
    size: 5,
    duration: 6,
    delay: 1.4,
  },
  {
    top: "18%",
    left: "52%",
    size: 7,
    duration: 7,
    delay: 2,
  },
  {
    top: "62%",
    left: "97%",
    size: 6,
    duration: 8,
    delay: 0.3,
  },
];

function validateForm(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.name.trim()) {
    errors.name = "Please enter your name.";
  } else if (values.name.trim().length < 2) {
    errors.name = "Your name must contain at least 2 characters.";
  }

  if (!values.email.trim()) {
    errors.email = "Please enter your email address.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Please enter a valid email address.";
  }

  if (values.phone.trim() && !/^[+()\d\s-]{7,20}$/.test(values.phone.trim())) {
    errors.phone = "Please enter a valid phone number.";
  }

  if (!values.subject.trim()) {
    errors.subject = "Please select a subject.";
  }

  if (!values.message.trim()) {
    errors.message = "Please enter your message.";
  } else if (values.message.trim().length < 15) {
    errors.message = "Please provide at least 15 characters so we can understand your request.";
  }

  return errors;
}

function ErrorMessage({ id, message }: { id: string; message?: string }) {
  return (
    <AnimatePresence initial={false}>
      {message && (
        <motion.p
          id={id}
          initial={{
            opacity: 0,
            y: -5,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          exit={{
            opacity: 0,
            y: -5,
          }}
          className="mt-2 text-xs font-medium text-red-600"
        >
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

export default function ContactSection() {
  const [values, setValues] = useState<FormValues>(initialValues);

  const [errors, setErrors] = useState<FormErrors>({});

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionReference, setSubmissionReference] = useState("");
  const [submissionError, setSubmissionError] = useState("");

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const fieldName = event.target.name as keyof FormValues;

    const fieldValue = event.target.value;

    setValues((currentValues) => ({
      ...currentValues,
      [fieldName]: fieldValue,
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      [fieldName]: undefined,
    }));

    setIsSubmitted(false);
    setSubmissionReference("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateForm(values);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsSubmitted(false);
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    setSubmissionError("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload = (await response.json()) as {
        success?: boolean;
        error?: string;
        data?: {
          submitted?: boolean;
          reference?: string;
        };
      };
      if (!response.ok || !payload.success || !payload.data?.submitted) {
        throw new Error(payload.error ?? "Your message could not be sent.");
      }
      setIsSubmitted(true);
      setSubmissionReference(payload.data.reference ?? "");
      setValues(initialValues);
    } catch (error) {
      setIsSubmitted(false);
      setSubmissionError(
        error instanceof Error ? error.message : "Your message could not be sent. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <MotionConfig reducedMotion="always">
      <section
        id="contact"
        className="relative isolate overflow-hidden bg-white py-24 font-body sm:py-28 lg:py-32"
      >
        {/* Background */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_9%_15%,rgba(30,111,217,0.15),transparent_29%),radial-gradient(circle_at_91%_78%,rgba(34,211,238,0.13),transparent_27%),linear-gradient(to_bottom,#ffffff,#f5f9fe_48%,#edf6ff)]"
        />

        {/* Moving grid */}
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(30,111,217,0.11) 1px, transparent 1px), linear-gradient(90deg, rgba(30,111,217,0.11) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
          }}
          animate={{
            backgroundPosition: ["0px 0px", "72px 72px"],
          }}
          transition={{
            duration: 22,
            repeat: 0,
            ease: "linear",
          }}
        />

        {/* Moving glows */}
        <motion.div
          aria-hidden="true"
          className="bg-primary/12 absolute -left-64 top-1/4 h-[42rem] w-[42rem] rounded-full blur-3xl"
          animate={{
            x: [0, 115, 0],
            y: [0, -55, 0],
            scale: [1, 1.25, 1],
          }}
          transition={{
            duration: 15,
            repeat: 0,
            ease: "easeInOut",
          }}
        />

        <motion.div
          aria-hidden="true"
          className="absolute -right-64 bottom-0 h-[44rem] w-[44rem] rounded-full bg-cyan-300/15 blur-3xl"
          animate={{
            x: [0, -95, 0],
            y: [0, 60, 0],
            scale: [1.2, 1, 1.2],
          }}
          transition={{
            duration: 17,
            repeat: 0,
            ease: "easeInOut",
          }}
        />

        {/* Scanning light */}
        <motion.div
          aria-hidden="true"
          className="absolute -top-full left-0 h-[72rem] w-40 rotate-[22deg] bg-gradient-to-b from-transparent via-primary/[0.05] to-transparent blur-2xl"
          animate={{
            x: [-320, 1800],
          }}
          transition={{
            duration: 9,
            repeat: 0,
            repeatDelay: 2,
            ease: "easeInOut",
          }}
        />

        {/* Floating particles */}
        <div aria-hidden="true" className="absolute inset-0">
          {particles.map((particle, index) => (
            <motion.span
              key={`${particle.top}-${particle.left}`}
              className="absolute rounded-full bg-primary/40 shadow-[0_0_16px_rgba(30,111,217,0.45)]"
              style={{
                top: particle.top,
                left: particle.left,
                width: particle.size,
                height: particle.size,
              }}
              animate={{
                x: [0, index % 2 === 0 ? 20 : -20, 0],
                y: [0, -30, 0],
                opacity: [0.15, 0.85, 0.15],
                scale: [0.7, 1.4, 0.7],
              }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                repeat: 0,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        {/* Decorative circles */}
        <motion.div
          aria-hidden="true"
          className="absolute -left-44 top-[36%] h-80 w-80 rounded-full border border-dashed border-primary/10"
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 34,
            repeat: 0,
            ease: "linear",
          }}
        />

        <motion.div
          aria-hidden="true"
          className="absolute -right-44 top-[18%] h-96 w-96 rounded-full border border-dashed border-cyan-400/10"
          animate={{
            rotate: -360,
          }}
          transition={{
            duration: 40,
            repeat: 0,
            ease: "linear",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          {/* Heading */}
          <motion.div
            initial={{
              opacity: 0,
              y: 45,
              filter: "blur(10px)",
            }}
            whileInView={{
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
            }}
            viewport={{
              once: true,
              amount: 0.35,
            }}
            transition={{
              duration: 0.85,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mx-auto max-w-3xl text-center"
          >
            <motion.div
              whileHover={{
                scale: 1.05,
              }}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/80 px-4 py-2 text-sm font-semibold text-primary shadow-card backdrop-blur-md"
            >
              <motion.span
                animate={{
                  rotate: [0, 18, -18, 0],
                  scale: [1, 1.25, 1],
                }}
                transition={{
                  duration: 2.5,
                  repeat: 0,
                  repeatDelay: 1,
                }}
              >
                <MessageCircle className="h-4 w-4" />
              </motion.span>
              Contact CleanNest
            </motion.div>

            <h2 className="font-heading text-4xl font-extrabold leading-tight tracking-tight text-navy sm:text-5xl lg:text-6xl">
              Have a Question or
              <span className="mt-2 block bg-gradient-to-r from-primary via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                Need Help with a Booking?
              </span>
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              Send us a message about your account, cleaning service, schedule, payment, or booking.
              Our support team is ready to help.
            </p>
          </motion.div>

          {/* Contact information cards */}
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {contactItems.map((item, index) => {
              const Icon = item.icon;

              const cardContent = (
                <>
                  <motion.div
                    aria-hidden="true"
                    className={`absolute -right-14 -top-16 h-40 w-40 rounded-full blur-3xl ${item.glowClass}`}
                    animate={{
                      scale: [1, 1.25, 1],
                      opacity: [0.35, 0.75, 0.35],
                    }}
                    transition={{
                      duration: 5 + index,
                      repeat: 0,
                      ease: "easeInOut",
                    }}
                  />

                  <div className="relative">
                    <motion.span
                      whileHover={{
                        scale: 1.1,
                        rotate: 5,
                      }}
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl ${item.iconClass}`}
                    >
                      <Icon className="h-6 w-6" />
                    </motion.span>

                    <h3 className="mt-5 font-heading text-lg font-bold text-navy">{item.title}</h3>

                    <p className="mt-2 break-words text-sm font-semibold text-primary">
                      {item.value}
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
                  </div>
                </>
              );

              return (
                <motion.article
                  key={item.title}
                  initial={{
                    opacity: 0,
                    y: 40,
                    scale: 0.94,
                  }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                  }}
                  viewport={{
                    once: true,
                    amount: 0.25,
                  }}
                  transition={{
                    duration: 0.7,
                    delay: index * 0.1,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  whileHover={{
                    y: -7,
                  }}
                  className="relative overflow-hidden rounded-[1.6rem] border border-primary/10 bg-white/85 p-6 shadow-[0_16px_45px_rgba(11,37,69,0.08)] backdrop-blur-md"
                >
                  {item.href ? (
                    <a href={item.href} className="block">
                      {cardContent}
                    </a>
                  ) : (
                    cardContent
                  )}
                </motion.article>
              );
            })}
          </div>

          {/* Main form and visual */}
          <div className="mt-12 grid items-stretch gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Contact form */}
            <motion.div
              initial={{
                opacity: 0,
                x: -65,
                scale: 0.96,
              }}
              whileInView={{
                opacity: 1,
                x: 0,
                scale: 1,
              }}
              viewport={{
                once: true,
                amount: 0.15,
              }}
              transition={{
                duration: 0.9,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="relative overflow-hidden rounded-[2rem] border border-primary/10 bg-white/90 p-6 shadow-[0_28px_85px_rgba(11,37,69,0.12)] backdrop-blur-md sm:p-8 lg:p-10"
            >
              <motion.div
                aria-hidden="true"
                className="absolute -left-24 -top-28 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
                animate={{
                  x: [0, 45, 0],
                  scale: [1, 1.25, 1],
                }}
                transition={{
                  duration: 8,
                  repeat: 0,
                  ease: "easeInOut",
                }}
              />

              <motion.div
                aria-hidden="true"
                className="absolute -bottom-28 -right-20 h-72 w-72 rounded-full bg-cyan-300/15 blur-3xl"
                animate={{
                  y: [0, -35, 0],
                  scale: [1.2, 1, 1.2],
                }}
                transition={{
                  duration: 9,
                  repeat: 0,
                  ease: "easeInOut",
                }}
              />

              <div className="relative">
                <div className="flex items-start gap-4">
                  <motion.span
                    animate={{
                      rotate: [0, 5, -5, 0],
                      scale: [1, 1.06, 1],
                    }}
                    transition={{
                      duration: 3,
                      repeat: 0,
                    }}
                    className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-primary-light text-primary"
                  >
                    <Send className="h-6 w-6" />
                  </motion.span>

                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">
                      Send a message
                    </p>

                    <h3 className="mt-2 font-heading text-2xl font-extrabold text-navy sm:text-3xl">
                      Tell us how we can help.
                    </h3>

                    <p className="mt-2 leading-7 text-slate-600">
                      Complete the form and include any useful details about your request.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} noValidate className="mt-9">
                  {submissionError && (
                    <div
                      role="alert"
                      className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
                    >
                      {submissionError}
                    </div>
                  )}
                  <div className="grid gap-6 sm:grid-cols-2">
                    {/* Name */}
                    <div>
                      <label htmlFor="contact-name" className="text-sm font-semibold text-navy">
                        Full name
                      </label>

                      <div className="group relative mt-2">
                        <UserRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary" />

                        <input
                          id="contact-name"
                          name="name"
                          type="text"
                          autoComplete="name"
                          value={values.name}
                          onChange={handleChange}
                          placeholder="Enter your name"
                          aria-invalid={Boolean(errors.name)}
                          aria-describedby={errors.name ? "contact-name-error" : undefined}
                          className={`min-h-[54px] w-full rounded-xl border bg-white px-4 py-3 pl-12 text-sm text-navy outline-none transition-all duration-300 placeholder:text-slate-400 focus:ring-4 ${
                            errors.name
                              ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                              : "border-primary/10 focus:border-primary/40 focus:ring-primary/10"
                          }`}
                        />
                      </div>

                      <ErrorMessage id="contact-name-error" message={errors.name} />
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor="contact-email" className="text-sm font-semibold text-navy">
                        Email address
                      </label>

                      <div className="group relative mt-2">
                        <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary" />

                        <input
                          id="contact-email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          value={values.email}
                          onChange={handleChange}
                          placeholder="name@example.com"
                          aria-invalid={Boolean(errors.email)}
                          aria-describedby={errors.email ? "contact-email-error" : undefined}
                          className={`min-h-[54px] w-full rounded-xl border bg-white px-4 py-3 pl-12 text-sm text-navy outline-none transition-all duration-300 placeholder:text-slate-400 focus:ring-4 ${
                            errors.email
                              ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                              : "border-primary/10 focus:border-primary/40 focus:ring-primary/10"
                          }`}
                        />
                      </div>

                      <ErrorMessage id="contact-email-error" message={errors.email} />
                    </div>

                    {/* Phone */}
                    <div>
                      <label htmlFor="contact-phone" className="text-sm font-semibold text-navy">
                        Phone number
                        <span className="ml-1 font-normal text-slate-400">(optional)</span>
                      </label>

                      <div className="group relative mt-2">
                        <Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary" />

                        <input
                          id="contact-phone"
                          name="phone"
                          type="tel"
                          autoComplete="tel"
                          value={values.phone}
                          onChange={handleChange}
                          placeholder="+961"
                          aria-invalid={Boolean(errors.phone)}
                          aria-describedby={errors.phone ? "contact-phone-error" : undefined}
                          className={`min-h-[54px] w-full rounded-xl border bg-white px-4 py-3 pl-12 text-sm text-navy outline-none transition-all duration-300 placeholder:text-slate-400 focus:ring-4 ${
                            errors.phone
                              ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                              : "border-primary/10 focus:border-primary/40 focus:ring-primary/10"
                          }`}
                        />
                      </div>

                      <ErrorMessage id="contact-phone-error" message={errors.phone} />
                    </div>

                    {/* Subject */}
                    <div>
                      <label htmlFor="contact-subject" className="text-sm font-semibold text-navy">
                        Subject
                      </label>

                      <div className="group relative mt-2">
                        <MessageCircle className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary" />

                        <select
                          id="contact-subject"
                          name="subject"
                          value={values.subject}
                          onChange={handleChange}
                          aria-invalid={Boolean(errors.subject)}
                          aria-describedby={errors.subject ? "contact-subject-error" : undefined}
                          className={`min-h-[54px] w-full appearance-none rounded-xl border bg-white px-4 py-3 pl-12 pr-10 text-sm text-navy outline-none transition-all duration-300 focus:ring-4 ${
                            errors.subject
                              ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                              : "border-primary/10 focus:border-primary/40 focus:ring-primary/10"
                          }`}
                        >
                          <option value="">Select a subject</option>

                          <option value="booking">Booking assistance</option>

                          <option value="service">Service question</option>

                          <option value="payment">Payment question</option>

                          <option value="account">Account support</option>

                          <option value="other">Other request</option>
                        </select>

                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                          ▼
                        </span>
                      </div>

                      <ErrorMessage id="contact-subject-error" message={errors.subject} />
                    </div>
                  </div>

                  {/* Message */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between gap-4">
                      <label htmlFor="contact-message" className="text-sm font-semibold text-navy">
                        Message
                      </label>

                      <span className="text-xs text-slate-400">
                        {values.message.length}
                        /500
                      </span>
                    </div>

                    <textarea
                      id="contact-message"
                      name="message"
                      value={values.message}
                      onChange={handleChange}
                      maxLength={500}
                      rows={6}
                      placeholder="Describe your question or request..."
                      aria-invalid={Boolean(errors.message)}
                      aria-describedby={errors.message ? "contact-message-error" : undefined}
                      className={`mt-2 w-full resize-none rounded-xl border bg-white px-4 py-4 text-sm leading-7 text-navy outline-none transition-all duration-300 placeholder:text-slate-400 focus:ring-4 ${
                        errors.message
                          ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                          : "border-primary/10 focus:border-primary/40 focus:ring-primary/10"
                      }`}
                    />

                    <ErrorMessage id="contact-message-error" message={errors.message} />
                  </div>

                  {/* Success message */}
                  <AnimatePresence initial={false}>
                    {isSubmitted && (
                      <motion.div
                        initial={{
                          opacity: 0,
                          y: 15,
                          scale: 0.96,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          scale: 1,
                        }}
                        exit={{
                          opacity: 0,
                          y: -10,
                        }}
                        className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-emerald-700"
                      >
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

                        <div>
                          <p className="text-sm font-bold">Message sent successfully.</p>

                          <p className="mt-1 text-xs leading-5">
                            Your request was saved and the CleanNest support team has been notified.
                          </p>

                          {submissionReference && (
                            <p className="mt-2 text-xs font-bold">
                              Reference: CN-{submissionReference}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-2 text-xs leading-5 text-slate-500">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      Your information is used only to respond to your request.
                    </div>

                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      whileHover={
                        isSubmitting
                          ? undefined
                          : {
                              y: -4,
                              scale: 1.02,
                            }
                      }
                      whileTap={
                        isSubmitting
                          ? undefined
                          : {
                              scale: 0.97,
                            }
                      }
                      className="group relative inline-flex min-h-[54px] items-center justify-center gap-3 overflow-hidden rounded-xl bg-primary px-7 py-3.5 font-bold text-white shadow-[0_16px_38px_rgba(30,111,217,0.28)] transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {!isSubmitting && (
                        <motion.span
                          aria-hidden="true"
                          className="absolute inset-y-0 -left-1/2 w-1/3 skew-x-[-20deg] bg-white/20"
                          animate={{
                            left: ["-50%", "140%"],
                          }}
                          transition={{
                            duration: 2.4,
                            repeat: 0,
                            repeatDelay: 1.5,
                          }}
                        />
                      )}

                      {isSubmitting ? (
                        <>
                          <LoaderCircle className="relative h-5 w-5 animate-spin" />

                          <span className="relative">Sending...</span>
                        </>
                      ) : (
                        <>
                          <span className="relative">Send Message</span>

                          <ArrowRight className="relative h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                        </>
                      )}
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>

            {/* Support visual */}
            <motion.aside
              initial={{
                opacity: 0,
                x: 65,
                scale: 0.94,
              }}
              whileInView={{
                opacity: 1,
                x: 0,
                scale: 1,
              }}
              viewport={{
                once: true,
                amount: 0.15,
              }}
              transition={{
                duration: 0.9,
                delay: 0.12,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-navy via-[#123b6f] to-primary-dark p-7 shadow-[0_30px_90px_rgba(11,37,69,0.28)] sm:p-9"
            >
              <motion.div
                aria-hidden="true"
                className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/45 blur-3xl"
                animate={{
                  scale: [1, 1.3, 1],
                  x: [0, 40, 0],
                }}
                transition={{
                  duration: 7,
                  repeat: 0,
                  ease: "easeInOut",
                }}
              />

              <motion.div
                aria-hidden="true"
                className="absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-cyan-400/25 blur-3xl"
                animate={{
                  scale: [1.2, 1, 1.2],
                  y: [0, -40, 0],
                }}
                transition={{
                  duration: 8,
                  repeat: 0,
                  ease: "easeInOut",
                }}
              />

              <motion.div
                aria-hidden="true"
                className="absolute -top-full left-1/4 h-[42rem] w-28 rotate-[24deg] bg-gradient-to-b from-transparent via-white/10 to-transparent blur-xl"
                animate={{
                  x: [-250, 750],
                }}
                transition={{
                  duration: 5,
                  repeat: 0,
                  repeatDelay: 2,
                  ease: "easeInOut",
                }}
              />

              <div className="relative flex h-full flex-col">
                <div className="relative mx-auto flex h-72 w-72 max-w-full items-center justify-center">
                  <motion.div
                    aria-hidden="true"
                    className="absolute h-64 w-64 rounded-full border border-dashed border-blue-200/25"
                    animate={{
                      rotate: 360,
                    }}
                    transition={{
                      duration: 24,
                      repeat: 0,
                      ease: "linear",
                    }}
                  />

                  <motion.div
                    aria-hidden="true"
                    className="absolute h-52 w-52 rounded-full border border-dashed border-cyan-200/20"
                    animate={{
                      rotate: -360,
                    }}
                    transition={{
                      duration: 18,
                      repeat: 0,
                      ease: "linear",
                    }}
                  />

                  <motion.div
                    aria-hidden="true"
                    className="absolute h-40 w-40 rounded-full bg-primary/35 blur-2xl"
                    animate={{
                      scale: [0.9, 1.3, 0.9],
                      opacity: [0.45, 0.85, 0.45],
                    }}
                    transition={{
                      duration: 4,
                      repeat: 0,
                      ease: "easeInOut",
                    }}
                  />

                  <motion.div
                    animate={{
                      y: [0, -11, 0],
                      rotate: [0, 3, -3, 0],
                    }}
                    transition={{
                      duration: 4,
                      repeat: 0,
                      ease: "easeInOut",
                    }}
                    className="relative flex h-32 w-32 items-center justify-center rounded-[2.3rem] bg-white text-primary shadow-[0_28px_70px_rgba(0,0,0,0.28)]"
                  >
                    <Headphones className="h-16 w-16" />

                    <motion.span
                      className="absolute -right-3 -top-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg"
                      animate={{
                        scale: [1, 1.2, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: 0,
                      }}
                    >
                      <CheckCircle2 className="h-5 w-5" />
                    </motion.span>
                  </motion.div>

                  <motion.div
                    className="absolute left-0 top-10 rounded-2xl border border-white/10 bg-white/10 px-3 py-3 shadow-xl backdrop-blur-md"
                    animate={{
                      y: [0, -10, 0],
                    }}
                    transition={{
                      duration: 3.6,
                      repeat: 0,
                      ease: "easeInOut",
                    }}
                  >
                    <Mail className="h-5 w-5 text-cyan-300" />
                  </motion.div>

                  <motion.div
                    className="absolute bottom-8 right-0 rounded-2xl border border-white/10 bg-white/10 px-3 py-3 shadow-xl backdrop-blur-md"
                    animate={{
                      y: [0, 10, 0],
                    }}
                    transition={{
                      duration: 4.2,
                      repeat: 0,
                      ease: "easeInOut",
                    }}
                  >
                    <MessageCircle className="h-5 w-5 text-blue-200" />
                  </motion.div>

                  <motion.span
                    aria-hidden="true"
                    className="absolute right-7 top-7 text-cyan-300"
                    animate={{
                      rotate: 360,
                      scale: [0.8, 1.25, 0.8],
                    }}
                    transition={{
                      duration: 4,
                      repeat: 0,
                      ease: "linear",
                    }}
                  >
                    <Sparkles className="h-7 w-7" />
                  </motion.span>
                </div>

                <p className="mt-5 text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">
                  Simple support process
                </p>

                <h3 className="mt-3 font-heading text-3xl font-extrabold leading-tight text-white sm:text-4xl">
                  Clear answers without unnecessary complications.
                </h3>

                <p className="mt-4 leading-7 text-blue-100/75">
                  CleanNest makes it easy to ask questions and get support for every part of your
                  cleaning journey.
                </p>

                <div className="mt-8 space-y-4">
                  {supportSteps.map((step, index) => (
                    <motion.div
                      key={step.number}
                      initial={{
                        opacity: 0,
                        x: 25,
                      }}
                      whileInView={{
                        opacity: 1,
                        x: 0,
                      }}
                      viewport={{
                        once: true,
                      }}
                      transition={{
                        delay: 0.35 + index * 0.13,
                      }}
                      whileHover={{
                        x: 6,
                      }}
                      className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur-md"
                    >
                      <motion.span
                        animate={
                          index === 1
                            ? {
                                scale: [1, 1.12, 1],
                              }
                            : undefined
                        }
                        transition={{
                          duration: 2,
                          repeat: 0,
                        }}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-xs font-extrabold text-primary"
                      >
                        {step.number}
                      </motion.span>

                      <div>
                        <h4 className="font-heading text-sm font-bold text-white">{step.title}</h4>

                        <p className="mt-1 text-xs leading-5 text-blue-100/65">
                          {step.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-auto pt-8">
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-300/15 bg-emerald-400/10 px-4 py-3">
                    <motion.span
                      className="h-2.5 w-2.5 rounded-full bg-emerald-400"
                      animate={{
                        scale: [1, 1.4, 1],
                        opacity: [0.6, 1, 0.6],
                      }}
                      transition={{
                        duration: 1.8,
                        repeat: 0,
                      }}
                    />

                    <span className="text-sm font-semibold text-emerald-100">
                      Support form available now
                    </span>
                  </div>
                </div>
              </div>
            </motion.aside>
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}
