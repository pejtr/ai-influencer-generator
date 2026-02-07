import { useRef, useEffect, useState, useMemo } from "react";

interface HeatmapPoint {
  x: number; // 0-1 normalized
  y: number; // 0-1 normalized
  intensity?: number;
}

interface HeatmapProps {
  points: HeatmapPoint[];
  width?: number;
  height?: number;
  radius?: number;
  maxOpacity?: number;
  blur?: number;
  gradient?: Record<number, string>;
  className?: string;
  showGrid?: boolean;
  selectedPage?: string;
}

const DEFAULT_GRADIENT: Record<number, string> = {
  0.0: "rgba(0, 0, 255, 0)",
  0.2: "rgba(0, 0, 255, 0.5)",
  0.4: "rgba(0, 255, 255, 0.7)",
  0.6: "rgba(0, 255, 0, 0.8)",
  0.8: "rgba(255, 255, 0, 0.9)",
  1.0: "rgba(255, 0, 0, 1)",
};

/**
 * Canvas-based heatmap visualization component.
 * Renders touch interaction data as a color-coded density map.
 */
export default function Heatmap({
  points,
  width = 375,
  height = 812,
  radius = 25,
  maxOpacity = 0.8,
  blur = 15,
  gradient = DEFAULT_GRADIENT,
  className = "",
  showGrid = false,
  selectedPage,
}: HeatmapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ w: width, h: height });

  // Create gradient image for coloring
  const gradientImage = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 1;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const grad = ctx.createLinearGradient(0, 0, 256, 0);
    for (const [stop, color] of Object.entries(gradient)) {
      grad.addColorStop(parseFloat(stop), color);
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 1);

    return ctx.getImageData(0, 0, 256, 1).data;
  }, [gradient]);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w } = entry.contentRect;
        // Maintain mobile aspect ratio (9:19.5 like iPhone)
        const h = Math.round(w * (19.5 / 9));
        setDimensions({ w: Math.round(w), h: Math.min(h, 900) });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Render heatmap
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gradientImage || points.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { w, h } = dimensions;
    canvas.width = w;
    canvas.height = h;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Draw phone frame background
    ctx.fillStyle = "rgba(15, 15, 20, 0.95)";
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 20);
    ctx.fill();

    // Draw status bar
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    ctx.fillRect(0, 0, w, 30);
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.font = "10px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("9:41", w / 2, 20);

    // Draw grid if enabled
    if (showGrid) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 0.5;
      const gridSize = w / 10;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    }

    // Draw page label
    if (selectedPage) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      ctx.font = "11px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(selectedPage, w / 2, 50);
    }

    // Create alpha map
    const alphaCanvas = document.createElement("canvas");
    alphaCanvas.width = w;
    alphaCanvas.height = h;
    const alphaCtx = alphaCanvas.getContext("2d");
    if (!alphaCtx) return;

    // Draw each point as a radial gradient
    for (const point of points) {
      const px = point.x * w;
      const py = point.y * h;
      const intensity = point.intensity ?? 1;

      const grad = alphaCtx.createRadialGradient(px, py, 0, px, py, radius);
      grad.addColorStop(0, `rgba(0, 0, 0, ${intensity * maxOpacity})`);
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");

      alphaCtx.fillStyle = grad;
      alphaCtx.fillRect(px - radius, py - radius, radius * 2, radius * 2);
    }

    // Apply blur
    if (blur > 0) {
      alphaCtx.filter = `blur(${blur}px)`;
      alphaCtx.drawImage(alphaCanvas, 0, 0);
      alphaCtx.filter = "none";
    }

    // Colorize the alpha map
    const alphaData = alphaCtx.getImageData(0, 0, w, h);
    const pixels = alphaData.data;

    for (let i = 0; i < pixels.length; i += 4) {
      const alpha = pixels[i + 3]; // Alpha channel
      if (alpha === 0) continue;

      const colorIndex = Math.min(255, Math.round((alpha / 255) * 255));
      const gradIdx = colorIndex * 4;

      pixels[i] = gradientImage[gradIdx];     // R
      pixels[i + 1] = gradientImage[gradIdx + 1]; // G
      pixels[i + 2] = gradientImage[gradIdx + 2]; // B
      pixels[i + 3] = Math.round(gradientImage[gradIdx + 3] * maxOpacity); // A
    }

    ctx.putImageData(alphaData, 0, 0);

    // Draw point count
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "10px system-ui";
    ctx.textAlign = "right";
    ctx.fillText(`${points.length} touches`, w - 10, h - 10);

  }, [points, dimensions, gradientImage, radius, maxOpacity, blur, showGrid, selectedPage]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full rounded-2xl shadow-lg border border-border/30"
        style={{ aspectRatio: "9 / 19.5", maxHeight: "600px" }}
      />
      {points.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
          No touch data available
        </div>
      )}
    </div>
  );
}
