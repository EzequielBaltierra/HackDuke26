import OpenAI from 'openai';
import * as FileSystem from 'expo-file-system';
import { AIIdentificationResult } from '../types';

const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY!,
  dangerouslyAllowBrowser: true,
});

const IDENTIFICATION_PROMPT = `You are an expert naturalist and ecologist. Analyze this image and identify the species or organism shown.

Return ONLY a valid JSON object (no markdown, no extra text) with this exact shape:
{
  "common_name": "string — common name of the species",
  "scientific_name": "string — binomial scientific name",
  "category": "one of: plants, trees, flowers, fungi, insects, birds, mammals, other",
  "confidence": number between 0 and 1,
  "is_rare": boolean,
  "fact_card": {
    "native_region": "string",
    "sustainability": "string — note if invasive species",
    "habitat": "string",
    "interesting_fact": "string — one compelling fact",
    "ecological_relevance": "string",
    "sources": ["string array of source names (not URLs)"]
  }
}

If you cannot identify a specific species, use your best guess with a low confidence score. Always return valid JSON.`;

export async function identifySpecies(imageUri: string): Promise<AIIdentificationResult> {
  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${base64}`,
              detail: 'high',
            },
          },
          {
            type: 'text',
            text: IDENTIFICATION_PROMPT,
          },
        ],
      },
    ],
    max_tokens: 800,
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('No response from AI');

  try {
    return JSON.parse(content) as AIIdentificationResult;
  } catch {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]) as AIIdentificationResult;
    throw new Error('Could not parse AI response');
  }
}
