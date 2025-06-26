'use server';

import Twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER; // Your Twilio WhatsApp number

// Initialize the Twilio client if credentials are provided.
const client =
  accountSid && authToken ? Twilio(accountSid, authToken) : null;

if (!client) {
  // This warning will be logged on the server during startup if Twilio is not configured.
  // It allows the rest of the app to function without WhatsApp capabilities.
  console.warn(
    'Twilio credentials are not fully configured in .env file. WhatsApp functionality will be disabled.'
  );
}

/**
 * Sends a message to a specified WhatsApp number.
 * @param to The recipient's WhatsApp number in the format 'whatsapp:+1...'.
 * @param body The text content of the message to send.
 * @throws An error if Twilio is not configured or if the message fails to send.
 */
export async function sendWhatsAppMessage(
  to: string,
  body: string
): Promise<void> {
  if (!client || !fromNumber) {
    throw new Error(
      'Twilio is not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_NUMBER in your .env file.'
    );
  }

  try {
    await client.messages.create({
      from: fromNumber,
      body: body,
      to: to,
    });
    console.log(`WhatsApp message sent successfully to ${to}`);
  } catch (error) {
    console.error(`Failed to send WhatsApp message to ${to}:`, error);
    // Re-throw a more user-friendly error to the calling function.
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to send WhatsApp message via Twilio: ${errorMessage}`);
  }
}
