
'use client';

import { useState } from 'react';
import type { ExtractMessageDetailsOutput } from '@/ai/flows/extract-message-details';
import { extractMessageDetails } from '@/ai/flows/extract-message-details';
import { generateReplyMessage } from '@/ai/flows/generate-reply-message';
import { exportToSheets } from '@/app/actions/export-to-sheets';

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
  Mail,
  Calendar,
  Globe,
  Pencil,
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Home() {
  const [message, setMessage] = useState(
    '[22/06/25, 10:42:55 AM] Suchanshu: Hi Sudhanshu, How are you doing?\nI have a potential buyer for one of your dehydrated Fruits/vegetables machine.\n[22/06/25, 10:42:55 AM] Suchanshu: Can you share details about the machine?\n[22/06/25, 10:42:58 AM] Suchanshu: I will scope it out'
  );
  const [extractedData, setExtractedData] =
    useState<ExtractMessageDetailsOutput | null>({
        clientName: 'Aakash',
        phoneNumber: '',
        query: 'A potential buyer is interested in the dehydrated fruits/vegetables machine and is requesting details about the machine.',
        messageDetails: '[22/06/25, 10:42:55 AM] Suchanshu: Hi Sudhanshu, How are you doing?\nI have a potential buyer for one of your dehydrated Fruits/vegetables machine.\n[22/06/25, 10:42:55 AM] Suchanshu: Can you share details about the machine?\n[22/06/25, 10:42:58 AM] Suchanshu: I will scope it out',
    });
  const [generatedReply, setGeneratedReply] = useState(
    "Dear Ankush, Thank you for your message. Duly noted. Sudhanshu, is this still available as the dehydrated Fruits/Vegetables machine. Please provide the details to verify if it suits requirements of the new buyer. If it is available, please advise what is the best deal we can offer for Sudhanshu's reference. We look forward to hearing from you and a closing a further"
  );
  const [updatedBy, setUpdatedBy] = useState('Sudhanshu');
  const [source, setSource] = useState('whatsapp');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showIssue, setShowIssue] = useState(false);
  const { toast } = useToast();
  const [exportError, setExportError] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

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
    setExportError(null);
    setAiError(null);
    setShowIssue(false);
    try {
      const result = await extractMessageDetails({ message });
      setExtractedData(result);
      toast({
        title: 'Success',
        description: 'Message details extracted successfully.',
      });
    } catch (error) {
      console.error('Extraction failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      let displayMessage = 'The AI could not process the message. Please try again.';
      if (errorMessage.toLowerCase().includes('api key')) {
        displayMessage = 'Your Gemini API key is missing or invalid. Please check your .env configuration.';
      }
      setAiError(displayMessage);
      setShowIssue(true);
      toast({
        variant: 'destructive',
        title: 'Extraction Failed',
        description: displayMessage,
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleGenerateReply = async () => {
    if (!extractedData) return;
    setIsGenerating(true);
    setGeneratedReply('');
    setExportError(null);
    setAiError(null);
    setShowIssue(false);
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
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      let displayMessage = 'The AI could not generate a reply. Please try again.';
      if (errorMessage.toLowerCase().includes('api key')) {
        displayMessage = 'Your Gemini API key is missing or invalid. Please check your .env configuration.';
      }
      setAiError(displayMessage);
      setShowIssue(true);
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: displayMessage,
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleExportToSheets = async () => {
    setExportError(null);
    setAiError(null);
    setShowIssue(false);
    if (!extractedData || !generatedReply || !updatedBy.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please provide a name in the "Updated By" field before exporting.',
      });
      return;
    }

    setIsExporting(true);
    try {
      const exportData = {
        ...extractedData,
        replyMessage: generatedReply,
        updatedBy: updatedBy,
        source: source,
      };
      const result = await exportToSheets(exportData);

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Data successfully exported to Google Sheets.',
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Export failed:', error);
      const message = error instanceof Error ? error.message : 'An unknown error occurred. Make sure your environment variables are set up correctly.';
      setExportError(message);
      setShowIssue(true);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDataChange = (
    field: keyof ExtractMessageDetailsOutput,
    value: string
  ) => {
    setExportError(null);
    setAiError(null);
    setShowIssue(false);
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
              onChange={(e) => {
                setMessage(e.target.value)
                setExportError(null)
                setAiError(null)
                setShowIssue(false)
              }}
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
                    <Label htmlFor="clientName" className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" />Client Name <Pencil className="h-3 w-3 text-muted-foreground/70" /></Label>
                    <Popover open={!!exportError}>
                      <PopoverTrigger asChild>
                        <Input
                          id="clientName"
                          value={extractedData.clientName}
                          onChange={(e) =>
                            handleDataChange('clientName', e.target.value)
                          }
                          placeholder="e.g., John Doe"
                        />
                      </PopoverTrigger>
                      <PopoverContent side="right" align="start" className="bg-destructive text-destructive-foreground border-none shadow-lg w-auto p-4">
                        <div className="flex flex-col gap-1">
                          <p className="font-semibold">Export Failed</p>
                          <p className="text-sm text-destructive-foreground/90">{exportError}</p>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />Phone Number <Pencil className="h-3 w-3 text-muted-foreground/70" /></Label>
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
                    <Label htmlFor="source" className="flex items-center gap-2"><Globe className="h-4 w-4 text-muted-foreground" />Source</Label>
                    <Select value={source} onValueChange={(value) => {
                        setSource(value);
                        setExportError(null);
                        setAiError(null);
                        setShowIssue(false);
                    }}>
                      <SelectTrigger id="source">
                        <SelectValue placeholder="Select a source" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="whatsapp">WhatsApp</SelectItem>
                          <SelectItem value="phone">Phone</SelectItem>
                          <SelectItem value="mail">Mail</SelectItem>
                          <SelectItem value="events">Events</SelectItem>
                          <SelectItem value="website">Website</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="query" className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" />Query <Pencil className="h-3 w-3 text-muted-foreground/70" /></Label>
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
                    <CardContent className="space-y-4">
                        {isGenerating ? (
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                            </div>
                        ) : (
                            <>
                              <Textarea
                                  value={generatedReply}
                                  onChange={(e) => {
                                    setGeneratedReply(e.target.value)
                                    setExportError(null)
                                    setAiError(null)
                                    setShowIssue(false)
                                  }}
                                  rows={6}
                                  placeholder="Generated reply will appear here..."
                                  className="resize-none"
                              />
                              <div className="space-y-2">
                                <Label htmlFor="updatedBy" className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" />Updated By <Pencil className="h-3 w-3 text-muted-foreground/70" /></Label>
                                <Input
                                  id="updatedBy"
                                  value={updatedBy}
                                  onChange={(e) => {
                                    setUpdatedBy(e.target.value)
                                    setExportError(null)
                                    setAiError(null)
                                    setShowIssue(false)
                                  }}
                                  placeholder="Your Name"
                                  disabled={isExporting}
                                />
                              </div>
                            </>
                        )}
                    </CardContent>
                    <CardFooter className="justify-between">
                        <Button
                            variant="outline"
                            onClick={() => copyToClipboard(generatedReply, 'Reply')}
                            disabled={!generatedReply || isGenerating || isExporting}
                        >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Reply
                        </Button>
                        <Button 
                            onClick={handleExportToSheets} 
                            disabled={!generatedReply || isGenerating || isExporting || !updatedBy.trim()}
                        >
                            {isExporting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <FileUp className="mr-2 h-4 w-4"/>
                            )}
                            Export to Sheets
                        </Button>
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
      {showIssue && (
        <div className="fixed bottom-4 left-4 z-50">
          <Popover open={showIssue} onOpenChange={setShowIssue}>
            <PopoverTrigger asChild>
              <button className="flex items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-lg animate-in fade-in-0 slide-in-from-bottom-10 duration-500 px-3 py-1.5 text-sm font-medium">
                <div className="w-2 h-2 bg-white/80 rounded-full mr-2" />
                <span>1 Issue</span>
              </button>
            </PopoverTrigger>
            <PopoverContent side="top" align="start" className="w-auto p-2 mb-2">
               <div className="flex justify-between items-center text-sm font-medium">
                    <div>Issues</div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-destructive rounded-full" />
                        <span>1</span>
                    </div>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{aiError || 'The AI failed to process your request.'}</p>
          </PopoverContent>
          </Popover>
        </div>
      )}
    </main>
  );
}
