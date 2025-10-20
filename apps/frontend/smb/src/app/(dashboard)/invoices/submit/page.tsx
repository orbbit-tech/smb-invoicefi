'use client';

import { useState } from 'react';
import { Button } from '@ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui';
import { Input } from '@ui';
import { Label } from '@ui';
import { Textarea } from '@ui';
import { Alert, AlertDescription } from '@ui';
import { Separator } from '@ui';
import { DatePickerWithInput } from '@ui';
import { CircleCheck, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface InvoiceFormData {
  invoiceNumber: string;
  amount: string;
  dueDate: Date | undefined;
  payerName: string;
  payerIndustry: string;
  description: string;
}

export default function SubmitInvoicePage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<InvoiceFormData>({
    invoiceNumber: '',
    amount: '',
    dueDate: undefined,
    payerName: '',
    payerIndustry: '',
    description: '',
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof InvoiceFormData, string>>
  >({});

  const handleChange = (
    field: keyof InvoiceFormData,
    value: string | Date | undefined
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateStep1 = (): boolean => {
    const newErrors: Partial<Record<keyof InvoiceFormData, string>> = {};

    if (!formData.invoiceNumber.trim()) {
      newErrors.invoiceNumber = 'Invoice number is required';
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }
    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
      const dueDate = new Date(formData.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      if (dueDate <= today) {
        newErrors.dueDate = 'Due date must be in the future';
      }
    }
    if (!formData.payerName.trim()) {
      newErrors.payerName = 'Payer name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsSubmitting(false);

    // Show success step
    setStep(3);
  };

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const handleSubmitAnother = () => {
    setFormData({
      invoiceNumber: '',
      amount: '',
      dueDate: undefined,
      payerName: '',
      payerIndustry: '',
      description: '',
    });
    setStep(1);
  };

  const handleViewInvoices = () => {
    router.push('/invoices');
  };

  return (
    <div className="py-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/invoices">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Submit Invoice</h1>
        <p className="text-muted-foreground mt-1">
          Get funded in under 24 hours. Receive 80% of your invoice value.
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8 flex items-center justify-center gap-2">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
              step >= 1
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            1
          </div>
          <span className={step >= 1 ? 'font-medium' : 'text-muted-foreground'}>
            Invoice Details
          </span>
        </div>
        <div className="w-12 h-px bg-border" />
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
              step >= 2
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            2
          </div>
          <span className={step >= 2 ? 'font-medium' : 'text-muted-foreground'}>
            Review & Submit
          </span>
        </div>
        <div className="w-12 h-px bg-border" />
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
              step >= 3
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            3
          </div>
          <span className={step >= 3 ? 'font-medium' : 'text-muted-foreground'}>
            Success
          </span>
        </div>
      </div>

      {/* Form */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
            <CardDescription>
              Enter the details of your invoice to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 col-span-1 sm:col-span-2">
                <Label htmlFor="invoiceNumber">
                  Invoice Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="invoiceNumber"
                  placeholder="e.g., INV-2024-001"
                  value={formData.invoiceNumber}
                  onChange={(e) =>
                    handleChange('invoiceNumber', e.target.value)
                  }
                  className={errors.invoiceNumber ? 'border-destructive' : ''}
                />
                {errors.invoiceNumber && (
                  <p className="text-sm text-destructive">
                    {errors.invoiceNumber}
                  </p>
                )}
              </div>

              <div className="space-y-2 col-span-1">
                <Label htmlFor="amount">
                  Invoice Amount (USD){' '}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="50000"
                  value={formData.amount}
                  onChange={(e) => handleChange('amount', e.target.value)}
                  className={errors.amount ? 'border-destructive' : ''}
                />
                {errors.amount && (
                  <p className="text-sm text-destructive">{errors.amount}</p>
                )}
                {formData.amount && !errors.amount && (
                  <p className="text-sm text-muted-foreground">
                    You will receive around{' '}
                    <span className="font-semibold">
                      {formatCurrency(
                        (parseFloat(formData.amount) * 0.8).toString()
                      )}
                    </span>{' '}
                    (80% of invoice value)
                  </p>
                )}
              </div>

              <div className="space-y-2 col-span-1">
                <Label htmlFor="dueDate">
                  Due Date <span className="text-destructive">*</span>
                </Label>
                <DatePickerWithInput
                  id="dueDate"
                  value={formData.dueDate}
                  onChange={(date) => handleChange('dueDate', date)}
                  placeholder="mm/dd/yyyy"
                  className={errors.dueDate ? 'border-destructive' : ''}
                />
                {errors.dueDate && (
                  <p className="text-sm text-destructive">{errors.dueDate}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 col-span-1">
                <Label htmlFor="payerName">
                  Payer Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="payerName"
                  placeholder="e.g., Microsoft Corporation"
                  value={formData.payerName}
                  onChange={(e) => handleChange('payerName', e.target.value)}
                  className={errors.payerName ? 'border-destructive' : ''}
                />
                {errors.payerName && (
                  <p className="text-sm text-destructive">{errors.payerName}</p>
                )}
              </div>

              <div className="space-y-2 col-span-1">
                <Label htmlFor="payerIndustry">Payer Industry (Optional)</Label>
                <Input
                  id="payerIndustry"
                  placeholder="e.g., Technology, SaaS, E-commerce"
                  value={formData.payerIndustry}
                  onChange={(e) =>
                    handleChange('payerIndustry', e.target.value)
                  }
                />
              </div>

              <div className="space-y-2 col-span-1 sm:col-span-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of services or goods provided..."
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleNext} className="font-semibold">
                Next: Review & Submit
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Review Your Invoice</CardTitle>
              <CardDescription>
                Please review the information before submitting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Invoice Number
                  </p>
                  <p className="font-semibold">{formData.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-semibold">
                    {formatCurrency(formData.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="font-semibold">
                    {formData.dueDate?.toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Expected Funding
                  </p>
                  <p className="font-semibold">
                    {formatCurrency(
                      (parseFloat(formData.amount) * 0.8).toString()
                    )}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Payer</p>
                <p className="font-semibold">{formData.payerName}</p>
                {formData.payerIndustry && (
                  <p className="text-sm text-muted-foreground">
                    {formData.payerIndustry}
                  </p>
                )}
              </div>

              {formData.description && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="text-sm">{formData.description}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Alert>
            <CircleCheck className="h-4 w-4" />
            <AlertDescription>
              By submitting this invoice, you agree to our terms and conditions.
              Your invoice will be verified and listed for funding within 24
              hours.
            </AlertDescription>
          </Alert>

          <div className="flex justify-between">
            <Button onClick={handleBack} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Invoice'
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Success */}
      {step === 3 && (
        <div className="space-y-8">
          {/* Success Icon & Message */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center">
                <CircleCheck className="h-12 w-12 text-primary " />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                Invoice Submitted Successfully!
              </h2>
              <p className="text-muted-foreground mt-2">
                Your invoice has been received and is being processed
              </p>
            </div>
          </div>

          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Submission Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Invoice Number
                  </p>
                  <p className="text-lg font-semibold">
                    {formData.invoiceNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Invoice Amount
                  </p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(formData.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Expected Funding
                  </p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(
                      (parseFloat(formData.amount) * 0.8).toString()
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    80% of invoice value
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Due Date</p>
                  <p className="text-lg font-semibold">
                    {formData.dueDate?.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What Happens Next */}
          <Card>
            <CardHeader>
              <CardTitle>What Happens Next?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      1
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold">Invoice Verification</p>
                    <p className="text-sm text-muted-foreground">
                      Our team will verify your invoice details and payer
                      information within the next few hours.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      2
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold">Listing for Funding</p>
                    <p className="text-sm text-muted-foreground">
                      Once verified, your invoice will be listed on our platform
                      for investors to fund.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      3
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold">Receive Funding</p>
                    <p className="text-sm text-muted-foreground">
                      You'll receive 80% of your invoice value (
                      {formatCurrency(
                        (parseFloat(formData.amount) * 0.8).toString()
                      )}
                      ) within 24 hours of verification.
                    </p>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertDescription className="text-sm">
                  We'll keep you updated via email at every step. You can also
                  track your invoice status in the invoices dashboard.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleViewInvoices}
              size="lg"
              className="font-semibold"
            >
              View My Invoices
            </Button>
            <Button
              onClick={handleSubmitAnother}
              variant="outline"
              size="lg"
              className="font-semibold"
            >
              Submit Another Invoice
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
