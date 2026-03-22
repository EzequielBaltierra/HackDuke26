import OpenAI from 'openai';
import * as FileSystem from 'expo-file-system/legacy';
import { AIIdentificationResult } from '../types';

const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY!.trim(),
  dangerouslyAllowBrowser: true,
});

const IDENTIFICATION_PROMPT = `You are an expert naturalist and ecologist. Analyze this image and determine if it shows a nature subject (plant, tree, flower, fungi, insect, bird, mammal, reptile, amphibian, or other wild organism).

Return ONLY a valid JSON object (no markdown, no extra text) with this exact shape:
{
  "is_nature": boolean — true only if the image primarily shows a wild plant, animal, fungi, or other natural organism. False for humans, pets in domestic settings, man-made objects, food, screens, vehicles, buildings, etc.,
  "rejection_reason": string or null — if is_nature is false, a short friendly explanation of why this doesn't qualify (e.g. "This looks like a water bottle, not a wild species."). null if is_nature is true.,
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

If is_nature is false, still fill in the other fields with your best guess but set confidence to 0. Always return valid JSON.`;

export async function identifySpecies(imageUri: string): Promise<AIIdentificationResult> {
  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: 'base64',
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

  // Strip markdown fences if present (GPT sometimes wraps JSON anyway)
  const stripped = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  try {
    return JSON.parse(stripped) as AIIdentificationResult;
  } catch {
    const jsonMatch = stripped.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]) as AIIdentificationResult;
    throw new Error(`Could not parse AI response: ${stripped.slice(0, 100)}`);
  }
}
