'use client';

import { useState } from 'react';
import { Invoice, InvoiceStatus, ViewType, InvoiceMultiViewConfig } from '../../types';
import { InvoiceViewSwitcher } from './invoice-view-switcher';
import { InvoiceTableView } from './invoice-table-view';
import { InvoiceKanbanView } from './invoice-kanban-view';
import { InvoiceGanttView } from './invoice-gantt-view';
import { InvoiceGalleryView } from './invoice-gallery-view';
import { useLocalStorage } from '../../hooks';
import {
  Button,
  Input,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '../shadcn';
import { Search, Filter, X } from 'lucide-react';

interface InvoiceMultiViewProps {
  invoices: Invoice[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  baseRoute?: string;
  config?: InvoiceMultiViewConfig;
}

export function InvoiceMultiView({
  invoices,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  baseRoute = '/invoices',
  config,
}: InvoiceMultiViewProps) {
  const [currentView, setCurrentView] = useLocalStorage<ViewType>(
    'invoice-view-preference',
    'table'
  );
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  // Default to all statuses if not configured
  const availableStatuses = config?.availableStatuses || [
    InvoiceStatus.CREATED,
    InvoiceStatus.LISTED,
    InvoiceStatus.FULLY_FUNDED,
    InvoiceStatus.DISBURSED,
    InvoiceStatus.PENDING_REPAYMENT,
    InvoiceStatus.FULLY_PAID,
    InvoiceStatus.REPAID,
    InvoiceStatus.DEFAULTED,
    InvoiceStatus.SETTLED,
  ];

  const handleSearchBlur = () => {
    if (!searchQuery) {
      setIsSearchExpanded(false);
    }
  };

  const handleClearSearch = () => {
    onSearchChange('');
    setIsSearchExpanded(false);
  };

  const isFilterActive = statusFilter !== 'all';

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* View Switcher and Filters Row */}
      <div className="flex items-center gap-2">
        {/* Left: View Switcher */}
        <InvoiceViewSwitcher
          currentView={currentView}
          onViewChange={setCurrentView}
        />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right: Search and Filter */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Expandable Search */}
          <div className="relative">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsSearchExpanded(true)}
              className="h-9 w-9"
            >
              <Search className="h-4 w-4" />
            </Button>

            {isSearchExpanded && (
              <div className="absolute right-0 top-0 z-50 transition-opacity duration-150 opacity-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search"
                    className="pl-10 pr-8 w-[300px]"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    onBlur={handleSearchBlur}
                    autoFocus
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
                      onClick={handleClearSearch}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 relative"
              >
                <Filter className="h-4 w-4" />
                {isFilterActive && (
                  <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-primary" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={statusFilter}
                onValueChange={onStatusFilterChange}
              >
                <DropdownMenuRadioItem value="all">
                  All Statuses
                </DropdownMenuRadioItem>
                {availableStatuses.map((status) => (
                  <DropdownMenuRadioItem key={status} value={status}>
                    {status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, ' ')}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* View Content */}
      <div className="min-h-[400px]">
        {currentView === 'table' && (
          <InvoiceTableView invoices={invoices} baseRoute={baseRoute} config={config} />
        )}
        {currentView === 'kanban' && (
          <InvoiceKanbanView invoices={invoices} baseRoute={baseRoute} config={config} />
        )}
        {currentView === 'gantt' && <InvoiceGanttView invoices={invoices} config={config} />}
        {currentView === 'gallery' && (
          <InvoiceGalleryView invoices={invoices} baseRoute={baseRoute} config={config} />
        )}
      </div>
    </div>
  );
}
