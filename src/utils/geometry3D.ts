/**
 * 3D Solid Geometry Wireframe Renderer with Educational Dashed Hidden Lines
 * Standard Vietnamese Curriculum (S.ABC, S.ABCD, Lăng trụ, Hình hộp, Hình nón, Hình trụ)
 */

export interface Shape3DOptions {
  type: 'pyramid' | 'prism' | 'cylinder' | 'cone' | 'cube';
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  lineWidth?: number;
}

export function drawShape3D(ctx: CanvasRenderingContext2D, options: Shape3DOptions) {
  const { type, x, y, width, height, color = '#1e293b', lineWidth = 1.8 } = options;

  ctx.save();
  ctx.translate(x, y);

  // Background plate
  ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, width, height);

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const w = width;
  const h = height;

  function drawSolidLine(x1: number, y1: number, x2: number, y2: number) {
    ctx.save();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  function drawDashedLine(x1: number, y1: number, x2: number, y2: number) {
    ctx.save();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = lineWidth * 0.9;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  function drawVertexLabel(name: string, vx: number, vy: number, offsetDx = 0, offsetDy = 0) {
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(name, vx + offsetDx, vy + offsetDy);
  }

  if (type === 'pyramid') {
    // Standard Pyramid S.ABCD
    const S = { x: w * 0.48, y: h * 0.15 };
    const A = { x: w * 0.22, y: h * 0.58 };
    const B = { x: w * 0.12, y: h * 0.85 };
    const C = { x: w * 0.68, y: h * 0.88 };
    const D = { x: w * 0.88, y: h * 0.62 };

    // Dashed lines (hidden edges)
    drawDashedLine(A.x, A.y, B.x, B.y);
    drawDashedLine(A.x, A.y, D.x, D.y);
    drawDashedLine(S.x, S.y, A.x, A.y);

    // Solid lines (visible edges)
    drawSolidLine(S.x, S.y, B.x, B.y);
    drawSolidLine(S.x, S.y, C.x, C.y);
    drawSolidLine(S.x, S.y, D.x, D.y);
    drawSolidLine(B.x, B.y, C.x, C.y);
    drawSolidLine(C.x, C.y, D.x, D.y);

    // Labels
    drawVertexLabel('S', S.x - 4, S.y - 6);
    drawVertexLabel('A', A.x - 14, A.y - 2);
    drawVertexLabel('B', B.x - 12, B.y + 12);
    drawVertexLabel('C', C.x + 4, C.y + 14);
    drawVertexLabel('D', D.x + 6, D.y - 2);
  } else if (type === 'cube') {
    // Cuboid / Cube ABCDA'B'C'D'
    const offset = w * 0.25;
    const dy = h * 0.22;
    const sizeW = w * 0.58;
    const sizeH = h * 0.55;

    const A = { x: w * 0.12 + offset, y: h * 0.15 };
    const B = { x: w * 0.12 + offset + sizeW, y: h * 0.15 };
    const C = { x: w * 0.12 + sizeW, y: h * 0.15 + dy };
    const D = { x: w * 0.12, y: h * 0.15 + dy };

    const A1 = { x: A.x, y: A.y + sizeH };
    const B1 = { x: B.x, y: B.y + sizeH };
    const C1 = { x: C.x, y: C.y + sizeH };
    const D1 = { x: D.x, y: D.y + sizeH };

    // Dashed hidden edges
    drawDashedLine(A.x, A.y, B.x, B.y);
    drawDashedLine(A.x, A.y, D.x, D.y);
    drawDashedLine(A.x, A.y, A1.x, A1.y);

    // Solid edges
    drawSolidLine(B.x, B.y, C.x, C.y);
    drawSolidLine(C.x, C.y, D.x, D.y);
    drawSolidLine(D.x, D.y, D1.x, D1.y);
    drawSolidLine(B.x, B.y, B1.x, B1.y);
    drawSolidLine(C.x, C.y, C1.x, C1.y);
    drawSolidLine(A1.x, A1.y, B1.x, B1.y);
    drawSolidLine(B1.x, B1.y, C1.x, C1.y);
    drawSolidLine(C1.x, C1.y, D1.x, D1.y);
    drawSolidLine(D1.x, D1.y, A1.x, A1.y);
  } else if (type === 'prism') {
    // Triangular Prism ABC.A'B'C'
    const A = { x: w * 0.2, y: h * 0.28 };
    const B = { x: w * 0.45, y: h * 0.38 };
    const C = { x: w * 0.8, y: h * 0.25 };

    const dz = h * 0.5;
    const A1 = { x: A.x, y: A.y + dz };
    const B1 = { x: B.x, y: B.y + dz };
    const C1 = { x: C.x, y: C.y + dz };

    // Top triangle
    drawSolidLine(A.x, A.y, B.x, B.y);
    drawSolidLine(B.x, B.y, C.x, C.y);
    drawDashedLine(A.x, A.y, C.x, C.y);

    // Pillars
    drawSolidLine(A.x, A.y, A1.x, A1.y);
    drawSolidLine(B.x, B.y, B1.x, B1.y);
    drawSolidLine(C.x, C.y, C1.x, C1.y);

    // Bottom triangle
    drawSolidLine(A1.x, A1.y, B1.x, B1.y);
    drawSolidLine(B1.x, B1.y, C1.x, C1.y);
    drawDashedLine(A1.x, A1.y, C1.x, C1.y);
  } else if (type === 'cone') {
    // Circular Cone
    const S = { x: w * 0.5, y: h * 0.15 };
    const O = { x: w * 0.5, y: h * 0.8 };
    const rx = w * 0.38;
    const ry = h * 0.12;

    // Generators
    drawSolidLine(S.x, S.y, O.x - rx, O.y);
    drawSolidLine(S.x, S.y, O.x + rx, O.y);

    // Height SO & Radius
    drawDashedLine(S.x, S.y, O.x, O.y);
    drawDashedLine(O.x, O.y, O.x + rx, O.y);

    // Base Ellipse (Front solid, back dashed)
    // Front half
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(O.x, O.y, rx, ry, 0, 0, Math.PI);
    ctx.stroke();
    ctx.restore();

    // Back half (dashed)
    ctx.save();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = '#64748b';
    ctx.beginPath();
    ctx.ellipse(O.x, O.y, rx, ry, 0, Math.PI, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  } else if (type === 'cylinder') {
    // Cylinder
    const rx = w * 0.36;
    const ry = h * 0.1;
    const topY = h * 0.22;
    const botY = h * 0.78;
    const cx = w * 0.5;

    // Side generators
    drawSolidLine(cx - rx, topY, cx - rx, botY);
    drawSolidLine(cx + rx, topY, cx + rx, botY);

    // Top full ellipse
    ctx.beginPath();
    ctx.ellipse(cx, topY, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Bottom ellipse: front solid, back dashed
    ctx.beginPath();
    ctx.ellipse(cx, botY, rx, ry, 0, 0, Math.PI);
    ctx.stroke();

    ctx.save();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = '#64748b';
    ctx.beginPath();
    ctx.ellipse(cx, botY, rx, ry, 0, Math.PI, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Axis
    drawDashedLine(cx, topY, cx, botY);
  }

  ctx.restore();
}
