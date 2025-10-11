import { Avatar, AvatarFallback, SidebarMenuButton } from '@ui';
import { GalleryVerticalEnd } from 'lucide-react';

// export function NavOrg({ org }: { org: { name: string; logoUrl: string } }) {
//   return (
//     <div className="flex hover:bg-accent items-center gap-2 rounded-md p-2 transition-all duration-200 ease-linear group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2">
//       <Avatar className=" h-8 w-8">
//         <AvatarFallback className="bg-slate-200 text-neutral-800">
//           <House className="h-4 w-4" />
//         </AvatarFallback>
//       </Avatar>

//       <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
//         <span className="truncate font-semibold">{org.name}</span>
//       </div>
//     </div>
//   );
// }

export function NavOrg({ org }: { org: { name: string; logoUrl: string } }) {
  return (
    <SidebarMenuButton asChild>
      <a href="#">
        <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-full">
          <GalleryVerticalEnd className="size-4" />
        </div>
        <div className="flex flex-col gap-0.5 leading-none">
          <span className="font-medium">{org.name}</span>
          {/* <span className="">v1.0.0</span> */}
        </div>
      </a>
    </SidebarMenuButton>
  );
}
