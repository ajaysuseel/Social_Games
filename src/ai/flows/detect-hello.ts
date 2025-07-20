'use server';
/**
 * @fileOverview A flow for detecting if a person is saying "hello" in an audio clip.
 *
 * - detectHello - A function that analyzes an audio clip to see if "hello" is said.
 * - DetectHelloInput - The input type for the detectHello function.
 * - DetectHelloOutput - The return type for the detectHello function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectHelloInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "An audio clip, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type DetectHelloInput = z.infer<typeof DetectHelloInputSchema>;

const DetectHelloOutputSchema = z.object({
  saidHello: z
    .boolean()
    .describe('Whether or not the word "hello" was detected in the audio.'),
});
export type DetectHelloOutput = z.infer<typeof DetectHelloOutputSchema>;

export async function detectHello(
  input: DetectHelloInput
): Promise<DetectHelloOutput> {
  return detectHelloFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectHelloPrompt',
  input: {schema: DetectHelloInputSchema},
  output: {schema: DetectHelloOutputSchema},
  prompt: `You are an expert in voice activity detection. Your task is to determine if the word "hello" is spoken in the provided audio clip.
The word must be clearly audible. Ignore other sounds or words.
Set saidHello to true only if "hello" is detected. Otherwise, set it to false.

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

const detectHelloFlow = ai.defineFlow(
  {
    name: 'detectHelloFlow',
    inputSchema: DetectHelloInputSchema,
    outputSchema: DetectHelloOutputSchema,
  },
  async input => {
    // If the data URI is empty, don't call the prompt.
    if (!input.audioDataUri || input.audioDataUri.length < 100) { // Check for a reasonable length
        return { saidHello: false };
    }
    const {output} = await prompt(input);
    return output!;
  }
);
