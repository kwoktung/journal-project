"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Heart } from "lucide-react";
import { SidebarNavItem } from "./sidebar-nav-item";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "@/hooks/queries/use-auth";
import { getUserInitials } from "@/lib/format/user";

const navItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/relationship", label: "Relationship", icon: Heart },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const { data: currentUser } = useSession();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar p-4 lg:flex">
      {/* Logo Section */}
      <div className="mb-4 flex items-center gap-2 p-4">
        <Heart className="size-6 text-sidebar-primary" />
        <span className="text-xl font-bold text-sidebar-foreground">
          Moment
        </span>
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <SidebarNavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            isActive={pathname === item.href}
          />
        ))}
      </nav>

      {/* User Section */}
      {currentUser && (
        <Link
          href="/profile"
          className="mt-auto block rounded-xl p-3 transition-colors hover:bg-sidebar-accent/50"
        >
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
        </Link>
      )}
    </aside>
  );
};
