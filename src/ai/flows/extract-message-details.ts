'use server';

/**
 * @fileOverview An AI agent for extracting key details from a message.
 *
 * - extractMessageDetails - A function that handles the message detail extraction process.
 * - ExtractMessageDetailsInput - The input type for the extractMessageDetails function.
 * - ExtractMessageDetailsOutput - The return type for the extractMessageDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractMessageDetailsInputSchema = z.object({
  message: z.string().describe('The message content to extract details from.'),
});
export type ExtractMessageDetailsInput = z.infer<typeof ExtractMessageDetailsInputSchema>;

const ExtractMessageDetailsOutputSchema = z.object({
  clientName: z.string().describe('The name of the client, if available.'),
  phoneNumber: z.string().describe('The phone number of the client, if available.'),
  query: z.string().describe("A brief summary of the client's query or request."),
  messageDetails: z.string().describe('The full content of the message.'),
});
export type ExtractMessageDetailsOutput = z.infer<typeof ExtractMessageDetailsOutputSchema>;

export async function extractMessageDetails(input: ExtractMessageDetailsInput): Promise<ExtractMessageDetailsOutput> {
  return extractMessageDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractMessageDetailsPrompt',
  input: {schema: ExtractMessageDetailsInputSchema},
  output: {schema: ExtractMessageDetailsOutputSchema},
  prompt: `You are a highly capable AI assistant designed to extract structured information from unstructured text.
Carefully analyze the following message and extract the required fields.

- clientName: Extract the full name of the person. If no name is mentioned, leave it as an empty string.
- phoneNumber: Identify any phone number in the message. Sanitize it to a standard format if possible, but extract it as it appears if unsure. If no phone number is found, leave it as an empty string.
- query: Provide a concise, one-sentence summary of the user's main question or request.
- messageDetails: Return the complete, verbatim original message.

Message to analyze:
---
{{{message}}}
---
`,
});

const extractMessageDetailsFlow = ai.defineFlow(
  {
    name: 'extractMessageDetailsFlow',
    inputSchema: ExtractMessageDetailsInputSchema,
    outputSchema: ExtractMessageDetailsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
