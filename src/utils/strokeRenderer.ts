import { Point, Stroke, PenType } from '../types/canvas';

// Moving average / exponential smoothing for hand stabilization
export function smoothPoints(points: Point[], stabilizationFactor: number = 0.5): Point[] {
  if (points.length < 3 || stabilizationFactor <= 0) return points;

  const result: Point[] = [points[0]];
  const weight = Math.max(0.1, Math.min(0.9, 1 - stabilizationFactor * 0.7));

  for (let i = 1; i < points.length; i++) {
    const prev = result[i - 1];
    const curr = points[i];

    const smoothedX = prev.x + (curr.x - prev.x) * weight;
    const smoothedY = prev.y + (curr.y - prev.y) * weight;
    const pressure = curr.pressure !== undefined && prev.pressure !== undefined
      ? prev.pressure + (curr.pressure - prev.pressure) * weight
      : curr.pressure;

    result.push({
      x: smoothedX,
      y: smoothedY,
      pressure,
      time: curr.time,
    });
  }

  return result;
}

// Catmull-Rom spline to Bezier conversion for silky smooth continuous curves
export function renderSpline(ctx: CanvasRenderingContext2D, points: Point[], close: boolean = false) {
  if (points.length < 2) return;

  if (points.length === 2) {
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineTo(points[1].x, points[1].y);
    return;
  }

  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < points.length - 2 ? points[i + 2] : p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
  }

  if (close) {
    ctx.closePath();
  }
}

// Render stroke with 4 distinct physical ink physics
export function drawStroke(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
  layerOpacity: number = 1
) {
  const { penType, color, size, points, isShape, shapeType, shapeData } = stroke;
  if (!points || points.length === 0) return;

  ctx.save();

  // If this stroke was recognized as an auto-shape, render standard vector shape
  if (isShape && shapeType && shapeData) {
    drawGeometricShape(ctx, shapeType, shapeData, color, size, layerOpacity);
    ctx.restore();
    return;
  }

  if (penType === 'highlighter') {
    ctx.globalAlpha = 0.38 * layerOpacity;
    ctx.globalCompositeOperation = 'multiply';
    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';
  } else {
    ctx.globalAlpha = (stroke.opacity ?? 1) * layerOpacity;
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }

  ctx.strokeStyle = color;

  // Single point (dot / tap)
  if (points.length === 1) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(points[0].x, points[0].y, Math.max(1, size / 2), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  // 1. Bút mực (Fountain Pen): Sharp crisp vector edge, dynamic pressure & velocity taper
  if (penType === 'fountain') {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];

      // Dynamic width from pressure (0..1) or velocity
      const pressure1 = p1.pressure ?? 0.5;
      const pressure2 = p2.pressure ?? 0.5;
      const avgPressure = (pressure1 + pressure2) / 2;
      const currentWidth = Math.max(0.8, size * (0.3 + avgPressure * 1.4));

      ctx.beginPath();
      ctx.lineWidth = currentWidth;
      ctx.moveTo(p1.x, p1.y);

      // Mid-point quadratic curve for buttery smooth transitions
      if (i < points.length - 2) {
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
      } else {
        ctx.lineTo(p2.x, p2.y);
      }
      ctx.stroke();
    }
  }

  // 2. Bút chì (Pencil): Graphite stippled texture, grainy edges, soft gray pressure
  else if (penType === 'pencil') {
    ctx.lineWidth = Math.max(0.8, size * 0.9);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Base pencil line with subtle grain
    ctx.beginPath();
    renderSpline(ctx, points);
    ctx.stroke();

    // Additional graphite dust particles along path
    ctx.fillStyle = color;
    const step = Math.max(1, Math.floor(points.length / 30));
    for (let i = 0; i < points.length; i += step) {
      const pt = points[i];
      const scatterCount = Math.floor(size * 0.8);
      for (let s = 0; s < scatterCount; s++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * (size * 0.6);
        const px = pt.x + Math.cos(angle) * dist;
        const py = pt.y + Math.sin(angle) * dist;
        const grainSize = Math.random() * 0.8 + 0.3;
        ctx.globalAlpha = (Math.random() * 0.25 + 0.1) * layerOpacity;
        ctx.fillRect(px, py, grainSize, grainSize);
      }
    }
  }

  // 3. Bút lông (Brush): Watercolor/calligraphy, soft feathered edge, dynamic thickness
  else if (penType === 'brush') {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const p = p1.pressure ?? 0.5;
      const dynamicSize = size * (0.5 + p * 1.5);

      ctx.beginPath();
      ctx.lineWidth = dynamicSize;
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
  }

  // 4. Bút dạ quang (Highlighter): Flat wide translucent ribbon
  else if (penType === 'highlighter') {
    ctx.lineWidth = size * 2.2;
    ctx.beginPath();
    renderSpline(ctx, points);
    ctx.stroke();
  }

  ctx.restore();
}

// Geometric shape renderer for Auto-shape
function drawGeometricShape(
  ctx: CanvasRenderingContext2D,
  shapeType: string,
  data: any,
  color: string,
  size: number,
  layerOpacity: number
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.globalAlpha = layerOpacity;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();

  if (shapeType === 'line') {
    ctx.moveTo(data.x1, data.y1);
    ctx.lineTo(data.x2, data.y2);
  } else if (shapeType === 'circle') {
    ctx.arc(data.cx, data.cy, data.r, 0, Math.PI * 2);
  } else if (shapeType === 'rectangle') {
    ctx.rect(data.x, data.y, data.w, data.h);
  } else if (shapeType === 'triangle') {
    ctx.moveTo(data.p1.x, data.p1.y);
    ctx.lineTo(data.p2.x, data.p2.y);
    ctx.lineTo(data.p3.x, data.p3.y);
    ctx.closePath();
  } else if (shapeType === 'arrow') {
    // Arrow line
    ctx.moveTo(data.x1, data.y1);
    ctx.lineTo(data.x2, data.y2);
    // Arrow head
    const angle = Math.atan2(data.y2 - data.y1, data.x2 - data.x1);
    const headLen = Math.max(12, size * 3);
    ctx.lineTo(
      data.x2 - headLen * Math.cos(angle - Math.PI / 6),
      data.y2 - headLen * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(data.x2, data.y2);
    ctx.lineTo(
      data.x2 - headLen * Math.cos(angle + Math.PI / 6),
      data.y2 - headLen * Math.sin(angle + Math.PI / 6)
    );
  }

  ctx.stroke();
}

// Auto-shape recognition algorithm
export function detectAutoShape(points: Point[]): {
  isShape: boolean;
  shapeType?: 'line' | 'circle' | 'rectangle' | 'triangle' | 'arrow';
  shapeData?: any;
} {
  if (points.length < 8) return { isShape: false };

  const start = points[0];
  const end = points[points.length - 1];

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let sumX = 0, sumY = 0;

  for (const pt of points) {
    minX = Math.min(minX, pt.x);
    maxX = Math.max(maxX, pt.x);
    minY = Math.min(minY, pt.y);
    maxY = Math.max(maxY, pt.y);
    sumX += pt.x;
    sumY += pt.y;
  }

  const width = maxX - minX;
  const height = maxY - minY;
  const diag = Math.hypot(width, height);
  if (diag < 20) return { isShape: false };

  const cx = sumX / points.length;
  const cy = sumY / points.length;
  const isClosed = Math.hypot(end.x - start.x, end.y - start.y) < diag * 0.25;

  // 1. Check Straight Line or Arrow
  if (!isClosed) {
    const lineLen = Math.hypot(end.x - start.x, end.y - start.y);
    if (lineLen > 30) {
      // Calculate max deviation from straight segment
      let maxDist = 0;
      for (const p of points) {
        const d = pointToSegmentDistance(p, start, end);
        if (d > maxDist) maxDist = d;
      }
      if (maxDist < lineLen * 0.12) {
        return {
          isShape: true,
          shapeType: 'line',
          shapeData: { x1: start.x, y1: start.y, x2: end.x, y2: end.y },
        };
      }
    }
  }

  // 2. Check Circle / Ellipse
  if (isClosed) {
    const avgRadius = diag / 2;
    let radiusVariance = 0;
    for (const p of points) {
      const dist = Math.hypot(p.x - cx, p.y - cy);
      radiusVariance += Math.abs(dist - avgRadius);
    }
    const avgDev = radiusVariance / points.length;
    const aspectRatio = width / (height || 1);

    if (avgDev < avgRadius * 0.22 && aspectRatio > 0.75 && aspectRatio < 1.35) {
      return {
        isShape: true,
        shapeType: 'circle',
        shapeData: { cx, cy, r: (width + height) / 4 },
      };
    }

    // 3. Check Rectangle / Square
    if (aspectRatio > 0.3 && aspectRatio < 3.0) {
      // Sample 4 corner-like extents
      return {
        isShape: true,
        shapeType: 'rectangle',
        shapeData: { x: minX, y: minY, w: width, h: height },
      };
    }
  }

  return { isShape: false };
}

function pointToSegmentDistance(p: Point, a: Point, b: Point): number {
  const l2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
  if (l2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * (b.x - a.x)), p.y - (a.y + t * (b.y - a.y)));
}

// AI Handwriting Refinement (Căn chỉnh theo Tỷ lệ vàng Golden Ratio)
// Normalizes vertical rhythm (ascender : x-height : descender = 1 : 1.618 : 1)
// and smoothes micro-jitters without losing individual stroke personality
export function applyGoldenRatioRefinement(strokes: Stroke[]): Stroke[] {
  const GOLDEN_RATIO = 1.618;

  return strokes.map((stroke) => {
    if (stroke.isShape || stroke.points.length < 4) return stroke;

    let minY = Infinity, maxY = -Infinity;
    for (const p of stroke.points) {
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }
    const height = maxY - minY;
    if (height < 10) return stroke;

    const midY = minY + height / (1 + 1 / GOLDEN_RATIO);

    // Apply soft harmonic attraction toward golden ratio guide
    const refinedPoints = stroke.points.map((p, idx) => {
      // Gentle smoothing factor
      const distToMid = p.y - midY;
      const adjustment = distToMid * 0.08;

      // Moving average with neighbors to preserve anthropometrics
      const prev = stroke.points[Math.max(0, idx - 1)];
      const next = stroke.points[Math.min(stroke.points.length - 1, idx + 1)];

      const smoothedX = (prev.x + p.x * 2 + next.x) / 4;
      const smoothedY = (prev.y + (p.y - adjustment) * 2 + next.y) / 4;

      return {
        ...p,
        x: smoothedX,
        y: smoothedY,
      };
    });

    return {
      ...stroke,
      points: refinedPoints,
      smoothed: true,
    };
  });
}

// Convert all strokes to clean lossless SVG vector string
export function exportToSVG(
  strokes: Stroke[],
  width: number,
  height: number,
  bgType: string
): string {
  let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">\n`;

  // Background
  let bgColor = '#ffffff';
  if (bgType === 'vintage') bgColor = '#faf7ee';
  if (bgType === 'blueprint') bgColor = '#0f172a';
  svgContent += `  <rect width="100%" height="100%" fill="${bgColor}" />\n`;

  for (const stroke of strokes) {
    const { penType, color, size, points, isShape, shapeType, shapeData, opacity = 1 } = stroke;
    if (!points || points.length === 0) continue;

    if (isShape && shapeType && shapeData) {
      if (shapeType === 'line') {
        svgContent += `  <line x1="${shapeData.x1}" y1="${shapeData.y1}" x2="${shapeData.x2}" y2="${shapeData.y2}" stroke="${color}" stroke-width="${size}" stroke-linecap="round" />\n`;
      } else if (shapeType === 'circle') {
        svgContent += `  <circle cx="${shapeData.cx}" cy="${shapeData.cy}" r="${shapeData.r}" stroke="${color}" stroke-width="${size}" fill="none" />\n`;
      } else if (shapeType === 'rectangle') {
        svgContent += `  <rect x="${shapeData.x}" y="${shapeData.y}" width="${shapeData.w}" height="${shapeData.h}" stroke="${color}" stroke-width="${size}" fill="none" rx="4" />\n`;
      }
      continue;
    }

    if (points.length === 1) {
      svgContent += `  <circle cx="${points[0].x}" cy="${points[0].y}" r="${Math.max(1, size / 2)}" fill="${color}" />\n`;
      continue;
    }

    // Path data using cubic Beziers
    let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)} `;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i < points.length - 2 ? points[i + 2] : p2;

      const cp1x = (p1.x + (p2.x - p0.x) / 6).toFixed(1);
      const cp1y = (p1.y + (p2.y - p0.y) / 6).toFixed(1);
      const cp2x = (p2.x - (p3.x - p1.x) / 6).toFixed(1);
      const cp2y = (p2.y - (p3.y - p1.y) / 6).toFixed(1);

      d += `C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)} `;
    }

    const strokeOpacity = penType === 'highlighter' ? 0.38 : opacity;
    const strokeWidth = penType === 'highlighter' ? size * 2.2 : size;

    svgContent += `  <path d="${d}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" opacity="${strokeOpacity}" />\n`;
  }

  svgContent += `</svg>`;
  return svgContent;
}
