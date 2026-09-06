"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Settings,
  Activity,
  ExternalLink,
  LogOut,
  ShieldCheck,
  ChevronDown,
  Layers,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useAdminLang } from "@/lib/admin-lang-context";

export function AdminUserMenu() {
  const router = useRouter();
  const { t } = useAdminLang();
  const [isOpen, setIsOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("admin@ecomx.com");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (data?.user?.email) {
          setUserEmail(data.user.email);
        }
      } catch {
        // Fallback to default
      }
    }
    loadUser();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        id="admin-user-menu-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User menu"
        aria-expanded={isOpen}
        className={cn(
          "flex items-center gap-2 rounded-xl p-1.5 transition-colors",
          isOpen ? "bg-surface-secondary" : "hover:bg-surface-secondary"
        )}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700 shadow-xs">
          A
        </div>
        <div className="hidden text-left md:block">
          <p className="text-xs font-semibold text-text leading-tight">Admin</p>
          <p className="text-[10px] text-text-muted leading-tight">Superadmin</p>
        </div>
        <ChevronDown className={cn("hidden h-3.5 w-3.5 text-text-muted transition-transform md:block", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-white shadow-2xl z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
          {/* User Profile Header */}
          <div className="border-b border-border bg-gray-50/70 p-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white shadow-xs">
                A
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-text truncate">Administrator</p>
                <p className="text-[11px] text-text-muted truncate">{userEmail}</p>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary-700 bg-primary-50 px-1.5 py-0.2 rounded mt-0.5">
                  <ShieldCheck className="h-2.5 w-2.5" /> Full Access
                </span>
              </div>
            </div>
          </div>

          {/* Quick Menu Links */}
          <div className="p-1.5 space-y-0.5 text-xs text-text">
            <Link
              href="/"
              target="_blank"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-surface-secondary transition-colors"
            >
              <ExternalLink className="h-4 w-4 text-text-muted" />
              <span>{t("view_all")}</span>
            </Link>

            <Link
              href="/admin/settings/store"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-surface-secondary transition-colors"
            >
              <Settings className="h-4 w-4 text-text-muted" />
              <span>{t("store_settings")}</span>
            </Link>

            <Link
              href="/admin/settings/modules"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-surface-secondary transition-colors"
            >
              <Layers className="h-4 w-4 text-text-muted" />
              <span>{t("feature_modules")}</span>
            </Link>

            <Link
              href="/admin/activity"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-surface-secondary transition-colors"
            >
              <Activity className="h-4 w-4 text-text-muted" />
              <span>{t("activity_audit")}</span>
            </Link>
          </div>

          {/* Logout */}
          <div className="border-t border-border p-1.5 bg-gray-50/50">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-danger-600 hover:bg-danger-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>{t("sign_out")}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
