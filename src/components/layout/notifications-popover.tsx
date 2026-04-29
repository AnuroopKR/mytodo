"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export function NotificationsPopover({ align = "right" }: { align?: "left" | "right" }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
    refetchInterval: 60000, // Refetch every minute
  });

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const overdue = notifications?.overdue || [];
  const dueSoon = notifications?.dueSoon || [];
  const totalNotifications = overdue.length + dueSoon.length;

  return (
    <div className="relative" ref={dropdownRef}>
      <Button 
        variant="ghost" 
        size="icon" 
        className="relative text-zinc-500 hover:text-zinc-900 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {totalNotifications > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
        )}
      </Button>

      {isOpen && (
        <div className={cn(
          "absolute mt-2 w-80 bg-white rounded-xl shadow-xl border border-zinc-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200",
          align === "right" ? "right-0" : "left-0"
        )}>
          <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
            <h3 className="font-semibold text-sm text-zinc-900">Notifications</h3>
            {totalNotifications > 0 && (
              <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {totalNotifications} New
              </span>
            )}
          </div>

          <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-zinc-500 animate-pulse">Loading...</div>
            ) : totalNotifications === 0 ? (
              <div className="p-8 flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center mb-3 text-green-500">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-zinc-900">All caught up!</p>
                <p className="text-xs text-zinc-500 mt-1">No tasks are due soon or overdue.</p>
              </div>
            ) : (
              <div className="py-2">
                {overdue.length > 0 && (
                  <div className="px-3 py-1.5">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-red-500 mb-2 px-1 flex items-center gap-1.5">
                      <AlertCircle className="w-3 h-3" /> Overdue
                    </h4>
                    <div className="space-y-1">
                      {overdue.map((task: any) => (
                        <Link key={task._id} href={`/projects/${task.projectId}?taskId=${task._id}`} onClick={() => setIsOpen(false)}>
                          <div className="flex flex-col p-2.5 rounded-lg hover:bg-red-50/50 transition-colors cursor-pointer group">
                            <span className="text-sm font-semibold text-zinc-800 line-clamp-1 group-hover:text-red-700 transition-colors">{task.title}</span>
                            <span className="text-[10px] text-red-500 font-medium mt-1">
                              Due {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {overdue.length > 0 && dueSoon.length > 0 && <div className="h-px bg-zinc-100 my-1 mx-4" />}

                {dueSoon.length > 0 && (
                  <div className="px-3 py-1.5">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-orange-500 mb-2 px-1 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" /> Due Soon
                    </h4>
                    <div className="space-y-1">
                      {dueSoon.map((task: any) => (
                        <Link key={task._id} href={`/projects/${task.projectId}?taskId=${task._id}`} onClick={() => setIsOpen(false)}>
                          <div className="flex flex-col p-2.5 rounded-lg hover:bg-orange-50/50 transition-colors cursor-pointer group">
                            <span className="text-sm font-semibold text-zinc-800 line-clamp-1 group-hover:text-orange-700 transition-colors">{task.title}</span>
                            <span className="text-[10px] text-orange-500 font-medium mt-1">
                              Due {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
