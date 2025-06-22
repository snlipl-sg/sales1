'use server';

import { google } from 'googleapis';
import type { ExtractMessageDetailsOutput } from '@/ai/flows/extract-message-details';

interface ExportData extends ExtractMessageDetailsOutput {
  replyMessage: string;
  updatedBy: string;
}

export async function exportToSheets(data: ExportData) {
  try {
    const client_email = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
    const private_key = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(
      /\\n/g,
      '\n'
    );
    const sheet_id = process.env.GOOGLE_SHEET_ID;
    const sheet_name = process.env.GOOGLE_SHEET_NAME;

    if (!client_email || !private_key || !sheet_id || !sheet_name) {
      throw new Error(
        'Google Sheets API environment variables are not configured.'
      );
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email,
        private_key,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const newRow = [
      new Date().toISOString(),
      data.updatedBy,
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
    console.error('Error exporting to Google Sheets:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, error: `Failed to export to Google Sheets. ${errorMessage}` };
  }
}
