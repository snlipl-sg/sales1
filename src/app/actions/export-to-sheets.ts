'use server';

import { google } from 'googleapis';
import type { ExtractMessageDetailsOutput } from '@/ai/flows/extract-message-details';

interface ExportData extends ExtractMessageDetailsOutput {
  replyMessage: string;
  updatedBy: string;
  source: string;
}

export async function exportToSheets(data: ExportData) {
  try {
    const client_email = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
    const private_key = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
    const sheet_id = process.env.GOOGLE_SHEET_ID;
    const sheet_name = process.env.GOOGLE_SHEET_NAME;

    if (!client_email) {
      throw new Error('GOOGLE_SHEETS_CLIENT_EMAIL is not configured.');
    }
    if (!private_key) {
      throw new Error('GOOGLE_SHEETS_PRIVATE_KEY is not configured.');
    }
    if (!sheet_id) {
      throw new Error('GOOGLE_SHEET_ID is not configured.');
    }
    if (!sheet_name) {
      throw new Error('GOOGLE_SHEET_NAME is not configured.');
    }

    // The private key from the .env file might have literal "\\n" instead of newlines.
    // This reformats the key to ensure it is parsed correctly.
    const formatted_private_key = private_key.replace(/\\n/g, '\n');

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email,
        private_key: formatted_private_key,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const newRow = [
      new Date().toISOString(),
      data.updatedBy,
      data.source,
      data.clientName,
      data.phoneNumber,
      data.query,
      data.replyMessage,
    ];

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: sheet_id,
      range: `${sheet_name}!A1`, // Appends after the last row in the sheet
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [newRow],
      },
    });

    return { success: true, data: response.data };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';

    // Check for the specific decoder error and provide a more helpful message.
    if (errorMessage.includes('DECODER routines::unsupported')) {
      return {
        success: false,
        error:
          'The Google Sheets private key is not formatted correctly. Please ensure it is copied exactly as provided from your Google Cloud service account, including the "-----BEGIN PRIVATE KEY-----" and "-----END PRIVATE KEY-----" lines. The newlines (\\n) must be preserved.',
      };
    }

    console.error('Error exporting to Google Sheets:', error);
    return { success: false, error: `Failed to export to Google Sheets. ${errorMessage}` };
  }
}
