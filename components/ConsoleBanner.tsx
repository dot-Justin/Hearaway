"use client";

import { useEffect } from "react";
import { displayConsoleBanner } from "@/utils/consoleBanner";

/**
 * Component that displays console banner on mount
 */
export function ConsoleBanner() {
  useEffect(() => {
    displayConsoleBanner();
  }, []);

  return null;
}
