"use client";

import { cn } from "@/lib/utils";

interface SkipLinkProps {
  href?: string;
  children?: React.ReactNode;
  className?: string;
}

export function SkipLink({
  href = "#main-content",
  children = "Skip to main content",
  className,
}: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        "sr-only focus:not-sr-only",
        "fixed top-4 left-4 z-[100]",
        "bg-primary text-primary-foreground",
        "px-4 py-2 rounded-md",
        "font-medium text-sm",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "transition-transform duration-200",
        "-translate-y-16 focus:translate-y-0",
        className
      )}
    >
      {children}
    </a>
  );
}

interface SkipLinksProps {
  links?: Array<{ href: string; label: string }>;
}

export function SkipLinks({ links }: SkipLinksProps) {
  const defaultLinks = [
    { href: "#main-content", label: "Skip to main content" },
    { href: "#main-navigation", label: "Skip to navigation" },
  ];

  const allLinks = links || defaultLinks;

  return (
    <div className="skip-links">
      {allLinks.map((link, index) => (
        <SkipLink key={index} href={link.href}>
          {link.label}
        </SkipLink>
      ))}
    </div>
  );
}
