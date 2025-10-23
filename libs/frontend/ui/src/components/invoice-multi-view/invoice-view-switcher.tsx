'use client';

import { Tabs, TabsList, TabsTrigger } from '../shadcn';
import { LayoutGrid, Columns3, GanttChart, Grid3x2 } from 'lucide-react';
import { ViewType } from '../../types';

interface InvoiceViewSwitcherProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export function InvoiceViewSwitcher({
  currentView,
  onViewChange,
}: InvoiceViewSwitcherProps) {
  return (
    <Tabs
      value={currentView}
      onValueChange={(value) => onViewChange(value as ViewType)}
    >
      <TabsList className="grid w-full grid-cols-4 max-w-md">
        <TabsTrigger value="table" className="gap-2">
          <Grid3x2 className="h-4 w-4" />
          <span className="hidden sm:inline">Table</span>
        </TabsTrigger>
        <TabsTrigger value="kanban" className="gap-2">
          <Columns3 className="h-4 w-4" />
          <span className="hidden sm:inline">Kanban</span>
        </TabsTrigger>
        <TabsTrigger value="gantt" className="gap-2">
          <GanttChart className="h-4 w-4" />
          <span className="hidden sm:inline">Gantt</span>
        </TabsTrigger>
        <TabsTrigger value="gallery" className="gap-2">
          <LayoutGrid className="h-4 w-4" />
          <span className="hidden sm:inline">Gallery</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
