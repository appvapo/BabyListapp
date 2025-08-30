import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {dotprompt} from '@genkit-ai/dotprompt';

export const ai = genkit({
  plugins: [googleAI(), dotprompt()],
  model: 'googleai/gemini-2.5-flash',
});
