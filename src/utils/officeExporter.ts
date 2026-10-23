/**
 * In-browser OpenXML Generator for PowerPoint (.pptx) & Word (.docx)
 * Based on pptx-official & docx-official from SKILL EDUCATION
 * Generates genuine Office ZIP binary files without external packages.
 */

import { CanvasPage, Layer, BackgroundType } from '../types/canvas';
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

// CRC32 calculation table
const CRC32_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC32_TABLE[i] = c;
}

function calculateCRC32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

interface ZipEntry {
  name: string;
  data: Uint8Array;
}

/**
 * Packs multiple entries into an uncompressed standard ZIP archive Blob
 */
export function createZipBlob(entries: ZipEntry[]): Blob {
  const encoder = new TextEncoder();
  const fileRecords: {
    nameBytes: Uint8Array;
    data: Uint8Array;
    crc: number;
    offset: number;
  }[] = [];

  const chunks: Uint8Array[] = [];
  let currentOffset = 0;

  // 1. Write Local File Records
  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const crc = calculateCRC32(entry.data);
    const offset = currentOffset;

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(localHeader.buffer);

    view.setUint32(0, 0x04034b50, true); // Local file header signature
    view.setUint16(4, 20, true); // Version needed to extract (2.0)
    view.setUint16(6, 0, true); // General purpose bit flag
    view.setUint16(8, 0, true); // Compression method (0 = Store)
    view.setUint16(10, 0, true); // Last mod time
    view.setUint16(12, 0, true); // Last mod date
    view.setUint32(14, crc, true); // CRC-32
    view.setUint32(18, entry.data.length, true); // Compressed size
    view.setUint32(22, entry.data.length, true); // Uncompressed size
    view.setUint16(26, nameBytes.length, true); // File name length
    view.setUint16(28, 0, true); // Extra field length
    localHeader.set(nameBytes, 30);

    chunks.push(localHeader);
    chunks.push(entry.data);

    currentOffset += localHeader.length + entry.data.length;
    fileRecords.push({ nameBytes, data: entry.data, crc, offset });
  }

  // 2. Central Directory
  const centralDirStart = currentOffset;
  for (const rec of fileRecords) {
    const cdHeader = new Uint8Array(46 + rec.nameBytes.length);
    const view = new DataView(cdHeader.buffer);

    view.setUint32(0, 0x02014b50, true); // Central file header signature
    view.setUint16(4, 20, true); // Version made by
    view.setUint16(6, 20, true); // Version needed to extract
    view.setUint16(8, 0, true); // General purpose bit flag
    view.setUint16(10, 0, true); // Compression method
    view.setUint16(12, 0, true); // Last mod time
    view.setUint16(14, 0, true); // Last mod date
    view.setUint32(16, rec.crc, true); // CRC-32
    view.setUint32(20, rec.data.length, true); // Compressed size
    view.setUint32(24, rec.data.length, true); // Uncompressed size
    view.setUint16(28, rec.nameBytes.length, true); // File name length
    view.setUint16(30, 0, true); // Extra field length
    view.setUint16(32, 0, true); // File comment length
    view.setUint16(34, 0, true); // Disk number start
    view.setUint16(36, 0, true); // Internal file attributes
    view.setUint32(38, 0, true); // External file attributes
    view.setUint32(42, rec.offset, true); // Relative offset of local header
    cdHeader.set(rec.nameBytes, 46);

    chunks.push(cdHeader);
    currentOffset += cdHeader.length;
  }

  const centralDirSize = currentOffset - centralDirStart;

  // 3. End of Central Directory Record (EOCD)
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  eocdView.setUint32(0, 0x06054b50, true); // EOCD signature
  eocdView.setUint16(4, 0, true); // Number of this disk
  eocdView.setUint16(6, 0, true); // Disk where central directory starts
  eocdView.setUint16(8, fileRecords.length, true); // Number of central directory records on this disk
  eocdView.setUint16(10, fileRecords.length, true); // Total number of central directory records
  eocdView.setUint32(12, centralDirSize, true); // Size of central directory
  eocdView.setUint32(16, centralDirStart, true); // Offset of start of central directory
  eocdView.setUint16(20, 0, true); // Comment length

  chunks.push(eocd);

  return new Blob(chunks, { type: 'application/octet-stream' });
}

function stringToUint8(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function dataUrlToUint8(dataUrl: string): Uint8Array {
  const base64 = dataUrl.replace(/^data:image\/[a-z]+;base64,/, '');
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
}

/**
 * Render a page to high-res PNG image dataUrl
 */
export async function renderPageToImage(
  page: CanvasPage,
  layers: Layer[],
  globalBg: BackgroundType,
  width: number
): Promise<string> {
  const offscreen = document.createElement('canvas');
  const height = Math.max(page.pageHeight, Math.round(width * 1.4142));
  const scale = 2;

  offscreen.width = width * scale;
  offscreen.height = height * scale;

  const ctx = offscreen.getContext('2d');
  if (!ctx) return '';

  ctx.scale(scale, scale);

  // Background
  const pageBg = page.background || globalBg;
  drawBackground(ctx, width, height, pageBg);

  // Strokes
  const layerMap = new Map(layers.map(l => [l.id, l]));
  for (const stroke of page.strokes) {
    const layer = layerMap.get(stroke.layerId);
    if (layer && !layer.visible) continue;
    const opacity = layer ? layer.opacity : 1;
    drawStroke(ctx, stroke, opacity);
  }

  // Draw Math Plots (Oxy 2D & 3D SGK Shapes)
  if (page.plots && page.plots.length > 0) {
    for (const plot of page.plots) {
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

  // Draw Educational Images
  if (page.images && page.images.length > 0) {
    for (const imgItem of page.images) {
      try {
        const img = await loadImageAsync(imgItem.src);
        ctx.drawImage(img, imgItem.x, imgItem.y, imgItem.width, imgItem.height);
      } catch (e) {
        console.warn('Could not load image for Office exporter', e);
      }
    }
  }

  // Draw Text Boxes
  if (page.texts && page.texts.length > 0) {
    for (const textItem of page.texts) {
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

  return offscreen.toDataURL('image/png', 0.95);
}

/**
 * Export Notebook Pages to PowerPoint Presentation (.pptx)
 * 16:9 widescreen layout with slide masters
 */
export async function exportToPPTX(
  pages: CanvasPage[],
  layers: Layer[],
  globalBg: BackgroundType,
  canvasWidth: number,
  docTitle: string
): Promise<Blob> {
  const entries: ZipEntry[] = [];

  // [Content_Types].xml
  let contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="png" ContentType="image/png"/>
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
`;

  // _rels/.rels
  entries.push({
    name: '_rels/.rels',
    data: stringToUint8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`),
  });

  // ppt/_rels/presentation.xml.rels
  let presRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
`;

  // Render each page into a slide
  let slideListXml = '';
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const slideNum = i + 1;
    const rId = `rId${slideNum + 10}`;

    contentTypesXml += `  <Override PartName="/ppt/slides/slide${slideNum}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>\n`;
    presRels += `  <Relationship Id="${rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${slideNum}.xml"/>\n`;
    slideListXml += `    <p:sldId id="${256 + i}" r:id="${rId}"/>\n`;

    // Render image
    const imgDataUrl = await renderPageToImage(page, layers, globalBg, canvasWidth);
    const imgBytes = dataUrlToUint8(imgDataUrl);
    entries.push({
      name: `ppt/media/image${slideNum}.png`,
      data: imgBytes,
    });

    // ppt/slides/_rels/slide{N}.xml.rels
    entries.push({
      name: `ppt/slides/_rels/slide${slideNum}.xml.rels`,
      data: stringToUint8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image${slideNum}.png"/>
</Relationships>`),
    });

    // ppt/slides/slide{N}.xml (Standard 16:9 slide: 12192000 x 6858000 EMUs)
    entries.push({
      name: `ppt/slides/slide${slideNum}.xml`,
      data: stringToUint8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
      <!-- Slide Title -->
      <p:sp>
        <p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="609600" y="228600"/><a:ext cx="10972800" cy="685800"/></a:xfrm></p:spPr>
        <p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="vi-VN" sz="2400" b="1"><a:solidFill><a:srgbClr val="1E293B"/></a:solidFill></a:rPr><a:t>${docTitle} - ${page.title}</a:t></a:r></a:p></p:txBody>
      </p:sp>
      <!-- Main Handwritten Board Image -->
      <p:pic>
        <p:nvPicPr><p:cNvPr id="3" name="BoardNote"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr>
        <p:blipFill><a:blip r:embed="rId2"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>
        <p:spPr><a:xfrm><a:off x="609600" y="1028700"/><a:ext cx="10972800" cy="5486400"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>
      </p:pic>
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>`),
    });
  }

  contentTypesXml += `</Types>`;
  presRels += `</Relationships>`;

  entries.push({ name: '[Content_Types].xml', data: stringToUint8(contentTypesXml) });
  entries.push({ name: 'ppt/_rels/presentation.xml.rels', data: stringToUint8(presRels) });

  // ppt/presentation.xml (Widescreen 16:9 = 12192000 x 6858000)
  entries.push({
    name: 'ppt/presentation.xml',
    data: stringToUint8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>
  <p:sldIdLst>
${slideListXml}  </p:sldIdLst>
  <p:sldSz cx="12192000" cy="6858000" type="screen16x9"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`),
  });

  // Basic slideMaster & slideLayout
  entries.push({
    name: 'ppt/slideMasters/slideMaster1.xml',
    data: stringToUint8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
</p:sldMaster>`),
  });

  entries.push({
    name: 'ppt/slideMasters/_rels/slideMaster1.xml.rels',
    data: stringToUint8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>`),
  });

  entries.push({
    name: 'ppt/slideLayouts/slideLayout1.xml',
    data: stringToUint8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" type="blank">
  <p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>
</p:sldLayout>`),
  });

  entries.push({
    name: 'ppt/slideLayouts/_rels/slideLayout1.xml.rels',
    data: stringToUint8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>`),
  });

  return createZipBlob(entries);
}

/**
 * Export Notebook Pages to Word Document (.docx)
 * Formatted with lesson headers, metadata, and high-res figures
 */
export async function exportToDOCX(
  pages: CanvasPage[],
  layers: Layer[],
  globalBg: BackgroundType,
  canvasWidth: number,
  docTitle: string
): Promise<Blob> {
  const entries: ZipEntry[] = [];

  // [Content_Types].xml
  entries.push({
    name: '[Content_Types].xml',
    data: stringToUint8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="png" ContentType="image/png"/>
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`),
  });

  // _rels/.rels
  entries.push({
    name: '_rels/.rels',
    data: stringToUint8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`),
  });

  let docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
`;

  let bodyXml = `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="44"/><w:color w:val="1E293B"/></w:rPr><w:t>${docTitle}</w:t></w:r></w:p>
<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:i/><w:sz w:val="20"/><w:color w:val="64748B"/></w:rPr><w:t>Tài liệu giáo án &amp; Bảng viết tay số hóa • ${new Date().toLocaleDateString('vi-VN')}</w:t></w:r></w:p>
<w:p/>`;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const pageNum = i + 1;
    const rId = `rId${pageNum + 10}`;

    docRels += `  <Relationship Id="${rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image${pageNum}.png"/>\n`;

    const imgDataUrl = await renderPageToImage(page, layers, globalBg, canvasWidth);
    const imgBytes = dataUrlToUint8(imgDataUrl);
    entries.push({
      name: `word/media/image${pageNum}.png`,
      data: imgBytes,
    });

    // Page section header
    bodyXml += `
<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="CBD5E1"/></w:pBdr></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="4338CA"/></w:rPr><w:t>${page.title}</w:t></w:r></w:p>
<w:p><w:r><w:drawing>
  <wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
    <wp:extent cx="5486400" cy="7315200"/>
    <wp:docPr id="${pageNum}" name="Picture ${pageNum}"/>
    <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
      <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
        <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
          <pic:nvPicPr><pic:cNvPr id="${pageNum}" name=""/><pic:cNvPicPr/></pic:nvPicPr>
          <pic:blipFill><a:blip r:embed="${rId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>
          <pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="5486400" cy="7315200"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>
        </pic:pic>
      </a:graphicData>
    </a:graphic>
  </wp:inline>
</w:r></w:p>
<w:p><w:r><w:br w:type="page"/></w:r></w:p>`;
  }

  docRels += `</Relationships>`;
  entries.push({ name: 'word/_rels/document.xml.rels', data: stringToUint8(docRels) });

  // word/document.xml
  entries.push({
    name: 'word/document.xml',
    data: stringToUint8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
${bodyXml}
    <w:sectPr><w:pgSz w:w="11906" w:h="16838"/></w:sectPr>
  </w:body>
</w:document>`),
  });

  return createZipBlob(entries);
}

export function downloadOfficeBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
