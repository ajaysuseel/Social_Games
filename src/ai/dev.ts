import { config } from 'dotenv';
config({ path: '.env.local' });
config();

import '@/ai/flows/character-design.ts';
import '@/ai/flows/sound-design.ts';
import '@/ai/flows/detect-hello.ts';
import '@/ai/flows/speech.ts';
