import { Avatar, AvatarFallback } from '@ui';
import { House } from 'lucide-react';

export function NavOrg({ org }: { org: { name: string; logoUrl: string } }) {
  return (
    <div className="flex items-center gap-2 rounded-md p-2 transition-all duration-200 ease-linear group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2">
      <Avatar className="h-8 w-8">
        <AvatarFallback className="bg-accent text-accent-foreground">
          <House className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>

      <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
        <span className="truncate font-semibold">{org.name}</span>
      </div>
    </div>
  );
}
