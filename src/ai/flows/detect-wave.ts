'use server';
/**
 * @fileOverview A flow for detecting if a person is waving in an image.
 *
 * - detectWave - A function that analyzes an image to see if a person is waving.
 * - DetectWaveInput - The input type for the detectWave function.
 * - DetectWaveOutput - The return type for the detectWave function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectWaveInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo frame from a video, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type DetectWaveInput = z.infer<typeof DetectWaveInputSchema>;

const DetectWaveOutputSchema = z.object({
  isWaving: z
    .boolean()
    .describe('Whether or not a person is detected waving in the image.'),
});
export type DetectWaveOutput = z.infer<typeof DetectWaveOutputSchema>;

export async function detectWave(
  input: DetectWaveInput
): Promise<DetectWaveOutput> {
  return detectWaveFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectWavePrompt',
  input: {schema: DetectWaveInputSchema},
  output: {schema: DetectWaveOutputSchema},
  prompt: `You are an expert in gesture recognition. Your task is to determine if a person in the image is waving, while ignoring all facial features for privacy.
A wave is defined as a hand raised at or above shoulder level, with fingers likely spread.
Set isWaving to true only if a clear wave gesture is visible.
If no person is visible, or if they are not waving as described, isWaving must be false.
Your analysis should be based solely on body and hand position, not on facial expression or identity.

Analyze this image for a wave gesture: {{media url=photoDataUri}}`,
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

const detectWaveFlow = ai.defineFlow(
  {
    name: 'detectWaveFlow',
    inputSchema: DetectWaveInputSchema,
    outputSchema: DetectWaveOutputSchema,
  },
  async input => {
    // If the data URI is empty, don't call the prompt.
    if (!input.photoDataUri || input.photoDataUri.length < 100) { // Check for a reasonable length
        return { isWaving: false };
    }
    const {output} = await prompt(input);
    return output!;
  }
);
