'use server';
/**
 * @fileOverview A flow for generating speech from text.
 *
 * - generateSpeech - A function that converts text to speech.
 * - SpeechInput - The input type for the generateSpeech function.
 * - SpeechOutput - The return type for the generateSpeech function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';

const SpeechInputSchema = z.object({
  text: z.string().describe('The text to be converted to speech.'),
});
export type SpeechInput = z.infer<typeof SpeechInputSchema>;

const SpeechOutputSchema = z.object({
  audioUrl: z
    .string()
    .describe('The generated speech as a data URI in WAV format.'),
});
export type SpeechOutput = z.infer<typeof SpeechOutputSchema>;

export async function generateSpeech(
  input: SpeechInput
): Promise<SpeechOutput> {
  return speechFlow(input);
}

const speechFlow = ai.defineFlow(
  {
    name: 'speechFlow',
    inputSchema: SpeechInputSchema,
    outputSchema: SpeechOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            // A soft, friendly, and calming female voice
            prebuiltVoiceConfig: {voiceName: 'vindemiatrix'}, 
          },
        },
      },
      // Instruct the model on the delivery style for a softer tone.
      prompt: `<speak>
        <prosody rate="slow" pitch="-2st">
          ${input.text}
        </prosody>
      </speak>`,
    });

    if (!media) {
      throw new Error('No media returned from TTS model');
    }
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );

    const wavData = await toWav(audioBuffer);
    
    return {
      audioUrl: `data:audio/wav;base64,${wavData}`,
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

    const bufs: Buffer[] = [];
    writer.on('error', reject);
    writer.on('data', function (d: Buffer) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}
