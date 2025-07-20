'use server';
/**
 * @fileOverview A flow for detecting if a person is saying "hai" in an audio clip.
 *
 * - detectHai - A function that analyzes an audio clip to see if "hai" is said.
 * - DetectHaiInput - The input type for the detectHai function.
 * - DetectHaiOutput - The return type for the detectHai function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectHaiInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "An audio clip, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type DetectHaiInput = z.infer<typeof DetectHaiInputSchema>;

const DetectHaiOutputSchema = z.object({
  saidHai: z
    .boolean()
    .describe('Whether or not the word "hai" was detected in the audio.'),
});
export type DetectHaiOutput = z.infer<typeof DetectHaiOutputSchema>;

export async function detectHai(
  input: DetectHaiInput
): Promise<DetectHaiOutput> {
  return detectHaiFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectHaiPrompt',
  input: {schema: DetectHaiInputSchema},
  output: {schema: DetectHaiOutputSchema},
  prompt: `You are an expert in voice activity detection. Your task is to determine if the word "hai" is spoken in the provided audio clip.
The word must be clearly audible. Ignore other sounds or words.
Set saidHai to true only if "hai" is detected. Otherwise, set it to false.

Analyze this audio clip: {{media url=audioDataUri}}`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const detectHaiFlow = ai.defineFlow(
  {
    name: 'detectHaiFlow',
    inputSchema: DetectHaiInputSchema,
    outputSchema: DetectHaiOutputSchema,
  },
  async input => {
    // If the data URI is empty, don't call the prompt.
    if (!input.audioDataUri || input.audioDataUri.length < 100) { // Check for a reasonable length
        return { saidHai: false };
    }
    const {output} = await prompt(input);
    return output!;
  }
);
