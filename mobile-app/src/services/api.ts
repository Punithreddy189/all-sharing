import { analyzeItemImageMobile } from './aiVisionService';
import { ItemCategory, ItemCondition } from '../types';

export interface AnalyzeResult {
  title: string;
  category: ItemCategory;
  condition: ItemCondition;
  description: string;
  ecoPoints: number;
  co2SavedKg: number;
  confidence: number;
}

export const api = {
  /**
   * Analyze an image from URI or Base64 with FastAPI backend
   */
  async analyzeImage(imageUri?: string, hint: string = ''): Promise<AnalyzeResult> {
    try {
      const response = await analyzeItemImageMobile(imageUri || '', hint);
      
      if (response && response.data) {
        return {
          title: response.data.title || 'Community Resource',
          category: response.data.category || 'Others',
          condition: response.data.condition || 'Good',
          description: response.data.description || '',
          ecoPoints: response.data.ecoPoints || 30,
          co2SavedKg: response.data.co2Saved || 1.5,
          confidence: response.data.confidence || 0.9
        };
      }
      throw new Error('No data in analysis response');
    } catch (error) {
      console.warn('[API] AI analysis error, using fallback:', error);
      const fallback = await analyzeItemImageMobile('', hint);
      return {
        title: fallback.data.title,
        category: fallback.data.category,
        condition: fallback.data.condition,
        description: fallback.data.description,
        ecoPoints: fallback.data.ecoPoints,
        co2SavedKg: fallback.data.co2Saved,
        confidence: fallback.data.confidence || 0.85
      };
    }
  }
};
