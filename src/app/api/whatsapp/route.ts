'use server';

import { NextRequest, NextResponse } from 'next/server';
import { extractMessageDetails } from '@/ai/flows/extract-message-details';
import { generateReplyMessage } from '@/ai/flows/generate-reply-message';
import { exportToSheets } from '@/app/actions/export-to-sheets';
import { sendWhatsAppMessage } from '@/services/whatsapp';
import Twilio from 'twilio';

/**
 * This is the webhook endpoint for receiving messages from WhatsApp (via Twilio).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.formData();
    const message = body.get('Body')?.toString();
    const from = body.get('From')?.toString(); // e.g., 'whatsapp:+14155238886'
    const to = body.get('To')?.toString(); // e.g., 'whatsapp:+1...'

    if (!message || !from || !to) {
      return NextResponse.json(
        { error: 'Invalid webhook payload. Missing Body, From, or To.' },
        { status: 400 }
      );
    }

    // Since this is an automated process, we'll use a standard name for the updater.
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

    // Twilio expects a TwiML response or an empty 200/204 to acknowledge receipt.
    // Since we're sending the reply asynchronously via the API, we send back an empty response.
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
