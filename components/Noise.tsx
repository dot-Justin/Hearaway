// Adapted from ReactBits Noise component
// Source: https://reactbits.dev/animations/noise

import { useRef, useEffect } from "react";
import "./Noise.css";

interface NoiseProps {
  className?: string;
  patternSize?: number;
  patternScaleX?: number;
  patternScaleY?: number;
  patternRefreshInterval?: number;
  patternAlpha?: number;
}

const Noise = ({
  className,
  patternSize = 250,
  patternScaleX = 1,
  patternScaleY = 1,
  patternRefreshInterval = 3,
  patternAlpha = 13,
}: NoiseProps) => {
  const grainRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = grainRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let frame = 0;
    let animationId: number;
    let canvasSize = 384;

    const getCanvasSize = () => {
      const width = window.innerWidth;
      if (width < 640) return 200; // mobile
      if (width < 1024) return 300; // tablet
      return 384; // desktop
    };

    const resize = () => {
      if (!canvas) return;
      canvasSize = getCanvasSize();
      canvas.width = canvasSize;
      canvas.height = canvasSize;

      canvas.style.width = "100vw";
      canvas.style.height = "100vh";
    };

    const drawGrain = () => {
      const imageData = ctx.createImageData(canvasSize, canvasSize);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const value = Math.random() * 255;
        data[i] = value;
        data[i + 1] = value;
        data[i + 2] = value;
        data[i + 3] = patternAlpha;
      }

      ctx.putImageData(imageData, 0, 0);
    };

    const loop = () => {
      if (frame % patternRefreshInterval === 0) {
        drawGrain();
      }
      frame++;
      animationId = window.requestAnimationFrame(loop);
    };

    window.addEventListener("resize", resize);
    resize();
    loop();

    return () => {
      window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(animationId);
    };
  }, [
    patternSize,
    patternScaleX,
    patternScaleY,
    patternRefreshInterval,
    patternAlpha,
  ]);

  return (
    <canvas
      className={className}
      ref={grainRef}
      style={{ imageRendering: "pixelated" }}
    />
  );
};

export default Noise;
