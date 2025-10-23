'use client';

import { Card, Separator, Button } from '../../';
import { FileText } from 'lucide-react';

interface Document {
  name: string;
  url?: string;
  disabled?: boolean;
}

interface DocumentsSectionProps {
  documents?: Document[];
  disabledMessage?: string;
}

/**
 * Documents Section Component
 *
 * Displays invoice-related documents with download/view functionality
 * Reusable across SMB and Investor applications
 */
export function DocumentsSection({
  documents = [
    { name: 'Invoice Document.pdf', disabled: true },
    { name: 'Purchase Order.pdf', disabled: true },
  ],
  disabledMessage = 'Documents will be available after connecting your wallet',
}: DocumentsSectionProps) {
  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-base font-semibold">Documents</h2>
      </div>
      <Separator />
      <div className="space-y-2">
        {documents.map((doc, index) => (
          <Button
            key={index}
            variant="outline"
            className="w-full justify-start gap-2"
            disabled={doc.disabled}
            onClick={() => doc.url && window.open(doc.url, '_blank')}
          >
            <FileText className="h-4 w-4" />
            {doc.name}
          </Button>
        ))}
        {documents.some((doc) => doc.disabled) && (
          <p className="text-xs text-muted-foreground mt-2">
            {disabledMessage}
          </p>
        )}
      </div>
    </Card>
  );
}
