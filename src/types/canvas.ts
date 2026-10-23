export type PenType = 'fountain' | 'pencil' | 'brush' | 'highlighter' | 'laser';

export interface Point {
  x: number;
  y: number;
  pressure?: number;
  time?: number;
}

export interface LaserPoint {
  x: number;
  y: number;
  time: number;
}

export interface CanvasImageItem {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  locked?: boolean;
}

export interface CanvasTextItem {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  isMathFormula?: boolean;
  width?: number;
}

export interface MathPlotItem {
  id: string;
  type: 'oxy' | 'function' | 'shape3d';
  x: number;
  y: number;
  width: number;
  height: number;
  title?: string;
  expression?: string;
  color?: string;
  shape3DType?: 'pyramid' | 'prism' | 'cylinder' | 'cone' | 'cube';
}

export interface Stroke {
  id: string;
  penType: PenType;
  color: string;
  size: number;
  points: Point[];
  layerId: string;
  timestamp: number;
  smoothed?: boolean;
  isShape?: boolean;
  shapeType?: 'line' | 'circle' | 'rectangle' | 'triangle' | 'arrow';
  shapeData?: any;
  opacity?: number;
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  color?: string;
}

export interface CanvasPage {
  id: string;
  title: string;
  strokes: Stroke[];
  images?: CanvasImageItem[];
  texts?: CanvasTextItem[];
  plots?: MathPlotItem[];
  history?: Stroke[][];
  redoStack?: Stroke[][];
  pageHeight: number;
  pageBreaks?: number[];
  background?: BackgroundType;
  createdAt: number;
  updatedAt?: number;
}

export interface PageBreakInfo {
  id: string;
  y: number;
  pageNumber: number;
  label?: string;
  isAuto?: boolean;
}

export type ViewMode = 'infinite' | 'paginated';

export type BackgroundType = 'oly' | 'grid' | 'dot' | 'blank' | 'vintage' | 'blueprint';

export type MathToolType = 'none' | 'ruler' | 'square' | 'compass';

export interface RulerConfig {
  x: number;
  y: number;
  length: number; // in pixels
  angle: number;  // in degrees
  visible: boolean;
}

export interface SquareConfig {
  x: number;
  y: number;
  size: number;   // leg size
  angle: number;
  visible: boolean;
}

export interface CompassConfig {
  anchorX: number;
  anchorY: number;
  radius: number;
  angle: number;
  sweepAngle: number;
  visible: boolean;
  isDrawing: boolean;
}

export interface OCRResult {
  transcribedText: string;
  mathFormulas: string[];
  handwritingAnalysis?: {
    neatnessScore: number;
    slantAngle: string;
    consistency: string;
    goldenRatioEvaluation: string;
  };
  recommendations?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'specialist';
  text: string;
  timestamp: number;
  canvasImage?: string;
}
