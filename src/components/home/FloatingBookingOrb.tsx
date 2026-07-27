"use client";

import Link from "next/link";
import { CalendarCheck2, Home, ShieldCheck, Sparkles, Star } from "lucide-react";
import { motion, MotionConfig } from "motion/react";

const orbitParticles = [
  {
    className: "-left-2 top-2",
    duration: 4,
    delay: 0,
    size: "h-3 w-3",
  },
  {
    className: "-right-1 top-4",
    duration: 4.8,
    delay: 0.5,
    size: "h-2.5 w-2.5",
  },
  {
    className: "bottom-1 left-1",
    duration: 4.4,
    delay: 1,
    size: "h-2 w-2",
  },
];

export default function FloatingBookingOrb() {
  return (
    <MotionConfig reducedMotion="always">
      <div className="pointer-events-none fixed bottom-7 right-7 z-[100] hidden lg:block">
        <motion.div
          initial={{
            opacity: 0,
            scale: 0.6,
            y: 30,
          }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
          }}
          transition={{
            delay: 1.5,
            duration: 0.7,
            type: "spring",
            stiffness: 150,
            damping: 16,
          }}
          className="group pointer-events-auto relative flex items-center justify-end"
        >
          {/* Hover label */}
          <motion.div
            initial={false}
            className="pointer-events-none absolute right-[calc(100%+12px)] hidden whitespace-nowrap sm:block"
          >
            <div className="translate-x-3 scale-95 rounded-2xl border border-primary/10 bg-white/95 px-4 py-3 opacity-0 shadow-[0_18px_50px_rgba(11,37,69,0.18)] backdrop-blur-md transition-all duration-300 group-hover:translate-x-0 group-hover:scale-100 group-hover:opacity-100">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-light text-primary">
                  <CalendarCheck2 className="h-5 w-5" />
                </span>

                <div>
                  <p className="font-heading text-sm font-bold text-navy">Book a Cleaning</p>

                  <p className="mt-0.5 text-xs text-slate-500">Schedule in minutes</p>
                </div>
              </div>

              <span className="absolute -right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 border-r border-t border-primary/10 bg-white" />
            </div>
          </motion.div>

          {/* Outer glow */}
          <motion.div
            aria-hidden="true"
            className="absolute inset-[-18px] rounded-full bg-primary/20 blur-2xl"
            animate={{
              opacity: [0.25, 0.65, 0.25],
              scale: [0.9, 1.2, 0.9],
            }}
            transition={{
              duration: 3.5,
              repeat: 0,
              ease: "easeInOut",
            }}
          />

          {/* Expanding pulse rings */}
          <motion.span
            aria-hidden="true"
            className="absolute inset-0 rounded-full border border-primary/35"
            animate={{
              opacity: [0.7, 0],
              scale: [1, 1.8],
            }}
            transition={{
              duration: 2.4,
              repeat: 0,
              ease: "easeOut",
            }}
          />

          <motion.span
            aria-hidden="true"
            className="absolute inset-0 rounded-full border border-cyan-400/30"
            animate={{
              opacity: [0.6, 0],
              scale: [1, 2.05],
            }}
            transition={{
              duration: 2.4,
              delay: 1.2,
              repeat: 0,
              ease: "easeOut",
            }}
          />

          {/* Rotating orbit */}
          <motion.div
            aria-hidden="true"
            className="absolute -inset-3 rounded-full border border-dashed border-primary/35"
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 13,
              repeat: 0,
              ease: "linear",
            }}
          >
            <span className="absolute left-1/2 top-[-5px] flex h-3 w-3 -translate-x-1/2 items-center justify-center rounded-full bg-cyan-400 shadow-[0_0_14px_rgba(34,211,238,0.9)]" />

            <span className="absolute bottom-[-4px] left-[18%] h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_12px_rgba(30,111,217,0.8)]" />
          </motion.div>

          {/* Floating particles */}
          {orbitParticles.map((particle, index) => (
            <motion.span
              key={particle.className}
              aria-hidden="true"
              className={`absolute rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)] ${particle.className} ${particle.size}`}
              animate={{
                x: [0, index % 2 === 0 ? 8 : -8, 0],
                y: [0, -12, 0],
                opacity: [0.25, 1, 0.25],
                scale: [0.7, 1.25, 0.7],
              }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                repeat: 0,
                ease: "easeInOut",
              }}
            />
          ))}

          {/* Main floating button */}
          <motion.div
            animate={{
              y: [0, -7, 0],
            }}
            transition={{
              duration: 3.2,
              repeat: 0,
              ease: "easeInOut",
            }}
          >
            <motion.div
              whileHover={{
                scale: 1.09,
                rotate: 3,
              }}
              whileTap={{
                scale: 0.93,
              }}
            >
              <Link
                href="/book"
                aria-label="Book a CleanNest cleaning service"
                className="relative flex h-[62px] w-[62px] items-center justify-center overflow-hidden rounded-full border border-white/40 bg-gradient-to-br from-primary via-blue-600 to-cyan-500 text-white shadow-[0_20px_55px_rgba(30,111,217,0.42)] sm:h-[72px] sm:w-[72px]"
              >
                {/* Button shine */}
                <motion.span
                  aria-hidden="true"
                  className="absolute inset-y-0 -left-1/2 w-1/3 skew-x-[-20deg] bg-white/30"
                  animate={{
                    left: ["-50%", "140%"],
                  }}
                  transition={{
                    duration: 2.2,
                    repeat: 0,
                    repeatDelay: 1.8,
                    ease: "easeInOut",
                  }}
                />

                {/* Inner ring */}
                <span className="absolute inset-[5px] rounded-full border border-white/25" />

                <motion.span
                  animate={{
                    rotate: [0, -5, 5, 0],
                    scale: [1, 1.08, 1],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: 0,
                    ease: "easeInOut",
                  }}
                  className="relative"
                >
                  <Home className="h-7 w-7 sm:h-8 sm:w-8" />
                </motion.span>

                {/* Small sparkle */}
                <motion.span
                  aria-hidden="true"
                  className="absolute right-2 top-2"
                  animate={{
                    rotate: 360,
                    scale: [0.8, 1.25, 0.8],
                  }}
                  transition={{
                    duration: 3,
                    repeat: 0,
                    ease: "linear",
                  }}
                >
                  <Sparkles className="h-3.5 w-3.5 text-cyan-100" />
                </motion.span>
              </Link>
            </motion.div>
          </motion.div>

          {/* Trust indicator */}
          <motion.div
            aria-hidden="true"
            className="absolute -bottom-1 -left-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-green-500 text-white shadow-md sm:h-7 sm:w-7"
            animate={{
              scale: [1, 1.15, 1],
            }}
            transition={{
              duration: 2,
              repeat: 0,
            }}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
          </motion.div>

          {/* Mobile sparkle */}
          <motion.div
            aria-hidden="true"
            className="absolute -right-1 -top-2 text-amber-400 sm:hidden"
            animate={{
              rotate: [0, 15, -15, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2.5,
              repeat: 0,
            }}
          >
            <Star className="h-4 w-4 fill-current" />
          </motion.div>
        </motion.div>
      </div>
    </MotionConfig>
  );
}
