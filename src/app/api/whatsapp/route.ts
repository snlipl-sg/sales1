'use server';

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

    // 1. Extract Details from the incoming message.
    const extractedData = await extractMessageDetails({ message });

    // 2. Generate a contextual reply.
    const { replyMessage } = await generateReplyMessage({
      clientName: extractedData.clientName || 'Valued Customer',
      query: extractedData.query,
    });

    // 3. Send the generated reply back to the user via WhatsApp.
    await sendWhatsAppMessage(from, replyMessage);

    // 4. Log the entire interaction to Google Sheets.
    await exportToSheets({
      ...extractedData,
      replyMessage: replyMessage,
      updatedBy: updatedBy,
      source: source,
    });
  } catch (error) {
    console.error('Error during background processing of WhatsApp message:', error);
    // In a production app, you might add more robust error handling here,
    // like sending a notification to an admin.
  }
}

/**
 * This is the webhook endpoint for receiving messages from WhatsApp (via Twilio).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.formData();
    const message = body.get('Body')?.toString();
    const from = body.get('From')?.toString(); // e.g., 'whatsapp:+14155238886'

    if (!message || !from) {
      return NextResponse.json(
        { error: 'Invalid webhook payload. Missing Body or From.' },
        { status: 400 }
      );
    }

    // "Fire and forget" the background processing. We don't use `await` here
    // so we can respond to Twilio immediately. The function will run on its own.
    processMessageInBackground(message, from);

    // Acknowledge receipt to Twilio right away with an empty TwiML response.
    const twiml = new Twilio.twiml.MessagingResponse();
    return new NextResponse(twiml.toString(), {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    // Return a generic error to the webhook provider.
    return NextResponse.json(
      { error: 'Internal Server Error', details: errorMessage },
      { status: 500 }
    );
  }
}
