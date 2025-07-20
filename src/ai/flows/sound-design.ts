'use server';

/**
 * @fileOverview Generates calming sounds for correct responses in games, ensuring frequencies are under 500Hz.
 *
 * - generateCalmingSound - A function that generates a calming sound for positive reinforcement.
 * - CalmingSoundInput - The input type for the generateCalmingSound function.
 * - CalmingSoundOutput - The return type for the generateCalmingSound function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';

const CalmingSoundInputSchema = z.object({
  theme: z
    .string()
    .describe('The theme of the game, such as space, ocean, or farm.'),
  activity:
    z.string().describe('The activity for which the sound is being generated.'),
});

export type CalmingSoundInput = z.infer<typeof CalmingSoundInputSchema>;

const CalmingSoundOutputSchema = z.object({
  media: z
    .string()
    .describe(
      'The calming sound as a data URI in WAV format, ensuring frequencies are under 500Hz.'
    ),
});

export type CalmingSoundOutput = z.infer<typeof CalmingSoundOutputSchema>;

export async function generateCalmingSound(
  input: CalmingSoundInput
): Promise<CalmingSoundOutput> {
  return calmingSoundFlow(input);
}

const calmingSoundPrompt = ai.definePrompt({
  name: 'calmingSoundPrompt',
  input: {schema: CalmingSoundInputSchema},
  output: {schema: CalmingSoundOutputSchema},
  prompt: `You are an AI sound designer specializing in creating calming sounds for children's games.

  Generate a sound that is appropriate for the theme: {{{theme}}} and activity: {{{activity}}}.
  The sound must be calming and not overwhelming. Ensure that the frequencies are under 500Hz to avoid sensory overload.
  The sound should be short and suitable as a reward for a correct response.
  The sound should have a major tonality to provide positive feedback.
  Do not use any speech in the generated sound.  Focus on instrumental sounds such as wind chimes, piano, harp, or flute.

  Output ONLY the text to be passed to the text-to-speech model.
  Do not add any formatting such as quotation marks.

  Example 1:
  Theme: Ocean
  Activity: Matching pairs of fish
  Output: A gentle bubbling sound followed by a soft chime

  Example 2:
  Theme: Farm
  Activity: Feeding the animals
  Output: A quiet cow bell followed by a pleasant flute note
  `,
});

const calmingSoundFlow = ai.defineFlow(
  {
    name: 'calmingSoundFlow',
    inputSchema: CalmingSoundInputSchema,
    outputSchema: CalmingSoundOutputSchema,
  },
  async input => {
    const {text} = await calmingSoundPrompt(input);

    const {media} = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {voiceName: 'Algenib'},
          },
        },
      },
      prompt: text!,
    });

    if (!media) {
      throw new Error('no media returned');
    }
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );

    return {
      media: 'data:audio/wav;base64,' + (await toWav(audioBuffer)),
    };
  }
);

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs = [] as any[];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}
