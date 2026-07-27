"use client";

import Link from "next/link";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Headphones,
  HelpCircle,
  Mail,
  MessageCircle,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";

type FAQ = {
  question: string;
  answer: string;
  icon: LucideIcon;
  category: string;
  accentClass: string;
  iconClass: string;
};

const faqs: FAQ[] = [
  {
    question: "How do I book a cleaning service?",
    answer:
      "Create or sign in to your CleanNest account, select a cleaning service, choose your preferred address, date, and time, then review the booking details before confirming.",
    icon: CalendarClock,
    category: "Booking",
    accentClass: "bg-blue-500",
    iconClass: "bg-blue-50 text-blue-600",
  },
  {
    question: "Which payment methods are available?",
    answer:
      "CleanNest supports cash payment after the service is completed. A test card payment option is also available for demonstrating the online checkout process during the project.",
    icon: CreditCard,
    category: "Payment",
    accentClass: "bg-violet-500",
    iconClass: "bg-violet-50 text-violet-600",
  },
  {
    question: "Can I cancel or reschedule my booking?",
    answer:
      "Yes. Customers can cancel or reschedule an upcoming booking from their account when the request is made at least 24 hours before the scheduled cleaning time.",
    icon: RefreshCcw,
    category: "Changes",
    accentClass: "bg-cyan-500",
    iconClass: "bg-cyan-50 text-cyan-600",
  },
  {
    question: "Can I choose a specific cleaning time?",
    answer:
      "Yes. Available dates and time slots are shown during the booking process. You can select the option that works best for your schedule before confirming the booking.",
    icon: Clock3,
    category: "Scheduling",
    accentClass: "bg-amber-500",
    iconClass: "bg-amber-50 text-amber-600",
  },
  {
    question: "Will I see the full price before confirming?",
    answer:
      "Yes. CleanNest displays the selected service, any additional options, discounts, and final total before you confirm the booking, so the cost is clear in advance.",
    icon: CircleDollarSign,
    category: "Pricing",
    accentClass: "bg-emerald-500",
    iconClass: "bg-emerald-50 text-emerald-600",
  },
  {
    question: "Can several cleaners be assigned to one booking?",
    answer:
      "Yes. Depending on the service, property requirements, and availability, the administrator can assign one or several cleaners to complete a booking.",
    icon: ShieldCheck,
    category: "Service",
    accentClass: "bg-rose-500",
    iconClass: "bg-rose-50 text-rose-600",
  },
];

const supportBenefits = [
  "Help with choosing a service",
  "Booking and scheduling support",
  "Account and payment assistance",
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
    top: "23%",
    left: "93%",
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
    top: "86%",
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
    left: "96%",
    size: 6,
    duration: 8,
    delay: 0.3,
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  function toggleQuestion(index: number) {
    setOpenIndex((currentIndex) => {
      return currentIndex === index ? null : index;
    });
  }

  return (
    <MotionConfig reducedMotion="always">
      <section
        id="faq"
        className="relative isolate overflow-hidden bg-surface-soft py-24 font-body sm:py-28 lg:py-32"
      >
        {/* Light compatible background */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_10%_15%,rgba(30,111,217,0.15),transparent_29%),radial-gradient(circle_at_90%_78%,rgba(34,211,238,0.13),transparent_27%),linear-gradient(to_bottom,#f5f9fe,#ffffff_48%,#edf6ff)]"
        />

        {/* Continuously moving grid */}
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

        {/* Animated glow areas */}
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

        {/* Decorative rotating circles */}
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
                <HelpCircle className="h-4 w-4" />
              </motion.span>
              Frequently Asked Questions
            </motion.div>

            <h2 className="font-heading text-4xl font-extrabold leading-tight tracking-tight text-navy sm:text-5xl lg:text-6xl">
              Everything You Need to Know
              <span className="mt-2 block bg-gradient-to-r from-primary via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                Before Your Next Cleaning.
              </span>
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              Find clear answers about bookings, payments, scheduling, cancellations, and how
              CleanNest services work.
            </p>
          </motion.div>

          <div className="mt-16 grid items-start gap-8 lg:grid-cols-[1.25fr_0.75fr]">
            {/* Accordion */}
            <motion.div
              initial={{
                opacity: 0,
                x: -60,
              }}
              whileInView={{
                opacity: 1,
                x: 0,
              }}
              viewport={{
                once: true,
                amount: 0.15,
              }}
              transition={{
                duration: 0.85,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="space-y-4"
            >
              {faqs.map((faq, index) => {
                const Icon = faq.icon;
                const isOpen = openIndex === index;
                const contentId = `faq-answer-${index}`;

                return (
                  <motion.article
                    key={faq.question}
                    initial={{
                      opacity: 0,
                      y: 35,
                    }}
                    whileInView={{
                      opacity: 1,
                      y: 0,
                    }}
                    viewport={{
                      once: true,
                      amount: 0.2,
                    }}
                    transition={{
                      duration: 0.65,
                      delay: index * 0.08,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    whileHover={{
                      y: -3,
                    }}
                    className={`group relative overflow-hidden rounded-[1.6rem] border bg-white/85 shadow-[0_16px_45px_rgba(11,37,69,0.08)] backdrop-blur-md transition-[border-color,box-shadow] duration-300 ${
                      isOpen
                        ? "border-primary/25 shadow-[0_24px_65px_rgba(11,37,69,0.13)]"
                        : "border-primary/10 hover:border-primary/20"
                    }`}
                  >
                    <motion.div
                      aria-hidden="true"
                      className={`absolute bottom-0 left-0 top-0 w-1.5 ${faq.accentClass}`}
                      animate={{
                        opacity: isOpen ? 1 : 0.35,
                        scaleY: isOpen ? 1 : 0.55,
                      }}
                      transition={{
                        duration: 0.3,
                      }}
                    />

                    <motion.div
                      aria-hidden="true"
                      className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
                      animate={{
                        scale: isOpen ? 1.3 : 1,
                        opacity: isOpen ? 0.7 : 0.3,
                      }}
                      transition={{
                        duration: 0.5,
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => {
                        toggleQuestion(index);
                      }}
                      aria-expanded={isOpen}
                      aria-controls={contentId}
                      className="relative flex w-full items-center gap-4 px-5 py-5 text-left sm:px-6 sm:py-6"
                    >
                      <motion.span
                        animate={{
                          rotate: isOpen ? [0, -5, 5, 0] : 0,
                          scale: isOpen ? 1.08 : 1,
                        }}
                        transition={{
                          duration: 0.45,
                        }}
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${faq.iconClass}`}
                      >
                        <Icon className="h-6 w-6" />
                      </motion.span>

                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-bold uppercase tracking-[0.17em] text-primary">
                          {faq.category}
                        </span>

                        <span className="mt-1.5 block font-heading text-base font-bold leading-6 text-navy sm:text-lg">
                          {faq.question}
                        </span>
                      </span>

                      <motion.span
                        animate={{
                          rotate: isOpen ? 180 : 0,
                          scale: isOpen ? 1.08 : 1,
                        }}
                        transition={{
                          duration: 0.35,
                        }}
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-300 ${
                          isOpen
                            ? "bg-primary text-white shadow-[0_12px_30px_rgba(30,111,217,0.28)]"
                            : "bg-primary-light text-primary"
                        }`}
                      >
                        <ChevronDown className="h-5 w-5" />
                      </motion.span>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          id={contentId}
                          initial={{
                            height: 0,
                            opacity: 0,
                          }}
                          animate={{
                            height: "auto",
                            opacity: 1,
                          }}
                          exit={{
                            height: 0,
                            opacity: 0,
                          }}
                          transition={{
                            height: {
                              duration: 0.42,
                              ease: [0.22, 1, 0.36, 1],
                            },
                            opacity: {
                              duration: 0.25,
                            },
                          }}
                          className="overflow-hidden"
                        >
                          <motion.div
                            initial={{
                              y: -12,
                            }}
                            animate={{
                              y: 0,
                            }}
                            exit={{
                              y: -8,
                            }}
                            className="relative px-5 pb-6 pl-5 sm:px-6 sm:pb-7 sm:pl-[6.5rem]"
                          >
                            <div className="border-t border-primary/10 pt-5">
                              <p className="text-sm leading-7 text-slate-600 sm:text-base">
                                {faq.answer}
                              </p>

                              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                                <CheckCircle2 className="h-4 w-4" />
                                Clear and simple
                              </div>
                            </div>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.article>
                );
              })}
            </motion.div>

            {/* Support card */}
            <motion.aside
              initial={{
                opacity: 0,
                x: 60,
                scale: 0.94,
              }}
              whileInView={{
                opacity: 1,
                x: 0,
                scale: 1,
              }}
              viewport={{
                once: true,
                amount: 0.2,
              }}
              transition={{
                duration: 0.9,
                delay: 0.15,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="lg:sticky lg:top-28"
            >
              <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-navy via-[#123b6f] to-primary-dark p-7 shadow-[0_30px_90px_rgba(11,37,69,0.28)] sm:p-8">
                <motion.div
                  aria-hidden="true"
                  className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-primary/45 blur-3xl"
                  animate={{
                    scale: [1, 1.3, 1],
                    x: [0, 35, 0],
                  }}
                  transition={{
                    duration: 7,
                    repeat: 0,
                    ease: "easeInOut",
                  }}
                />

                <motion.div
                  aria-hidden="true"
                  className="absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-cyan-400/25 blur-3xl"
                  animate={{
                    scale: [1.2, 1, 1.2],
                    y: [0, -35, 0],
                  }}
                  transition={{
                    duration: 8,
                    repeat: 0,
                    ease: "easeInOut",
                  }}
                />

                <motion.div
                  aria-hidden="true"
                  className="absolute -top-full left-1/4 h-[38rem] w-24 rotate-[24deg] bg-gradient-to-b from-transparent via-white/10 to-transparent blur-xl"
                  animate={{
                    x: [-220, 650],
                  }}
                  transition={{
                    duration: 5,
                    repeat: 0,
                    repeatDelay: 2,
                    ease: "easeInOut",
                  }}
                />

                <div className="relative">
                  {/* Support visual */}
                  <div className="relative mx-auto flex h-52 w-52 items-center justify-center">
                    <motion.div
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full border border-dashed border-blue-200/25"
                      animate={{
                        rotate: 360,
                      }}
                      transition={{
                        duration: 22,
                        repeat: 0,
                        ease: "linear",
                      }}
                    />

                    <motion.div
                      aria-hidden="true"
                      className="absolute inset-5 rounded-full border border-dashed border-cyan-200/20"
                      animate={{
                        rotate: -360,
                      }}
                      transition={{
                        duration: 17,
                        repeat: 0,
                        ease: "linear",
                      }}
                    />

                    <motion.div
                      aria-hidden="true"
                      className="absolute h-36 w-36 rounded-full bg-primary/35 blur-2xl"
                      animate={{
                        scale: [0.9, 1.25, 0.9],
                        opacity: [0.45, 0.8, 0.45],
                      }}
                      transition={{
                        duration: 4,
                        repeat: 0,
                        ease: "easeInOut",
                      }}
                    />

                    <motion.div
                      animate={{
                        y: [0, -9, 0],
                        rotate: [0, 3, -3, 0],
                      }}
                      transition={{
                        duration: 3.8,
                        repeat: 0,
                        ease: "easeInOut",
                      }}
                      className="relative flex h-28 w-28 items-center justify-center rounded-[2rem] bg-white text-primary shadow-[0_25px_65px_rgba(0,0,0,0.25)]"
                    >
                      <Headphones className="h-14 w-14" />

                      <motion.span
                        className="absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg"
                        animate={{
                          scale: [1, 1.2, 1],
                        }}
                        transition={{
                          duration: 2,
                          repeat: 0,
                        }}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </motion.span>
                    </motion.div>

                    <motion.span
                      aria-hidden="true"
                      className="absolute left-2 top-7"
                      animate={{
                        y: [0, -10, 0],
                        rotate: [0, 15, 0],
                      }}
                      transition={{
                        duration: 3.5,
                        repeat: 0,
                        ease: "easeInOut",
                      }}
                    >
                      <Sparkles className="h-7 w-7 text-cyan-300" />
                    </motion.span>

                    <motion.span
                      aria-hidden="true"
                      className="absolute bottom-7 right-1 h-3 w-3 rounded-full bg-blue-200 shadow-[0_0_15px_rgba(191,219,254,0.9)]"
                      animate={{
                        scale: [0.7, 1.4, 0.7],
                        opacity: [0.3, 1, 0.3],
                      }}
                      transition={{
                        duration: 2.4,
                        repeat: 0,
                      }}
                    />
                  </div>

                  <p className="mt-4 text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">
                    Still need help?
                  </p>

                  <h3 className="mt-3 font-heading text-3xl font-extrabold leading-tight text-white">
                    Our support section is here for you.
                  </h3>

                  <p className="mt-4 leading-7 text-blue-100/75">
                    Contact CleanNest for help with your account, booking, payment, or service
                    questions.
                  </p>

                  <div className="mt-7 space-y-3">
                    {supportBenefits.map((benefit, index) => (
                      <motion.div
                        key={benefit}
                        initial={{
                          opacity: 0,
                          x: 20,
                        }}
                        whileInView={{
                          opacity: 1,
                          x: 0,
                        }}
                        viewport={{
                          once: true,
                        }}
                        transition={{
                          delay: 0.4 + index * 0.12,
                        }}
                        whileHover={{
                          x: 5,
                        }}
                        className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.08] px-3 py-3 backdrop-blur-md"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-400/15 text-emerald-300">
                          <CheckCircle2 className="h-4 w-4" />
                        </span>

                        <span className="text-sm font-semibold text-blue-50">{benefit}</span>
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                    <motion.div
                      whileHover={{
                        y: -4,
                        scale: 1.02,
                      }}
                      whileTap={{
                        scale: 0.97,
                      }}
                    >
                      <Link
                        href="#contact"
                        className="group flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 font-bold text-primary shadow-[0_16px_40px_rgba(0,0,0,0.22)]"
                      >
                        Contact Us
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </Link>
                    </motion.div>

                    <motion.div
                      whileHover={{
                        y: -4,
                        scale: 1.02,
                      }}
                      whileTap={{
                        scale: 0.97,
                      }}
                    >
                      <Link
                        href="mailto:cleannest.project@gmail.com"
                        className="flex min-h-[52px] items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 py-3.5 font-semibold text-white transition-colors hover:bg-white/15"
                      >
                        <Mail className="h-4 w-4" />
                        Send Email
                      </Link>
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Response indicator */}
              <motion.div
                initial={{
                  opacity: 0,
                  y: 20,
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                }}
                viewport={{
                  once: true,
                }}
                transition={{
                  delay: 0.5,
                }}
                className="mx-4 flex items-center gap-3 rounded-b-2xl border border-t-0 border-primary/10 bg-white/90 px-4 py-3 shadow-card backdrop-blur-md"
              >
                <motion.span
                  className="h-2.5 w-2.5 rounded-full bg-emerald-500"
                  animate={{
                    scale: [1, 1.35, 1],
                    opacity: [0.6, 1, 0.6],
                  }}
                  transition={{
                    duration: 1.8,
                    repeat: 0,
                  }}
                />

                <span className="text-xs font-semibold text-slate-600">
                  Support available through the contact form
                </span>
              </motion.div>
            </motion.aside>
          </div>

          {/* Bottom trust strip */}
          <motion.div
            initial={{
              opacity: 0,
              y: 45,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
              amount: 0.3,
            }}
            transition={{
              duration: 0.85,
            }}
            className="relative mt-16 overflow-hidden rounded-[2rem] border border-primary/10 bg-white/80 px-6 py-7 shadow-[0_18px_55px_rgba(11,37,69,0.09)] backdrop-blur-md sm:px-9"
          >
            <motion.div
              aria-hidden="true"
              className="bg-primary/12 absolute -left-16 -top-20 h-52 w-52 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: 6,
                repeat: 0,
                ease: "easeInOut",
              }}
            />

            <div className="relative flex flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
              <div className="flex items-center gap-4">
                <motion.span
                  animate={{
                    rotate: [0, 6, -6, 0],
                    scale: [1, 1.08, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: 0,
                  }}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-light text-primary"
                >
                  <ShieldCheck className="h-6 w-6" />
                </motion.span>

                <div>
                  <h3 className="font-heading text-lg font-bold text-navy">
                    Book with clarity and confidence.
                  </h3>

                  <p className="mt-1 text-sm text-slate-600">
                    Review every service, schedule, and price before confirming.
                  </p>
                </div>
              </div>

              <motion.div
                whileHover={{
                  y: -4,
                  scale: 1.02,
                }}
                whileTap={{
                  scale: 0.97,
                }}
              >
                <Link
                  href="/book-service"
                  className="group inline-flex min-h-[50px] items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-white shadow-[0_15px_35px_rgba(30,111,217,0.26)] transition-colors hover:bg-primary-dark"
                >
                  Start Booking
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </MotionConfig>
  );
}
