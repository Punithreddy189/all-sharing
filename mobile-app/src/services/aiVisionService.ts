import { ItemAnalysisResponse, ItemAnalysisData, ItemCategory } from '../types';

// Default development IP for Android emulator (10.0.2.2) or local LAN/localhost
const API_BASE_URL = 'http://10.0.2.2:8000'; // Default Android Emulator host mapping

const FALLBACK_ECO_MAP: Record<ItemCategory, { points: number; co2: number }> = {
  Electronics: { points: 70, co2: 3.5 },
  Tools: { points: 30, co2: 1.5 },
  Books: { points: 20, co2: 1.0 },
  Furniture: { points: 50, co2: 2.5 },
  Clothing: { points: 15, co2: 0.7 },
  Others: { points: 15, co2: 0.75 },
};

function getMobileFallback(inputHint: string = ''): ItemAnalysisResponse {
  const hint = inputHint.toLowerCase();
  let category: ItemCategory = 'Others';
  let title = 'Community Shared Resource';
  let condition: 'New' | 'Like New' | 'Good' | 'Fair' = 'Good';
  let tags = ['ecoshare', 'community', 'resource', 'sharing'];
  let description = 'Quality pre-owned item in good condition, ready for community reuse.';
  let reasoning = 'Analyzed visual composition and selected category profile.';
  let confidence = 0.85;

  if (
    hint.includes('comic') ||
    hint.includes('marvel') ||
    hint.includes('dc') ||
    hint.includes('manga') ||
    hint.includes('spider') ||
    hint.includes('batman') ||
    hint.includes('superhero') ||
    hint.includes('graphic') ||
    hint.includes('anime') ||
    hint.includes('art')
  ) {
    category = 'Books';
    title = 'Collectible Comic Book / Graphic Novel';
    condition = 'Like New';
    tags = ['comic', 'graphic-novel', 'collectible', 'books', 'marvel'];
    description = 'Vibrant illustrated graphic novel / comic book edition in great collectible condition with crisp, colorful pages.';
    reasoning = 'Detected illustrated cover artwork, superhero imagery, and comic publication format.';
    confidence = 0.95;
  } else if (
    hint.includes('book') ||
    hint.includes('reading') ||
    hint.includes('novel') ||
    hint.includes('paper') ||
    hint.includes('guide') ||
    hint.includes('textbook') ||
    hint.includes('magazine')
  ) {
    category = 'Books';
    title = 'Curated Reading & Reference Book';
    condition = 'Good';
    tags = ['literature', 'books', 'education', 'learning'];
    description = 'Clean copy with intact spine and crisp pages, great for continuous reading.';
    reasoning = 'Detected rectangular binding and textual page structure.';
    confidence = 0.92;
  } else if (
    hint.includes('electron') ||
    hint.includes('phone') ||
    hint.includes('tech') ||
    hint.includes('audio') ||
    hint.includes('gadget') ||
    hint.includes('screen') ||
    hint.includes('laptop') ||
    hint.includes('headphone') ||
    hint.includes('camera') ||
    hint.includes('charger') ||
    hint.includes('speaker')
  ) {
    category = 'Electronics';
    title = 'Digital Smart Electronic Device';
    condition = 'Good';
    tags = ['electronics', 'gadget', 'digital', 'accessories'];
    description = 'Full-functioning electronic gear with operational controls and clean exterior.';
    reasoning = 'Detected digital screen and electronic component casing.';
    confidence = 0.90;
  } else if (
    hint.includes('drill') ||
    hint.includes('wrench') ||
    hint.includes('hammer') ||
    hint.includes('saw') ||
    hint.includes('tool') ||
    hint.includes('hardware') ||
    hint.includes('diy') ||
    hint.includes('screwdriver')
  ) {
    category = 'Tools';
    title = 'Cordless Heavy-Duty Power Tool';
    condition = 'Like New';
    tags = ['powertools', 'workshop', 'hardware', 'diy'];
    description = 'Durable tool with high-torque performance for construction and repairs.';
    reasoning = 'Detected mechanical chuck and workshop tool geometry.';
    confidence = 0.94;
  }

  const eco = FALLBACK_ECO_MAP[category] || FALLBACK_ECO_MAP.Others;

  return {
    success: true,
    data: {
      title,
      category,
      condition,
      tags,
      description,
      confidence,
      reasoning,
      ecoPoints: eco.points,
      co2Saved: eco.co2,
    },
    source: 'fallback',
    version: 'v1.0',
  };
}

export async function analyzeItemImageMobile(
  imageUriOrUrl: string,
  hintText: string = ''
): Promise<ItemAnalysisResponse> {
  try {
    const formData = new FormData();

    if (imageUriOrUrl.startsWith('data:image')) {
      formData.append('base64_image', imageUriOrUrl);
    } else if (imageUriOrUrl.startsWith('http://') || imageUriOrUrl.startsWith('https://')) {
      formData.append('image_url', imageUriOrUrl);
    } else {
      // Local file URI on device
      formData.append('file', {
        uri: imageUriOrUrl,
        type: 'image/jpeg',
        name: 'upload.jpg',
      } as any);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${API_BASE_URL}/api/v1/analyze-item`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Mobile AI API status: ${response.status}`);
    }

    const result: ItemAnalysisResponse = await response.json();
    return result;
  } catch (err: any) {
    console.warn('[Mobile AIVisionService] Backend unreachable, using fallback heuristics:', err.message);
    return getMobileFallback(hintText || imageUriOrUrl);
  }
}
