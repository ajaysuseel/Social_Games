'use server';
/**
 * @fileOverview Flow for generating non-scary animal characters with neutral expressions.
 *
 * - generateCharacter - A function that generates a character based on the specified criteria.
 * - generateCharacterVideo - A function that generates a video of a character waving.
 * - CharacterDesignInput - The input type for the generateCharacter function.
 * - CharacterDesignOutput - The return type for the generateCharacter function.
 * - CharacterVideoOutput - The return type for the generateCharacterVideo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

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

const CharacterVideoOutputSchema = z.object({
  videoUrl: z.string().describe('A data URI of the generated video.'),
});
export type CharacterVideoOutput = z.infer<typeof CharacterVideoOutputSchema>;


export async function generateCharacter(
  input: CharacterDesignInput
): Promise<CharacterDesignOutput> {
  return characterDesignFlow(input);
}

export async function generateCharacterVideo(
  input: CharacterDesignInput
): Promise<CharacterVideoOutput> {
  return characterVideoFlow(input);
}


const characterDesignPrompt = ai.definePrompt({
  name: 'characterDesignPrompt',
  input: {schema: CharacterDesignInputSchema},
  output: {schema: CharacterDesignOutputSchema},
  prompt: `You are a character designer specializing in creating non-scary, cute, cartoonish animal characters with neutral expressions suitable for children with sensory sensitivities.  Create a description of the character, and then generate an image of the character.

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


const characterVideoFlow = ai.defineFlow(
  {
    name: 'characterVideoFlow',
    inputSchema: CharacterDesignInputSchema,
    outputSchema: CharacterVideoOutputSchema,
  },
  async input => {
    let { operation } = await ai.generate({
      model: googleAI.model('veo-2.0-generate-001'),
      prompt: `A friendly, cartoonish ${input.animalType} waving at the camera with a neutral, happy expression. Simple, uncluttered background.`,
      config: {
        durationSeconds: 5,
        aspectRatio: '1:1',
        personGeneration: 'dont_allow',
      },
    });

    if (!operation) {
      throw new Error('Expected the model to return an operation');
    }

    // Wait until the operation completes.
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.checkOperation(operation);
    }

    if (operation.error) {
      throw new Error(`failed to generate video: ${operation.error.message}`);
    }

    const videoPart = operation.output?.message?.content.find(p => p.media);
    if (!videoPart || !videoPart.media) {
      throw new Error('Failed to find the generated video in the operation result');
    }

    const videoUrl = videoPart.media.url;

    // The URL from Veo is temporary and needs an API key to be accessed.
    // We will fetch it and convert to a base64 data URI to send to the client.
    const fetch = (await import('node-fetch')).default;
    const videoDownloadResponse = await fetch(
      `${videoUrl}&key=${process.env.GEMINI_API_KEY}`
    );

    if (!videoDownloadResponse.ok || !videoDownloadResponse.body) {
      throw new Error(`Failed to download video from ${videoUrl}. Status: ${videoDownloadResponse.status}`);
    }
    
    const videoBuffer = await videoDownloadResponse.arrayBuffer();
    const base64Video = Buffer.from(videoBuffer).toString('base64');
    
    return {
      videoUrl: `data:video/mp4;base64,${base64Video}`,
    };
  }
);
