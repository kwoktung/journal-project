"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Home, User, Heart, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarNavItem } from "./sidebar-nav-item";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "@/hooks/queries/use-auth";
import { getUserInitials } from "@/lib/format/user";

const navItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/relationship", label: "Relationship", icon: Heart },
];

export const MobileNav = () => {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { data: currentUser } = useSession();

  return (
    <div className="fixed left-4 top-4 z-50 lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon">
            <Menu className="size-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 bg-sidebar p-4">
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-2 text-sidebar-foreground">
              <Heart className="size-6 text-sidebar-primary" />
              <span className="text-xl font-bold">Moment</span>
            </SheetTitle>
          </SheetHeader>

          {/* Navigation Section */}
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => (
              <div key={item.href} onClick={() => setOpen(false)}>
                <SidebarNavItem
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  isActive={pathname === item.href}
                />
              </div>
            ))}
          </nav>

          {/* User Section */}
          {currentUser && (
            <div className="mt-8 rounded-xl p-3 transition-colors hover:bg-sidebar-accent/50">
              <div className="flex items-center gap-3">
                <Avatar className="size-10">
                  <AvatarImage
                    src={currentUser.avatar ?? undefined}
                    alt={currentUser.displayName || currentUser.username}
                  />
                  <AvatarFallback>
                    {getUserInitials({
                      displayName: currentUser.displayName,
                      username: currentUser.username,
                    })}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium text-sidebar-foreground">
                    {currentUser.displayName || currentUser.username}
                  </p>
                  <p className="truncate text-xs text-sidebar-foreground/60">
                    @{currentUser.username}
                  </p>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};
