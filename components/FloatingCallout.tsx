import React, { ReactNode } from "react";
import {
  useFloating,
  offset as floatingOffset,
  flip,
  shift,
  Placement,
} from "@floating-ui/react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { blurInFast, blurOutFast } from "@/lib/animations";

const floatingCalloutVariants: Variants = {
  hidden: blurInFast.hidden,
  visible: blurInFast.visible,
  exit: blurOutFast.exit,
};

export type FloatingPlacement = Placement;

interface FloatingCalloutProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  reference: ReactNode;
  children: ReactNode;
  placement?: FloatingPlacement;
  offset?: number;
  className?: string;
}

export const FloatingCallout = ({
  open,
  onOpenChange,
  reference,
  children,
  placement = "bottom-start",
  offset: offsetDistance = 12,
  className = "",
}: FloatingCalloutProps) => {
  const { refs, floatingStyles } = useFloating({
    placement,
    open,
    onOpenChange,
    middleware: [floatingOffset(offsetDistance), flip(), shift({ padding: 8 })],
  });

  return (
    <div className="relative inline-block">
      {/* Reference element */}
      <div ref={refs.setReference} className="inline-block">
        {reference}
      </div>

      {/* Floating callout */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={refs.setFloating}
            style={floatingStyles}
            variants={floatingCalloutVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`
              relative
              max-w-sm
              min-w-[18rem]
              rounded-2xl
              border border-accent-secondary/35
              bg-surface/95
              text-text-primary
              px-4 py-3
              backdrop-blur-md
              transition-colors
              z-50
              dark:bg-dark-surface/95
              dark:text-dark-text-primary
              dark:border-dark-accent-secondary/40
              ${className}
            `}
          >
            {/* Content */}
            <div className="relative">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
