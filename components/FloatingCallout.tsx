import React, { useRef, ReactNode } from 'react';
import {
  useFloating,
  offset as floatingOffset,
  flip,
  shift,
  arrow,
  FloatingArrow,
  Placement,
} from '@floating-ui/react';

export type FloatingPlacement = Placement;

interface FloatingCalloutProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  reference: ReactNode;
  children: ReactNode;
  placement?: FloatingPlacement;
  offset?: number;
  alignArrow?: number;
  className?: string;
}

export const FloatingCallout = ({
  open,
  onOpenChange,
  reference,
  children,
  placement = 'bottom-start',
  offset: offsetDistance = 8,
  alignArrow = 0,
  className = '',
}: FloatingCalloutProps) => {
  const arrowRef = useRef<HTMLDivElement>(null);

  const { refs, floatingStyles, middlewareData } = useFloating({
    placement,
    open,
    onOpenChange,
    middleware: [
      floatingOffset(offsetDistance),
      flip(),
      shift({ padding: 8 }),
      arrow({ element: arrowRef }),
    ],
  });

  const { x: arrowX, y: arrowY } = middlewareData.arrow || {};

  const arrowStyle: React.CSSProperties = {};
  if (arrowX !== undefined) {
    arrowStyle.left = `${arrowX + alignArrow}px`;
  }
  if (arrowY !== undefined) {
    arrowStyle.top = `${arrowY + alignArrow}px`;
  }

  return (
    <div className="relative inline-block">
      {/* Reference element */}
      <div ref={refs.setReference} className="inline-block">
        {reference}
      </div>

      {/* Floating callout */}
      {open && (
        <div
          ref={refs.setFloating}
          style={floatingStyles}
          className={`
            relative
            rounded-lg
            border border-slate-200
            bg-white
            text-slate-900
            shadow-md
            p-3
            max-w-xs
            z-50
            dark:bg-slate-900
            dark:text-slate-50
            dark:border-slate-800
            ${className}
          `}
        >
          {/* Arrow */}
          <div
            ref={arrowRef}
            style={arrowStyle}
            className={`
              absolute
              w-2
              h-2
              rotate-45
              rounded-[1px]
              bg-white
              border-l border-t
              border-slate-200
              dark:bg-slate-900
              dark:border-slate-800
            `}
          />

          {/* Content */}
          <div className="relative">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};
