/**
 * @file AIEngineService.ts
 * @description Interfaces for interacting with on-device CoreML / TFLite models for offline detection.
 */

export interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface DetectionResult {
    label: 'text_block' | 'table_grid' | 'image_graphic';
    confidence: number;
    box: BoundingBox;
}

export class AIEngineService {
    /**
     * Processes a raw camera frame or local image via MobileNetV2
     */
    public async detectRegions(imageUri: string): Promise<DetectionResult[]> {
        console.log('[AI INFERENCE] Running Object Detection on', imageUri);
        // Stub: Returns mock bounding boxes mapping to user wireframe examples
        return [
            { label: 'text_block', confidence: 0.98, box: { x: 10, y: 15, width: 80, height: 12 } },
            { label: 'table_grid', confidence: 0.95, box: { x: 10, y: 32, width: 80, height: 25 } },
        ];
    }

    /**
     * Extracts text from an image region using local OCR models
     */
    public async extractText(imageUri: string, region: BoundingBox): Promise<string> {
        console.log('[AI INFERENCE] Running OCR Tesseract engine locally');
        return "Simulated Extracted Text from Device";
    }
}
