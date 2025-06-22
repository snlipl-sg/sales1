'use server';

/**
 * @fileOverview AI flow to generate a draft reply message based on the extracted client query.
 *
 * - generateReplyMessage - A function that handles the generation of reply message.
 * - GenerateReplyMessageInput - The input type for the generateReplyMessage function.
 * - GenerateReplyMessageOutput - The return type for the generateReplyMessage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateReplyMessageInputSchema = z.object({
  clientName: z.string().describe('The name of the client.'),
  query: z.string().describe('The client query or message details.'),
});
export type GenerateReplyMessageInput = z.infer<typeof GenerateReplyMessageInputSchema>;

const GenerateReplyMessageOutputSchema = z.object({
  replyMessage: z.string().describe('The generated reply message.'),
});
export type GenerateReplyMessageOutput = z.infer<typeof GenerateReplyMessageOutputSchema>;

export async function generateReplyMessage(input: GenerateReplyMessageInput): Promise<GenerateReplyMessageOutput> {
  return generateReplyMessageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateReplyMessagePrompt',
  input: {schema: GenerateReplyMessageInputSchema},
  output: {schema: GenerateReplyMessageOutputSchema},
  prompt: `You are an AI assistant specialized in generating reply messages for customer inquiries.

  Based on the following client information and query, generate a draft reply message.

  Client Name: {{{clientName}}}
  Query: {{{query}}}

  Reply Message:`, // The AI should complete this
});

const generateReplyMessageFlow = ai.defineFlow(
  {
    name: 'generateReplyMessageFlow',
    inputSchema: GenerateReplyMessageInputSchema,
    outputSchema: GenerateReplyMessageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
