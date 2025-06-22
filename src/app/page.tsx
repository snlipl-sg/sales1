'use client';

import { useState } from 'react';
import type { ExtractMessageDetailsOutput } from '@/ai/flows/extract-message-details';
import { extractMessageDetails } from '@/ai/flows/extract-message-details';
import { generateReplyMessage } from '@/ai/flows/generate-reply-message';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Sparkles,
  Clipboard,
  Copy,
  FileUp,
  Info,
  Bot,
  User,
  Phone,
  FileText,
  MessageSquare,
} from 'lucide-react';

const GoogleSheetsExportInfo = () => (
  <DialogContent className="sm:max-w-[625px]">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <FileUp className="h-5 w-5" />
        Exporting to Google Sheets
      </DialogTitle>
      <DialogDescription>
        Follow these steps to export your data and learn about automation.
      </DialogDescription>
    </DialogHeader>
    <div className="grid gap-4 py-4 text-sm">
      <div className="space-y-2">
        <h3 className="font-semibold">Method 1: Manual Copy & Paste</h3>
        <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
          <li>
            Open your Google Sheet.
          </li>
          <li>
            Copy the extracted data (Client Name, Phone, Query) and the finalized reply.
          </li>
          <li>
            Paste the data into the appropriate columns in your sheet.
          </li>
        </ol>
      </div>
      <div className="space-y-2">
        <h3 className="font-semibold">Method 2: Programmatic Appending (for developers)</h3>
        <p className="text-muted-foreground">
          For future scalability, you can automate this process using the Google Sheets API.
          This requires some development setup but eliminates manual data entry.
        </p>
        <div className="p-4 border rounded-md bg-muted/50 text-muted-foreground space-y-2">
           <h4 className="font-medium text-foreground">High-Level Steps:</h4>
           <ol className="list-decimal list-inside space-y-1">
             <li><strong>Setup Google Cloud Project:</strong> Create a project in the Google Cloud Console.</li>
             <li><strong>Enable Google Sheets API:</strong> Find and enable the Google Sheets API for your project.</li>
             <li><strong>Create Service Account:</strong> Create a service account and download its JSON credentials file. This file securely authenticates your application.</li>
             <li><strong>Share Sheet:</strong> Share your Google Sheet with the service account's email address, giving it "Editor" permissions.</li>
             <li><strong>Install Google API Client:</strong> In your Next.js app, install the `googleapis` library (`npm install googleapis`).</li>
             <li><strong>Write Append Logic:</strong> Use the credentials and the library to write a server-side function that appends data to your specified sheet and range.</li>
           </ol>
        </div>
      </div>
    </div>
  </DialogContent>
);

export default function Home() {
  const [message, setMessage] = useState('');
  const [extractedData, setExtractedData] =
    useState<ExtractMessageDetailsOutput | null>(null);
  const [generatedReply, setGeneratedReply] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleExtract = async () => {
    if (!message.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a message to process.',
      });
      return;
    }
    setIsExtracting(true);
    setExtractedData(null);
    setGeneratedReply('');
    try {
      const result = await extractMessageDetails({ message });
      setExtractedData(result);
      toast({
        title: 'Success',
        description: 'Message details extracted successfully.',
      });
    } catch (error) {
      console.error('Extraction failed:', error);
      toast({
        variant: 'destructive',
        title: 'Extraction Failed',
        description: 'The AI could not process the message. Please try again.',
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleGenerateReply = async () => {
    if (!extractedData) return;
    setIsGenerating(true);
    setGeneratedReply('');
    try {
      const result = await generateReplyMessage({
        clientName: extractedData.clientName || 'Valued Customer',
        query: extractedData.query,
      });
      setGeneratedReply(result.replyMessage);
      toast({
        title: 'Reply Generated',
        description: 'A draft reply has been created for you.',
      });
    } catch (error) {
      console.error('Generation failed:', error);
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: 'The AI could not generate a reply. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDataChange = (
    field: keyof ExtractMessageDetailsOutput,
    value: string
  ) => {
    if (extractedData) {
      setExtractedData({ ...extractedData, [field]: value });
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: 'Copied to Clipboard',
        description: `${type} has been copied.`,
      });
    });
  };

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="flex items-center gap-2">
            <Bot size={32} className="text-primary"/>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
            MessageMaestro
            </h1>
        </div>
        <p className="mt-2 text-lg text-muted-foreground">
          Paste a message, extract details, and generate replies with AI.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Input Column */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="text-primary" />
              1. Input Message
            </CardTitle>
            <CardDescription>
              Copy and paste the message from WhatsApp, Email, or any other source.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="e.g., Hi, this is John Doe from Acme Corp. My number is 555-123-4567. I'd like to inquire about your pricing for the enterprise plan."
              rows={8}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="resize-none"
            />
          </CardContent>
          <CardFooter>
            <Button onClick={handleExtract} disabled={isExtracting || !message}>
              {isExtracting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Process Message
            </Button>
          </CardFooter>
        </Card>

        {/* Output Column */}
        <div className="space-y-8">
          {isExtracting && (
             <Card className="shadow-lg">
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-full mt-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-5 w-4/5" />
                    </div>
                     <div className="flex items-center gap-4">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-5 w-3/5" />
                    </div>
                     <div className="flex items-center gap-4">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-5 w-4/5" />
                    </div>
                </CardContent>
                <CardFooter>
                    <Skeleton className="h-10 w-40" />
                </CardFooter>
            </Card>
          )}

          {!isExtracting && extractedData && (
            <>
              {/* Extracted Details Card */}
              <Card className="shadow-lg animate-in fade-in duration-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="text-primary" />
                    2. Extracted Details
                  </CardTitle>
                  <CardDescription>
                    Review and edit the extracted information. Then, generate a reply.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientName" className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" />Client Name</Label>
                    <Input
                      id="clientName"
                      value={extractedData.clientName}
                      onChange={(e) =>
                        handleDataChange('clientName', e.target.value)
                      }
                      placeholder="e.g., John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      value={extractedData.phoneNumber}
                      onChange={(e) =>
                        handleDataChange('phoneNumber', e.target.value)
                      }
                      placeholder="e.g., 555-123-4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="query" className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" />Query</Label>
                    <Textarea
                      id="query"
                      value={extractedData.query}
                      onChange={(e) =>
                        handleDataChange('query', e.target.value)
                      }
                      placeholder="e.g., Inquiry about enterprise plan pricing"
                      className="resize-none"
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleGenerateReply} disabled={isGenerating}>
                    {isGenerating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Generate Reply
                  </Button>
                </CardFooter>
              </Card>

              {/* Generated Reply Card */}
              {(isGenerating || generatedReply) && (
                 <Card className="shadow-lg animate-in fade-in duration-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bot className="text-primary" />
                            3. Generated Reply
                        </CardTitle>
                        <CardDescription>
                        Review, edit, and copy the AI-generated reply.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isGenerating ? (
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                            </div>
                        ) : (
                            <Textarea
                                value={generatedReply}
                                onChange={(e) => setGeneratedReply(e.target.value)}
                                rows={6}
                                placeholder="Generated reply will appear here..."
                                className="resize-none"
                            />
                        )}
                    </CardContent>
                    <CardFooter className="justify-between">
                        <Button
                            variant="outline"
                            onClick={() => copyToClipboard(generatedReply, 'Reply')}
                            disabled={!generatedReply || isGenerating}
                        >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Reply
                        </Button>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="secondary">
                                    <FileUp className="mr-2 h-4 w-4"/>
                                    Export Guide
                                </Button>
                            </DialogTrigger>
                            <GoogleSheetsExportInfo />
                        </Dialog>
                    </CardFooter>
                 </Card>
              )}
            </>
          )}

           {!isExtracting && !extractedData && (
             <Card className="shadow-lg border-dashed">
                <CardContent className="p-10 text-center">
                    <div className="mx-auto h-12 w-12 text-muted-foreground">
                        <Clipboard size={48} className="mx-auto"/>
                    </div>
                    <p className="mt-4 text-muted-foreground">
                        Your processed data will appear here.
                    </p>
                </CardContent>
            </Card>
           )}
        </div>
      </div>
    </main>
  );
}
