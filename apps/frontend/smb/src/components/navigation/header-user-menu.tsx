'use client';

import { ChevronsUpDown, LogOut, User } from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Button,
} from '@ui';
// import { useAuthManager } from '@/utils/hooks/use-auth-manager';

/**
 * HeaderUserMenu - User avatar and dropdown for the fixed header
 *
 * Similar to NavMember but designed for header usage with Coinbase-style layout
 */
export function HeaderUserMenu({
  member,
}: {
  member: {
    name: string;
    email: string;
  };
}) {
  // const { logout } = useAuthManager();

  // const handleLogout = () => {
  //   logout.mutate();
  // };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-9 w-9 rounded-full hover:bg-accent transition-colors"
        >
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-neutral-200/60 shadow-md">
              {member.name?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-semibold leading-none">{member.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {member.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {/* <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem> */}
        <DropdownMenuItem disabled className="cursor-not-allowed opacity-50">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
