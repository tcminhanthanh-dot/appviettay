import { CanvasPage, Layer, BackgroundType, Stroke } from '../types/canvas';
import { drawBackground } from './backgroundRenderer';
import { drawStroke } from './strokeRenderer';
import { drawOxyPlane, drawFunctionGraph } from './mathGrapher';
import { drawShape3D } from './geometry3D';

function loadImageAsync(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export interface PDFExportOptions {
  pages: CanvasPage[];
  layers: Layer[];
  globalBackground: BackgroundType;
  canvasWidth: number;
  sliceHeight?: number; // Standard A4 slice height (e.g. width * 1.414)
  exportScope: 'all' | 'current';
  currentPageId: string;
  includeBackground: boolean;
  docTitle: string;
  showPageNumbers: boolean;
}

export interface PDFPageSlice {
  dataUrl: string;
  pageNumber: number;
  totalPageCount: number;
  sourcePageTitle: string;
  sliceIndex: number;
  width: number;
  height: number;
}

/**
 * Render all pages and slices to high-resolution JPEG data URLs
 */
export async function renderPDFSlices(options: PDFExportOptions): Promise<PDFPageSlice[]> {
  const {
    pages,
    layers,
    globalBackground,
    canvasWidth,
    exportScope,
    currentPageId,
    includeBackground,
    docTitle,
    showPageNumbers,
  } = options;

  // Standard A4 aspect ratio 1 : 1.4142
  const standardSliceHeight = options.sliceHeight || Math.round(canvasWidth * 1.4142);

  // Filter pages to export
  const targetPages = exportScope === 'current'
    ? pages.filter(p => p.id === currentPageId)
    : pages;

  if (targetPages.length === 0 && pages.length > 0) {
    targetPages.push(pages[0]);
  }

  // Pre-calculate all slices across pages
  interface SlicePlan {
    sourcePage: CanvasPage;
    sliceTop: number;
    sliceHeight: number;
    sliceIndex: number;
  }

  const slicePlans: SlicePlan[] = [];

  for (const page of targetPages) {
    const totalHeight = Math.max(page.pageHeight, standardSliceHeight);
    
    // Check if page has manual page breaks
    const manualBreaks = (page.pageBreaks || [])
      .filter(y => y > 50 && y < totalHeight - 50)
      .sort((a, b) => a - b);

    if (manualBreaks.length > 0) {
      let prevY = 0;
      let idx = 0;
      for (const breakY of manualBreaks) {
        slicePlans.push({
          sourcePage: page,
          sliceTop: prevY,
          sliceHeight: breakY - prevY,
          sliceIndex: idx++,
        });
        prevY = breakY;
      }
      // Remaining slice to totalHeight
      if (prevY < totalHeight) {
        slicePlans.push({
          sourcePage: page,
          sliceTop: prevY,
          sliceHeight: totalHeight - prevY,
          sliceIndex: idx++,
        });
      }
    } else {
      // Split evenly by standard A4 height
      let top = 0;
      let idx = 0;
      while (top < totalHeight) {
        const height = Math.min(standardSliceHeight, totalHeight - top);
        slicePlans.push({
          sourcePage: page,
          sliceTop: top,
          sliceHeight: height,
          sliceIndex: idx++,
        });
        top += standardSliceHeight;
      }
    }
  }

  const totalPageCount = slicePlans.length;
  const renderedSlices: PDFPageSlice[] = [];

  // Create an offscreen canvas with 2x resolution for crisp high-DPI lines
  const scale = 2;
  const offscreen = document.createElement('canvas');
  const ctx = offscreen.getContext('2d');
  if (!ctx) return [];

  const layerMap = new Map(layers.map(l => [l.id, l]));

  for (let i = 0; i < slicePlans.length; i++) {
    const plan = slicePlans[i];
    const { sourcePage, sliceTop, sliceHeight, sliceIndex } = plan;

    // Use standard A4 canvas target dimensions
    const renderWidth = canvasWidth;
    const renderHeight = standardSliceHeight;

    offscreen.width = renderWidth * scale;
    offscreen.height = renderHeight * scale;

    ctx.save();
    ctx.scale(scale, scale);

    // 1. Draw Background
    const pageBg = sourcePage.background || globalBackground;
    if (includeBackground) {
      drawBackground(ctx, renderWidth, renderHeight, pageBg);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, renderWidth, renderHeight);
    }

    // 2. Draw Strokes for this slice
    ctx.save();
    // Translate coordinate system so sliceTop aligns with top of canvas
    ctx.translate(0, -sliceTop);

    const sliceBottom = sliceTop + sliceHeight;

    for (const stroke of sourcePage.strokes) {
      const layer = layerMap.get(stroke.layerId);
      if (layer && !layer.visible) continue;
      const layerOpacity = layer ? layer.opacity : 1;

      // Quick bounding check to only draw intersecting strokes
      if (stroke.points && stroke.points.length > 0) {
        let minPtY = Infinity;
        let maxPtY = -Infinity;
        for (const pt of stroke.points) {
          if (pt.y < minPtY) minPtY = pt.y;
          if (pt.y > maxPtY) maxPtY = pt.y;
        }
        if (maxPtY < sliceTop - 50 || minPtY > sliceBottom + 50) {
          continue;
        }
      }

      drawStroke(ctx, stroke, layerOpacity);
    }

    // 2b. Draw Math Plots (Oxy 2D & 3D SGK Shapes)
    if (sourcePage.plots && sourcePage.plots.length > 0) {
      for (const plot of sourcePage.plots) {
        if (plot.y + plot.height < sliceTop || plot.y > sliceBottom) continue;
        ctx.save();
        ctx.translate(plot.x, plot.y);
        if (plot.type === 'function' && plot.expression) {
          drawOxyPlane(ctx, { x: 0, y: 0, width: plot.width, height: plot.height });
          drawFunctionGraph(
            ctx,
            plot.expression,
            { x: 0, y: 0, width: plot.width, height: plot.height },
            plot.color || '#2563eb'
          );
        } else if (plot.type === 'shape3d' && plot.shape3DType) {
          drawShape3D(ctx, {
            type: plot.shape3DType,
            x: 0,
            y: 0,
            width: plot.width,
            height: plot.height,
          });
        }
        ctx.restore();
      }
    }

    // 2c. Draw Educational Images
    if (sourcePage.images && sourcePage.images.length > 0) {
      for (const imgItem of sourcePage.images) {
        if (imgItem.y + imgItem.height < sliceTop || imgItem.y > sliceBottom) continue;
        try {
          const img = await loadImageAsync(imgItem.src);
          ctx.drawImage(img, imgItem.x, imgItem.y, imgItem.width, imgItem.height);
        } catch (e) {
          console.warn('Could not load image for PDF slice', e);
        }
      }
    }

    // 2d. Draw Text Boxes
    if (sourcePage.texts && sourcePage.texts.length > 0) {
      for (const textItem of sourcePage.texts) {
        if (textItem.y + 120 < sliceTop || textItem.y > sliceBottom) continue;
        ctx.save();
        ctx.font = `${textItem.fontSize || 16}px system-ui, -apple-system, sans-serif`;
        ctx.fillStyle = textItem.color || '#1e293b';
        ctx.textBaseline = 'top';
        const lines = textItem.text.split('\n');
        let lineY = textItem.y;
        for (const line of lines) {
          ctx.fillText(line, textItem.x, lineY);
          lineY += (textItem.fontSize || 16) * 1.35;
        }
        ctx.restore();
      }
    }

    ctx.restore();

    // 3. Optional OneNote Style Header & Footer
    if (showPageNumbers) {
      ctx.save();
      ctx.font = '11px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#64748b';

      // Header: Document title & Page title
      const headerText = `${docTitle || 'Ghi chú'} • ${sourcePage.title}`;
      ctx.fillText(headerText, 24, 28);

      // Top divider line (subtle)
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(24, 36);
      ctx.lineTo(renderWidth - 24, 36);
      ctx.stroke();

      // Footer: Page number & App branding
      const footerPageText = `Trang ${i + 1} / ${totalPageCount}`;
      const footerBrandText = `Smart Vector Engine • Phân trang chuẩn OneNote`;
      ctx.fillText(footerBrandText, 24, renderHeight - 18);

      const pageTextWidth = ctx.measureText(footerPageText).width;
      ctx.fillText(footerPageText, renderWidth - 24 - pageTextWidth, renderHeight - 18);

      // Bottom divider line
      ctx.beginPath();
      ctx.moveTo(24, renderHeight - 30);
      ctx.lineTo(renderWidth - 24, renderHeight - 30);
      ctx.stroke();

      ctx.restore();
    }

    ctx.restore();

    // Convert to JPEG with high quality
    const dataUrl = offscreen.toDataURL('image/jpeg', 0.94);
    renderedSlices.push({
      dataUrl,
      pageNumber: i + 1,
      totalPageCount,
      sourcePageTitle: sourcePage.title,
      sliceIndex,
      width: renderWidth,
      height: renderHeight,
    });
  }

  return renderedSlices;
}

/**
 * Builds a valid binary PDF 1.4 Blob directly in the browser from JPEG image slices.
 */
export function buildPDFBlobFromSlices(slices: PDFPageSlice[]): Blob {
  if (slices.length === 0) {
    return new Blob([], { type: 'application/pdf' });
  }

  // A4 standard points: 595.28 x 841.89 (72 points per inch)
  const a4Width = 595.28;
  const a4Height = 841.89;

  const encoder = new TextEncoder();
  const parts: (Uint8Array | string)[] = [];
  const objOffsets: number[] = [];

  let currentOffset = 0;

  function pushString(str: string) {
    parts.push(str);
    currentOffset += encoder.encode(str).length;
  }

  function pushBinary(bin: Uint8Array) {
    parts.push(bin);
    currentOffset += bin.length;
  }

  function markObject(objId: number) {
    objOffsets[objId] = currentOffset;
  }

  // 1. PDF Header
  pushString('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');

  // Object 1: Catalog
  markObject(1);
  pushString(`1 0 obj\n<<\n  /Type /Catalog\n  /Pages 2 0 R\n>>\nendobj\n`);

  // Total pages
  const totalPages = slices.length;
  // Page objects will be: 3, 6, 9... (3 * i + 3)
  // Image objects: 4, 7, 10... (3 * i + 4)
  // Content objects: 5, 8, 11... (3 * i + 5)
  const pageObjectIds = slices.map((_, i) => 3 + i * 3);

  // Object 2: Pages Collection
  markObject(2);
  pushString(`2 0 obj\n<<\n  /Type /Pages\n  /Kids [${pageObjectIds.map(id => `${id} 0 R`).join(' ')}]\n  /Count ${totalPages}\n>>\nendobj\n`);

  // Decode each JPEG slice and write objects
  for (let i = 0; i < slices.length; i++) {
    const slice = slices[i];
    const pageObjId = 3 + i * 3;
    const imgObjId = 4 + i * 3;
    const contentObjId = 5 + i * 3;

    // Convert dataUrl to binary JPEG Uint8Array
    const base64Data = slice.dataUrl.replace(/^data:image\/[a-z]+;base64,/, '');
    const binaryString = atob(base64Data);
    const jpegBytes = new Uint8Array(binaryString.length);
    for (let b = 0; b < binaryString.length; b++) {
      jpegBytes[b] = binaryString.charCodeAt(b);
    }

    // Page Object
    markObject(pageObjId);
    pushString(`${pageObjId} 0 obj\n<<\n  /Type /Page\n  /Parent 2 0 R\n  /MediaBox [0 0 ${a4Width} ${a4Height}]\n  /Resources <<\n    /XObject << /Im${i + 1} ${imgObjId} 0 R >>\n    /ProcSet [/PDF /ImageC]\n  >>\n  /Contents ${contentObjId} 0 R\n>>\nendobj\n`);

    // Image XObject
    markObject(imgObjId);
    pushString(`${imgObjId} 0 obj\n<<\n  /Type /XObject\n  /Subtype /Image\n  /Width ${slice.width * 2}\n  /Height ${slice.height * 2}\n  /ColorSpace /DeviceRGB\n  /BitsPerComponent 8\n  /Filter /DCTDecode\n  /Length ${jpegBytes.length}\n>>\nstream\n`);
    pushBinary(jpegBytes);
    pushString('\nendstream\nendobj\n');

    // Contents Stream: Draw image to fill standard A4
    const contentStream = `q\n${a4Width} 0 0 ${a4Height} 0 0 cm\n/Im${i + 1} Do\nQ\n`;
    markObject(contentObjId);
    pushString(`${contentObjId} 0 obj\n<<\n  /Length ${contentStream.length}\n>>\nstream\n${contentStream}endstream\nendobj\n`);
  }

  // Cross-reference table (xref)
  const xrefOffset = currentOffset;
  const totalObjects = 2 + slices.length * 3;

  pushString(`xref\n0 ${totalObjects + 1}\n0000000000 65535 f \n`);
  for (let obj = 1; obj <= totalObjects; obj++) {
    const offset = objOffsets[obj] || 0;
    const offsetStr = String(offset).padStart(10, '0');
    pushString(`${offsetStr} 00000 n \n`);
  }

  // Trailer
  pushString(`trailer\n<<\n  /Size ${totalObjects + 1}\n  /Root 1 0 R\n>>\nstartxref\n${xrefOffset}\n%%EOF\n`);

  // Convert parts into Blob
  return new Blob(parts, { type: 'application/pdf' });
}

/**
 * Triggers instant browser download of the PDF blob
 */
export function downloadPDFBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Opens browser print dialog for the generated slices with clean A4 layout
 */
export function printPDFSlices(slices: PDFPageSlice[], docTitle: string) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Vui lòng cho phép mở cửa sổ popup để thực hiện in tài liệu.');
    return;
  }

  const pagesHtml = slices
    .map(
      (slice, index) => `
    <div class="print-page">
      <img src="${slice.dataUrl}" alt="Trang ${index + 1}" />
    </div>
  `
    )
    .join('\n');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="vi">
      <head>
        <meta charset="utf-8" />
        <title>${docTitle || 'Smart Vector Note'} - In Tài Liệu PDF</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 0;
          }
          * {
            box-sizing: border-box;
          }
          body {
            margin: 0;
            padding: 0;
            background: #525659;
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .print-page {
            width: 210mm;
            height: 297mm;
            page-break-after: always;
            break-after: page;
            background: white;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.25);
            margin: 15px 0;
          }
          .print-page img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
          @media print {
            body {
              background: white;
            }
            .print-page {
              margin: 0;
              box-shadow: none;
              width: 100vw;
              height: 100vh;
            }
          }
        </style>
      </head>
      <body>
        ${pagesHtml}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
