import { BackgroundType } from '../types/canvas';

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  bgType: BackgroundType
) {
  ctx.save();

  if (bgType === 'blank') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  } else if (bgType === 'vintage') {
    ctx.fillStyle = '#faf7ee';
    ctx.fillRect(0, 0, width, height);

    // Warm parchment texture effect
    ctx.fillStyle = 'rgba(180, 150, 110, 0.04)';
    for (let x = 0; x < width; x += 40) {
      for (let y = 0; y < height; y += 40) {
        if ((x + y) % 80 === 0) {
          ctx.fillRect(x, y, 40, 40);
        }
      }
    }
  } else if (bgType === 'blueprint') {
    ctx.fillStyle = '#0a1324';
    ctx.fillRect(0, 0, width, height);

    // Grid lines for blueprint
    const step = 20;
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = '#1e3056';

    ctx.beginPath();
    for (let x = 0; x <= width; x += step) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = 0; y <= height; y += step) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    // Major grid lines
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#274378';
    ctx.beginPath();
    for (let x = 0; x <= width; x += step * 5) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = 0; y <= height; y += step * 5) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();
  } else if (bgType === 'grid') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const step = 24;
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = '#e2e8f0';

    ctx.beginPath();
    for (let x = 0; x <= width; x += step) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = 0; y <= height; y += step) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    // Major grid every 5 units
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#cbd5e1';
    ctx.beginPath();
    for (let x = 0; x <= width; x += step * 5) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = 0; y <= height; y += step * 5) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();
  } else if (bgType === 'dot') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const step = 24;
    ctx.fillStyle = '#94a3b8';

    for (let x = step; x < width; x += step) {
      for (let y = step; y < height; y += step) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (bgType === 'oly') {
    // Authentic Vietnamese standard primary/secondary school ruling (Vở 4 hoặc 5 ô ly)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const majorStep = 40; // 1 ô lớn
    const subStep = majorStep / 4; // 4 hoặc 5 dòng kẻ phụ

    // Margin line on the left (Đường lề đỏ)
    const marginX = 80;

    // Sub-lines (Đường kẻ ly mờ nhạt)
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = '#e2edf7';
    ctx.beginPath();
    for (let y = 0; y <= height; y += subStep) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    for (let x = 0; x <= width; x += subStep) {
      ctx.moveTo(0, x);
      ctx.lineTo(width, x);
    }
    ctx.stroke();

    // Major lines (Đường ô ly chính xanh đậm)
    ctx.lineWidth = 0.9;
    ctx.strokeStyle = '#b9d4ec';
    ctx.beginPath();
    for (let y = 0; y <= height; y += majorStep) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    for (let x = 0; x <= width; x += majorStep) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    ctx.stroke();

    // Left margin line (Đường kẻ đỏ)
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = '#f87171';
    ctx.beginPath();
    ctx.moveTo(marginX, 0);
    ctx.lineTo(marginX, height);
    ctx.stroke();
  }

  ctx.restore();
}
