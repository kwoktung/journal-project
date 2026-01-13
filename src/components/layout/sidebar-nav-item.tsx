"use client";

import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarNavItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
}

export const SidebarNavItem = ({
  href,
  label,
  icon: Icon,
  isActive,
}: SidebarNavItemProps) => {
  return (
    <Link href={href}>
      <div
        className={cn(
          "flex items-center gap-4 rounded-xl px-4 py-3 text-base font-medium transition-colors",
          isActive
            ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent/50",
        )}
      >
        <Icon className="size-6" />
        <span>{label}</span>
      </div>
    </Link>
  );
};
