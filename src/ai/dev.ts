import { config } from 'dotenv';
config({ path: '.env.local' });
config();

import '@/ai/flows/detect-hello.ts';
import '@/ai/flows/speech.ts';
