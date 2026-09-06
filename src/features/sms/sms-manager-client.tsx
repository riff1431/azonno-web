"use client";

import { useState } from "react";
import { MessageSquare, Send, Phone, Loader2 } from "lucide-react";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Button } from "@/components/shared/ui/button";
import { sendSmsNotification } from "./actions";
import { useAdminLang } from "@/lib/admin-lang-context";

interface SmsManagerClientProps {
  initialTemplates: any[];
  initialLogs: any[];
}

export function SmsManagerClient({ initialTemplates, initialLogs }: SmsManagerClientProps) {
  const { t } = useAdminLang();
  const [templates] = useState(initialTemplates);
  const [logs, setLogs] = useState(initialLogs);
  const [testPhone, setTestPhone] = useState("01712345678");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleSendTestSms = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setMsg(null);

    const origin = typeof window !== "undefined" && window.location.origin ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || "");
    const res = await sendSmsNotification({
      recipientPhone: testPhone,
      eventType: "order_created",
      variables: {
        customer_name: "Tanvir Ahmed",
        order_number: "ORD-2026-895823",
        total: "1365",
        tracking_url: `${origin}/account/track`,
      },
    });

    if (res.success && res.log) {
      setLogs([res.log, ...logs]);
      setMsg(t("sms_dispatch_success"));
    }
    setSending(false);
  };

  const logColumns: Column<any>[] = [
    {
      key: "recipient",
      header: t("recipient_phone_col"),
      sortable: true,
      cell: (row: any) => (
        <span className="font-mono font-bold text-text text-xs flex items-center gap-1.5">
          <Phone className="h-3.5 w-3.5 text-primary-600" />
          {row.recipient_phone}
        </span>
      ),
    },
    {
      key: "message",
      header: t("message_body_col"),
      cell: (row: any) => (
        <p className="max-w-100 text-xs text-text-secondary leading-relaxed">
          {row.message}
        </p>
      ),
    },
    {
      key: "provider",
      header: t("gateway_col"),
      cell: (row: any) => (
        <span className="text-xs font-semibold text-text">
          {row.provider || "BulkSMSBD"}
        </span>
      ),
    },
    {
      key: "status",
      header: t("column_status"),
      cell: (row: any) => (
        <span className="rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-0.5 text-[10px] font-bold uppercase border border-emerald-200">
          {row.status}
        </span>
      ),
    },
    {
      key: "time",
      header: t("sent_at_col"),
      sortable: true,
      cell: (row: any) => (
        <span className="text-xs text-text-muted">
          {new Date(row.sent_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold text-text">{t("sms_gateway_title")}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t("sms_gateway_desc")}</p>
      </div>

      {/* Templates & Quick Test */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Templates */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-bold text-text flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary-600" />
            {t("active_templates_title")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="rounded-2xl border border-border bg-white p-5 shadow-card space-y-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-text text-sm">{tpl.name}</h3>
                  <span className="rounded-full bg-primary-50 text-primary-700 px-2 py-0.2 text-[10px] font-bold uppercase">
                    {tpl.event_type}
                  </span>
                </div>

                <div className="rounded-xl bg-surface-secondary/70 p-3 font-mono text-[11px] text-text-secondary leading-relaxed border border-border">
                  &quot;{tpl.template}&quot;
                </div>

                <div className="flex flex-wrap gap-1 pt-1">
                  {tpl.variables?.map((v: string) => (
                    <span
                      key={v}
                      className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-text-muted font-mono font-bold"
                    >
                      &#123;&#123;{v}&#125;&#125;
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Send Form */}
        <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-4 text-xs">
          <h2 className="text-base font-bold text-text flex items-center gap-2 border-b border-border pb-2">
            <Send className="h-4 w-4 text-primary-600" />
            {t("send_test_sms_title")}
          </h2>

          <form onSubmit={handleSendTestSms} className="space-y-3">
            <div>
              <label className="block font-semibold text-text mb-1">
                {t("recipient_mobile_label")}
              </label>
              <input
                type="tel"
                required
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                className="w-full rounded-xl border border-border px-3 py-2 text-xs focus:outline-none"
              />
            </div>

            <p className="text-[11px] text-text-muted">{t("sms_gateway_note")}</p>

            {msg && (
              <span className="text-xs font-semibold text-emerald-600 block">{msg}</span>
            )}

            <Button type="submit" disabled={sending} className="w-full text-xs">
              {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Send className="h-3.5 w-3.5 mr-1" />}
              {t("dispatch_test_btn")}
            </Button>
          </form>
        </div>
      </div>

      {/* Dispatch History Table */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-text">{t("sms_history_title")}</h2>

        <DataTable
          columns={logColumns}
          data={logs}
          searchKey="recipient_phone"
          searchPlaceholder={t("search_sms_phone")}
          emptyMessage={t("no_sms_logged")}
        />
      </div>
    </div>
  );
}
