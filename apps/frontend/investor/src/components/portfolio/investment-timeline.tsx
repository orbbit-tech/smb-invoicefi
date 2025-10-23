'use client';

import { Card, Separator, Badge } from '@ui';
import { CheckCircle2, Circle } from 'lucide-react';

interface TimelineEvent {
  date: string;
  label: string;
  status: 'completed' | 'pending' | 'upcoming';
}

interface InvestmentTimelineProps {
  fundingDate: string;
  dueDate: string;
  settlementDate?: string;
  status: 'active' | 'funded' | 'repaid';
}

/**
 * Investment Timeline Component
 *
 * Displays the investment lifecycle with key milestones
 */
export function InvestmentTimeline({
  fundingDate,
  dueDate,
  settlementDate,
  status,
}: InvestmentTimelineProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const events: TimelineEvent[] = [
    {
      date: fundingDate,
      label: 'Investment Funded',
      status: 'completed',
    },
    {
      date: dueDate,
      label: 'Payment Due',
      status: status === 'repaid' ? 'completed' : 'upcoming',
    },
  ];

  if (settlementDate) {
    events.push({
      date: settlementDate,
      label: 'Payment Settled',
      status: 'completed',
    });
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">Investment Timeline</h2>
      </div>
      <Separator />

      <div className="space-y-2">
        {events.map((event, index) => (
          <div key={index} className="flex gap-4">
            {/* Timeline indicator */}
            <div className="flex flex-col items-center">
              <div className="relative">
                {event.status === 'completed' ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                ) : event.status === 'pending' ? (
                  <Circle className="h-5 w-5 text-primary animate-pulse" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              {index < events.length - 1 && (
                <div
                  className={`w-0.5 h-6 mt-2 ${
                    event.status === 'completed'
                      ? 'bg-primary'
                      : 'bg-muted-foreground/20'
                  }`}
                />
              )}
            </div>

            {/* Event details */}
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">{event.label}</h3>
              <p className="text-xs text-muted-foreground">
                {formatDate(event.date)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-neutral-100/80 p-4 rounded-md">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Holding Period</p>
            <p className="text-sm font-semibold">
              {Math.floor(
                (new Date(settlementDate || dueDate).getTime() -
                  new Date(fundingDate).getTime()) /
                  (1000 * 60 * 60 * 24)
              )}{' '}
              days
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Status</p>
            <Badge variant="secondary" className="text-xs">
              {status === 'repaid'
                ? 'Completed'
                : status === 'funded'
                ? 'Active'
                : 'Active'}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
}
