/**
 * Reusable Framer Motion animation variants for Hearaway
 *
 * Usage:
 * import { blurIn, blurOut } from '@/lib/animations';
 *
 * <motion.div
 *   initial="hidden"
 *   animate="visible"
 *   exit="exit"
 *   variants={blurIn}
 * />
 */

import { Variants, Easing } from "framer-motion";

/**
 * Default easing curve for Hearaway animations
 * Cubic bezier: ease-in-out with slight emphasis on deceleration
 */
export const defaultEasing: Easing = [0.4, 0, 0.2, 1];

/**
 * Default transition duration (in seconds)
 */
export const defaultDuration = 0.8;

/**
 * Blur In Animation
 * Element starts blurred and fades in while deblurring
 *
 * States:
 * - hidden: Invisible, blurred (20px)
 * - visible: Fully visible, sharp (0px blur)
 * - exit: Same as hidden for reverse animation
 *
 * @example
 * <motion.div variants={blurIn} initial="hidden" animate="visible" exit="exit">
 *   Content fades in with deblur
 * </motion.div>
 *
 * Pass a delay via the `custom` prop to stagger elements:
 * <motion.div variants={blurIn} custom={0.5} initial="hidden" animate="visible" />
 */
export const blurIn: Variants = {
  hidden: {
    opacity: 0,
    filter: "blur(20px)",
  },
  visible: (delay: number = 0) => ({
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      duration: defaultDuration,
      ease: defaultEasing,
      delay,
    },
  }),
  exit: {
    opacity: 0,
    filter: "blur(20px)",
    transition: {
      duration: defaultDuration,
      ease: defaultEasing,
    },
  },
};

/**
 * Blur Out Animation
 * Element starts sharp and fades out while blurring
 *
 * States:
 * - hidden: Fully visible, sharp (0px blur)
 * - visible: Same as hidden (maintains state)
 * - exit: Invisible, blurred (20px)
 *
 * @example
 * <motion.div variants={blurOut} initial="hidden" exit="exit">
 *   Content fades out with blur
 * </motion.div>
 */
export const blurOut: Variants = {
  hidden: {
    opacity: 1,
    filter: "blur(0px)",
  },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
  },
  exit: {
    opacity: 0,
    filter: "blur(20px)",
    transition: {
      duration: defaultDuration,
      ease: defaultEasing,
    },
  },
};

/**
 * Fast Blur In Animation
 * Shorter duration for quick transitions (0.3s)
 *
 * @example
 * <motion.div variants={blurInFast} initial="hidden" animate="visible">
 *   Quick fade in with deblur
 * </motion.div>
 */
export const blurInFast: Variants = {
  hidden: {
    opacity: 0,
    filter: "blur(10px)",
  },
  visible: (delay: number = 0) => ({
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.6,
      ease: defaultEasing,
      delay,
    },
  }),
  exit: {
    opacity: 0,
    filter: "blur(10px)",
    transition: {
      duration: 0.6,
      ease: defaultEasing,
    },
  },
};

/**
 * Fast Blur Out Animation
 * Shorter duration for quick transitions (0.3s)
 *
 * @example
 * <motion.div variants={blurOutFast} exit="exit">
 *   Quick fade out with blur
 * </motion.div>
 */
export const blurOutFast: Variants = {
  hidden: {
    opacity: 1,
    filter: "blur(0px)",
  },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
  },
  exit: {
    opacity: 0,
    filter: "blur(10px)",
    transition: {
      duration: 0.3,
      ease: defaultEasing,
    },
  },
};

/**
 * Quick Blur In/Out Animation
 * Shorter duration for quick transitions (0.3s in, 0.2s out)
 */
export const blurInOutQuick: Variants = {
  hidden: {
    opacity: 0,
    filter: "blur(10px)",
  },
  visible: (delay: number = 0) => ({
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.5,
      ease: defaultEasing,
      delay,
    },
  }),
  exit: {
    opacity: 0,
    filter: "blur(10px)",
    transition: {
      duration: 0.3,
      ease: defaultEasing,
    },
  },
};

/**
 * Subtle Blur In Animation
 * Lighter blur effect (5px) for delicate transitions
 *
 * @example
 * <motion.div variants={blurInSubtle} initial="hidden" animate="visible">
 *   Subtle fade in with light blur
 * </motion.div>
 */
export const blurInSubtle: Variants = {
  hidden: {
    opacity: 0,
    filter: "blur(5px)",
  },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.5,
      ease: defaultEasing,
    },
  },
  exit: {
    opacity: 0,
    filter: "blur(5px)",
    transition: {
      duration: 0.5,
      ease: defaultEasing,
    },
  },
};

/**
 * Background Image Crossfade Variants
 * Single-layer fade: old image on top fades out to reveal new image underneath
 *
 * Exit: ease-in (slow start → fast end) 1.3s with blur
 * New image loads underneath with no animation (better performance)
 *
 * @example
 * // Old background fades out on top
 * <motion.div variants={backgroundCrossfade} initial="visible" exit="exit">
 *   Old background blurs out
 * </motion.div>
 *
 * // New background underneath (no animation needed)
 * <div style={{zIndex: 0}}>New background</div>
 */
export const backgroundCrossfade: Variants = {
  visible: {
    opacity: 1,
    filter: "blur(0px)",
  },
  exit: {
    opacity: 0,
    filter: "blur(20px)",
    transition: {
      duration: 2,
      ease: [0.62, 0, 0.76, 0.86],
    },
  },
};

/**
 * Custom blur animation creator
 * Create custom blur animations with specific parameters
 *
 * @param blurAmount - Blur radius in pixels (default: 20)
 * @param duration - Animation duration in seconds (default: 0.8)
 * @param direction - 'in' for fade in with deblur, 'out' for fade out with blur
 * @returns Framer Motion variants object
 *
 * @example
 * const customBlur = createBlurAnimation(15, 0.6, 'in');
 * <motion.div variants={customBlur} initial="hidden" animate="visible" />
 */
export function createBlurAnimation(
  blurAmount: number = 20,
  duration: number = defaultDuration,
  direction: "in" | "out" = "in",
): Variants {
  if (direction === "in") {
    return {
      hidden: {
        opacity: 0,
        filter: `blur(${blurAmount}px)`,
      },
      visible: {
        opacity: 1,
        filter: "blur(0px)",
        transition: {
          duration,
          ease: defaultEasing,
        },
      },
      exit: {
        opacity: 0,
        filter: `blur(${blurAmount}px)`,
        transition: {
          duration,
          ease: defaultEasing,
        },
      },
    };
  } else {
    return {
      hidden: {
        opacity: 1,
        filter: "blur(0px)",
      },
      visible: {
        opacity: 1,
        filter: "blur(0px)",
      },
      exit: {
        opacity: 0,
        filter: `blur(${blurAmount}px)`,
        transition: {
          duration,
          ease: defaultEasing,
        },
      },
    };
  }
}

/**
 * Simple Fade In/Out Animation
 * For quick, non-jarring transitions without blur.
 */
export const simpleFade: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: (delay: number = 0) => ({
    opacity: 1,
    transition: {
      duration: 0.2,
      ease: defaultEasing,
      delay,
    },
  }),
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: defaultEasing,
    },
  },
};
