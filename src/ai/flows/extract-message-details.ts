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
  query: z.string().describe('A brief summary of the client\'s query or request.'),
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
  prompt: `You are an expert at extracting information from messages.

  Analyze the following message and extract the client's name, phone number, their query, and the full message details.
  - The phone number can be in various formats, such as (555) 123-4567, 555-123-4567, or +15551234567. Look for any sequence of numbers that resembles a phone number.
  - If some information is not available, leave that field as an empty string.
  - The "query" field should be a concise summary of the client's request.
  - The "messageDetails" field should be the full, original message content.
  
  Message: {{{message}}}
  
  Output in JSON format.`,
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
