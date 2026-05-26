// src/types.ts
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectionResult {
  label: 'text_block' | 'table_grid' | 'image';
  confidence: number;
  box: BoundingBox;
}

export interface DataCaptureItem {
  id: string;
  type: 'text' | 'table' | 'image';
  createdAt: number;
  expiresAt: number;
  content: string; // JSON stringified
}

export interface ParsedFileResult {
  name: string;
  format: 'csv' | 'json' | 'pdf' | 'txt';
  sizeKb: number;
  content?: any;
  rows?: string[][];
  headers?: string[];
}

export interface ReportWidget {
  id: string;
  sourceId: string;
  type: 'text' | 'table' | 'chart';
  title: string;
  data: any; // parsed content
}