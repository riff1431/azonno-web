"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Truck, Tag, ShieldCheck, CheckCheck, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/shared/ui/button";

export default function AccountNotificationsPage() {
  const [notifications, setNotifications] = useState([
    {
      id: "notif-1",
      title: "Order Confirmed & Processing",
      desc: "Your order #ORD-2026-237693 has been verified and is being packed by our logistics team.",
      time: "2 hours ago",
      icon: Truck,
      iconColor: "bg-blue-50 text-blue-600",
      unread: true,
      href: "/account/track",
    },
    {
      id: "notif-2",
      title: "Flash Sale Alert: 20% OFF Korean Skincare",
      desc: "Special weekend flash deals live now on COSRX, Anua, and Beauty of Joseon!",
      time: "Yesterday",
      icon: Tag,
      iconColor: "bg-teal-50/60 text-[#1D6474]",
      unread: true,
      href: "/products?discount=true",
    },
    {
      id: "notif-3",
      title: "Loyalty Points Awarded (+50 pts)",
      desc: "You earned 50 reward points from your recent purchase. Check your Points wallet.",
      time: "3 days ago",
      icon: ShieldCheck,
      iconColor: "bg-purple-50 text-purple-600",
      unread: false,
      href: "/account/points",
    },
  ]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Bell className="h-5 w-5 text-[#1D6474]" /> Notifications & Alerts
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Stay updated with your order statuses, courier tracking, and member promotions.
          </p>
        </div>

        {notifications.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={markAllRead}
              className="text-xs font-bold border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Mark All as Read
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAll}
              className="text-xs font-bold border-gray-200 text-gray-400 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-3xl border border-gray-200 bg-white p-12 text-center space-y-4 shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 text-gray-400">
            <Bell className="h-7 w-7" />
          </div>
          <h2 className="text-base font-bold text-gray-900">You are all caught up!</h2>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            No unread notifications. Important delivery updates and tracking notices will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const Icon = n.icon;
            return (
              <Link
                key={n.id}
                href={n.href}
                className={`block rounded-3xl border p-4 sm:p-5 transition-all hover:border-[#1D6474] shadow-xs ${
                  n.unread ? "bg-teal-50/60/20 border-teal-200" : "bg-white border-gray-200"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`h-10 w-10 shrink-0 rounded-2xl flex items-center justify-center ${n.iconColor}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-2">
                        {n.title}
                        {n.unread && <span className="h-2 w-2 rounded-full bg-[#1D6474]" />}
                      </h3>
                      <span className="text-[11px] text-gray-400 shrink-0">{n.time}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">{n.desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 self-center shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
