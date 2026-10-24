"use client";

/* ============================================================
   CommandPalette — Cmd+K, editorial calm.
   ============================================================ */

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  FileSearch,
  MessageSquare,
  FileText,
  History,
  Settings,
  Upload,
  Moon,
  Sun,
  type LucideIcon,
} from "lucide-react";
import type { AppView } from "./AppShell";

interface CommandItemDef {
  id: string;
  label: string;
  icon: LucideIcon;
  shortcut?: string;
  action: () => void;
  keywords?: string[];
}

export function CommandPalette({
  open,
  onOpenChange,
  onViewChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewChange: (view: AppView) => void;
}) {
  const nav = (view: AppView) => () => {
    onViewChange(view);
    onOpenChange(false);
  };

  const navigationItems: CommandItemDef[] = [
    { id: "dashboard", label: "Go to Dashboard", icon: LayoutDashboard, shortcut: "G D", action: nav("dashboard"), keywords: ["home", "overview"] },
    { id: "grade", label: "Go to Grade", icon: FileSearch, shortcut: "G G", action: nav("grade"), keywords: ["ocr", "upload", "answer", "sheet"] },
    { id: "assistant", label: "Go to Assistant", icon: MessageSquare, shortcut: "G A", action: nav("assistant"), keywords: ["chatbot", "chat", "ask"] },
    { id: "rubric", label: "Go to Rubrics", icon: FileText, shortcut: "G R", action: nav("rubric"), keywords: ["questions", "model", "answer"] },
    { id: "history", label: "Go to History", icon: History, shortcut: "G H", action: nav("history"), keywords: ["submissions", "past"] },
    { id: "settings", label: "Go to Settings", icon: Settings, shortcut: "G S", action: nav("settings"), keywords: ["config", "env"] },
  ];

  const actionItems: CommandItemDef[] = [
    { id: "new-grade", label: "Start new grading session", icon: Upload, shortcut: "N", action: nav("grade"), keywords: ["upload", "new"] },
  ];

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search…" />
      <CommandList className="max-h-[400px]">
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Actions">
          {actionItems.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.id}
                value={item.label}
                onSelect={() => item.action()}
                keywords={item.keywords}
              >
                <Icon size={14} className="text-muted-foreground" />
                <span>{item.label}</span>
                {item.shortcut && (
                  <CommandShortcut>{item.shortcut}</CommandShortcut>
                )}
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.id}
                value={item.label}
                onSelect={() => item.action()}
                keywords={item.keywords}
              >
                <Icon size={14} className="text-muted-foreground" />
                <span>{item.label}</span>
                {item.shortcut && (
                  <CommandShortcut>{item.shortcut}</CommandShortcut>
                )}
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Theme">
          <CommandItem
            value="Toggle dark / light"
            onSelect={() => {
              if (typeof document !== "undefined") {
                document.documentElement.classList.toggle("dark");
                document.documentElement.classList.toggle("light");
              }
              onOpenChange(false);
            }}
          >
            <Moon size={14} className="text-muted-foreground" />
            <span>Toggle dark / light</span>
            <CommandShortcut>⌘D</CommandShortcut>
          </CommandItem>
          <CommandItem
            value="Force light mode"
            onSelect={() => {
              if (typeof document !== "undefined") {
                document.documentElement.classList.remove("dark");
                document.documentElement.classList.add("light");
              }
              onOpenChange(false);
            }}
          >
            <Sun size={14} className="text-muted-foreground" />
            <span>Force light mode</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
