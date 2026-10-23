/**
 * Math Grapher: Cartesian Oxy Coordinate Plane & 2D Function Plotter
 * Inspired by d3-visualization & algorithmic-art in SKILL EDUCATION
 */

export interface OxyConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  xMin?: number;
  xMax?: number;
  yMin?: number;
  yMax?: number;
  step?: number;
  showGrid?: boolean;
}

export function drawOxyPlane(ctx: CanvasRenderingContext2D, config: OxyConfig) {
  const {
    x,
    y,
    width,
    height,
    xMin = -6,
    xMax = 6,
    yMin = -4,
    yMax = 4,
    step = 1,
    showGrid = true,
  } = config;

  ctx.save();
  ctx.translate(x, y);

  // Background card for visibility
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, width, height);

  const xRange = xMax - xMin;
  const yRange = yMax - yMin;

  const toScreenX = (val: number) => ((val - xMin) / xRange) * width;
  const toScreenY = (val: number) => height - ((val - yMin) / yRange) * height;

  const originX = toScreenX(0);
  const originY = toScreenY(0);

  // 1. Grid lines
  if (showGrid) {
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 0.8;
    ctx.beginPath();

    for (let gx = Math.ceil(xMin); gx <= Math.floor(xMax); gx += step) {
      const sx = toScreenX(gx);
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, height);
    }

    for (let gy = Math.ceil(yMin); gy <= Math.floor(yMax); gy += step) {
      const sy = toScreenY(gy);
      ctx.moveTo(0, sy);
      ctx.lineTo(width, sy);
    }
    ctx.stroke();
  }

  // 2. Axes (Ox and Oy)
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.8;
  ctx.beginPath();

  // Ox
  ctx.moveTo(0, originY);
  ctx.lineTo(width, originY);
  // Ox Arrow
  ctx.lineTo(width - 8, originY - 4);
  ctx.moveTo(width, originY);
  ctx.lineTo(width - 8, originY + 4);

  // Oy
  ctx.moveTo(originX, height);
  ctx.lineTo(originX, 0);
  // Oy Arrow
  ctx.lineTo(originX - 4, 8);
  ctx.moveTo(originX, 0);
  ctx.lineTo(originX + 4, 8);

  ctx.stroke();

  // 3. Labels & Ticks
  ctx.font = '10px monospace';
  ctx.fillStyle = '#475569';

  // Ox labels
  for (let gx = Math.ceil(xMin); gx <= Math.floor(xMax); gx += step) {
    if (gx === 0) continue;
    const sx = toScreenX(gx);
    ctx.beginPath();
    ctx.moveTo(sx, originY - 3);
    ctx.lineTo(sx, originY + 3);
    ctx.stroke();
    ctx.fillText(String(gx), sx - 4, originY + 14);
  }

  // Oy labels
  for (let gy = Math.ceil(yMin); gy <= Math.floor(yMax); gy += step) {
    if (gy === 0) continue;
    const sy = toScreenY(gy);
    ctx.beginPath();
    ctx.moveTo(originX - 3, sy);
    ctx.lineTo(originX + 3, sy);
    ctx.stroke();
    ctx.fillText(String(gy), originX - 16, sy + 3);
  }

  // Labels: 'O', 'x', 'y'
  ctx.font = 'bold 11px sans-serif';
  ctx.fillStyle = '#1e293b';
  ctx.fillText('O', originX - 12, originY + 12);
  ctx.fillText('x', width - 12, originY - 6);
  ctx.fillText('y', originX + 8, 14);

  ctx.restore();
}

/**
 * Safely parses and evaluates mathematical expression string for variable x
 */
export function evaluateMathFunction(expr: string, xVal: number): number {
  try {
    // Normalization
    let clean = expr
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/(\d)x/g, '$1*x')
      .replace(/x\^2/g, '(x*x)')
      .replace(/x\^3/g, '(x*x*x)')
      .replace(/\^/g, '**')
      .replace(/sin\(/g, 'Math.sin(')
      .replace(/cos\(/g, 'Math.cos(')
      .replace(/tan\(/g, 'Math.tan(')
      .replace(/sqrt\(/g, 'Math.sqrt(')
      .replace(/abs\(/g, 'Math.abs(')
      .replace(/pi/g, 'Math.PI')
      .replace(/e/g, 'Math.E');

    // Only allow safe mathematical tokens
    if (!/^[0-9x\+\-\*\/\(\)\.\,MathsincotaqrbePIE]+$/.test(clean)) {
      return NaN;
    }

    const fn = new Function('x', `return ${clean};`);
    return fn(xVal);
  } catch {
    return NaN;
  }
}

/**
 * Draws a function curve f(x) onto an Oxy plane
 */
export function drawFunctionGraph(
  ctx: CanvasRenderingContext2D,
  expr: string,
  oxy: OxyConfig,
  color: string = '#2563eb',
  lineWidth: number = 2.2
) {
  const {
    x,
    y,
    width,
    height,
    xMin = -6,
    xMax = 6,
    yMin = -4,
    yMax = 4,
  } = oxy;

  ctx.save();
  ctx.translate(x, y);

  // Clip to Oxy bounding box
  ctx.beginPath();
  ctx.rect(0, 0, width, height);
  ctx.clip();

  const xRange = xMax - xMin;
  const yRange = yMax - yMin;

  const toScreenX = (val: number) => ((val - xMin) / xRange) * width;
  const toScreenY = (val: number) => height - ((val - yMin) / yRange) * height;

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  let isDrawing = false;
  const sampleSteps = Math.min(800, width * 2);

  for (let i = 0; i <= sampleSteps; i++) {
    const curX = xMin + (i / sampleSteps) * xRange;
    const curY = evaluateMathFunction(expr, curX);

    if (isNaN(curY) || !isFinite(curY) || Math.abs(curY) > 50) {
      isDrawing = false;
      continue;
    }

    const sx = toScreenX(curX);
    const sy = toScreenY(curY);

    if (!isDrawing) {
      ctx.moveTo(sx, sy);
      isDrawing = true;
    } else {
      ctx.lineTo(sx, sy);
    }
  }

  ctx.stroke();

  // Function badge / legend
  ctx.font = 'bold 11px sans-serif';
  ctx.fillStyle = color;
  ctx.fillText(`y = ${expr}`, 12, 22);

  ctx.restore();
}
