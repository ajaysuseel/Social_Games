'use server';
/**
 * @fileOverview Flow for generating non-scary animal characters with neutral expressions.
 *
 * - generateCharacter - A function that generates a character based on the specified criteria.
 * - CharacterDesignInput - The input type for the generateCharacter function.
 * - CharacterDesignOutput - The return type for the generateCharacter function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CharacterDesignInputSchema = z.object({
  animalType: z
    .string()
    .describe('The type of animal for the character (e.g., cat, dog, bear).'),
});
export type CharacterDesignInput = z.infer<typeof CharacterDesignInputSchema>;

const CharacterDesignOutputSchema = z.object({
  characterDescription: z
    .string()
    .describe(
      'A detailed description of the non-scary animal character with a neutral expression.'
    ),
  characterImage: z
    .string()
    .describe(
      'A data URI containing the base64 encoded image of the generated character.'
    ),
});
export type CharacterDesignOutput = z.infer<typeof CharacterDesignOutputSchema>;

export async function generateCharacter(
  input: CharacterDesignInput
): Promise<CharacterDesignOutput> {
  return characterDesignFlow(input);
}

const characterDesignPrompt = ai.definePrompt({
  name: 'characterDesignPrompt',
  input: {schema: CharacterDesignInputSchema},
  output: {schema: CharacterDesignOutputSchema},
  prompt: `You are a character designer specializing in creating non-scary animal characters with neutral expressions suitable for children with sensory sensitivities.  Create a description of the character, and then generate an image of the character.

Animal Type: {{{animalType}}}

Character Description:
`, // Ensure a newline here
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

const characterDesignFlow = ai.defineFlow(
  {
    name: 'characterDesignFlow',
    inputSchema: CharacterDesignInputSchema,
    outputSchema: CharacterDesignOutputSchema,
  },
  async input => {
    const {output: characterDescriptionOutput} = await characterDesignPrompt(input);

    // remove null check, `characterDescriptionOutput` is defined by `characterDesignPrompt`
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: [
        {
          text: `Generate an image of ${characterDescriptionOutput?.characterDescription}`,
        },
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'], // MUST provide both TEXT and IMAGE, IMAGE only won't work
      },
    });

    return {
      characterDescription: characterDescriptionOutput!.characterDescription,
      characterImage: media!.url,
    };
  }
);
