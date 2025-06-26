'use server';

import { config } from 'dotenv';
config(); // Ensure .env variables are loaded

import { NextRequest, NextResponse } from 'next/server';
import { extractMessageDetails } from '@/ai/flows/extract-message-details';
import { generateReplyMessage } from '@/ai/flows/generate-reply-message';
import { exportToSheets } from '@/app/actions/export-to-sheets';
import { sendWhatsAppMessage } from '@/services/whatsapp';
import Twilio from 'twilio';

/**
 * This function handles the long-running AI and Sheets operations in the background,
 * allowing the main webhook to respond to Twilio immediately.
 * @param message The incoming message text from the user.
 * @param from The user's WhatsApp number.
 */
async function processMessageInBackground(message: string, from: string) {
  try {
    const updatedBy = 'WhatsApp Bot';
    const source = 'whatsapp';

    console.log('Background Process Started: Extracting message details...');
    // 1. Extract Details from the incoming message.
    const extractedData = await extractMessageDetails({ message });
    console.log('Background Process Step 1 Complete: Details extracted.');

    console.log('Background Process Step 2: Generating reply...');
    // 2. Generate a contextual reply.
    const { replyMessage } = await generateReplyMessage({
      clientName: extractedData.clientName || 'Valued Customer',
      query: extractedData.query,
    });
    console.log('Background Process Step 2 Complete: Reply generated.');

    console.log('Background Process Step 3: Sending WhatsApp reply...');
    // 3. Send the generated reply back to the user via WhatsApp.
    await sendWhatsAppMessage(from, replyMessage);
    console.log('Background Process Step 3 Complete: WhatsApp reply sent.');

    console.log('Background Process Step 4: Exporting to Sheets...');
    // 4. Log the entire interaction to Google Sheets.
    const exportResult = await exportToSheets({
      ...extractedData,
      replyMessage: replyMessage,
      updatedBy: updatedBy,
      source: source,
    });

    // If the export fails, throw an error to be caught and logged.
    if (!exportResult.success) {
      throw new Error(`Google Sheets export failed: ${exportResult.error}`);
    }
    console.log('Background Process Step 4 Complete: Exported to Sheets.');
    console.log('Background Process Finished Successfully.');
  } catch (error) {
    console.error('--- ERROR IN WHATSAPP BACKGROUND PROCESS ---');
    console.error(error);
    console.error('--- END OF ERROR ---');
    // In a production app, you might add more robust error handling here,
    // like sending a notification to an admin or sending an error message to the user.
  }
}

/**
 * This is a simple GET handler for debugging. You can visit this URL in your
 * browser to confirm that your webhook URL is publicly accessible.
 */
export async function GET(request: NextRequest) {
  const instructions = `
    Webhook is running!
    However, this preview URL may not be publicly accessible to Twilio.

    For reliable testing during development, please use ngrok to expose this port.
    1. Install ngrok (if you haven't): open a new terminal and run -> npm install -g ngrok
    2. Run in a new terminal: ngrok http 9002
    3. Copy the public https://... URL provided by ngrok.
    4. Paste that ngrok URL into the Twilio console webhook field, adding /api/whatsapp at the end.
  `;
  return new Response(instructions.trim(), {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

/**
 * This is the webhook endpoint for receiving messages from WhatsApp (via Twilio).
 */
export async function POST(request: NextRequest) {
  console.log('--- WHATSAPP WEBHOOK RECEIVED ---');
  try {
    const body = await request.formData();
    const message = body.get('Body')?.toString();
    const from = body.get('From')?.toString(); // e.g., 'whatsapp:+14155238886'

    console.log('Incoming message from:', from);
    console.log('Message body:', message);

    if (!message || !from) {
      console.error('Webhook Error: Invalid payload. Missing Body or From.');
      return NextResponse.json(
        { error: 'Invalid webhook payload. Missing Body or From.' },
        { status: 400 }
      );
    }

    // "Fire and forget" the background processing. We don't use `await` here
    // so we can respond to Twilio immediately. The function will run on its own.
    processMessageInBackground(message, from);

    console.log('Webhook: Acknowledging receipt to Twilio.');
    // Acknowledge receipt to Twilio right away with an empty TwiML response.
    const twiml = new Twilio.twiml.MessagingResponse();
    return new NextResponse(twiml.toString(), {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    console.error('--- FATAL WHATSAPP WEBHOOK ERROR ---');
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error(error);
    console.error('--- END OF FATAL ERROR ---');
    // Return a generic error to the webhook provider.
    return NextResponse.json(
      { error: 'Internal Server Error', details: errorMessage },
      { status: 500 }
    );
  }
}
