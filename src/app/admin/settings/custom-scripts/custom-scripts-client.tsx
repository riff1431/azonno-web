"use client";

import { useState } from "react";
import {
  Code2,
  Save,
  ShieldCheck,
  CheckCircle2,
  Globe,
  Sparkles,
  Layers,
  FileCode2,
  HelpCircle,
  Copy,
  Check,
  Eye,
  AlertTriangle,
  Zap,
  Terminal,
  ExternalLink,
  MessageSquare,
  Search,
  Sliders,
} from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import {
  saveCustomScriptsSettings,
  type CustomScriptsSettings,
} from "@/features/settings/custom-scripts-actions";

interface CustomScriptsClientProps {
  initialSettings: CustomScriptsSettings;
}

export function CustomScriptsClient({ initialSettings }: CustomScriptsClientProps) {
  const [form, setForm] = useState<CustomScriptsSettings>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"verification" | "head" | "body" | "footer" | "preview">("verification");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const res = await saveCustomScriptsSettings(form);
      if (res.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        setSaveError(res.error || "Failed to save settings");
      }
    } catch (err: any) {
      setSaveError(err.message || "An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const insertSnippet = (placement: "header_scripts" | "body_top_scripts" | "footer_scripts", code: string) => {
    setForm((prev) => {
      const existing = prev[placement] || "";
      const separator = existing.trim().length > 0 ? "\n\n" : "";
      return {
        ...prev,
        [placement]: existing + separator + code,
      };
    });
  };

  return (
    <div className="space-y-6 max-w-6xl pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl border border-teal-100/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-teal-50/60 text-[#1D6474] rounded-xl">
              <Code2 className="h-5 w-5" />
            </span>
            <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
              Header, Body & Footer Scripts & Verification
            </h1>
          </div>
          <p className="text-xs md:text-sm text-gray-500">
            Easily add HTML meta verification tags, tracking scripts, and live chat widgets to your store without touching code.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#1D6474] hover:bg-[#164E63] text-white font-bold rounded-2xl px-6 py-2.5 shadow-md hover:shadow-lg transition-all flex items-center gap-2"
          >
            {isSaving ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : saveSuccess ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSaving ? "Saving Changes..." : saveSuccess ? "Saved Successfully!" : "Save All Changes"}
          </Button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2 font-semibold text-xs">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Settings successfully saved! All tags and scripts are now live on your storefront.</span>
          </div>
        </div>
      )}

      {saveError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center gap-2 font-semibold text-xs">
          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Master Toggle & Navigation Tabs */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_enabled}
                onChange={(e) => setForm({ ...form, is_enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1D6474]"></div>
            </label>
            <div>
              <span className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                Master Script Injection
                {form.is_enabled ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    ACTIVE (Injecting Live)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">
                    DISABLED (Paused)
                  </span>
                )}
              </span>
              <p className="text-[11px] text-gray-500">
                When enabled, all verification tags and custom scripts will be rendered on the website.
              </p>
            </div>
          </div>

          {/* Tab buttons */}
          <div className="flex flex-wrap gap-1.5 p-1.5 bg-gray-100/80 rounded-2xl">
            <button
              onClick={() => setActiveTab("verification")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "verification"
                  ? "bg-white text-[#1D6474] shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Domain Verification
            </button>
            <button
              onClick={() => setActiveTab("head")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "head"
                  ? "bg-white text-[#1D6474] shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <FileCode2 className="h-3.5 w-3.5" />
              Header Scripts (&lt;head&gt;)
            </button>
            <button
              onClick={() => setActiveTab("body")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "body"
                  ? "bg-white text-[#1D6474] shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              Body Top (&lt;body&gt;)
            </button>
            <button
              onClick={() => setActiveTab("footer")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "footer"
                  ? "bg-white text-[#1D6474] shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Footer Scripts (&lt;/body&gt;)
            </button>
            <button
              onClick={() => setActiveTab("preview")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "preview"
                  ? "bg-white text-indigo-600 shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              HTML Live Preview
            </button>
          </div>
        </div>

        {/* TAB 1: Quick Domain Verification Tokens */}
        {activeTab === "verification" && (
          <div className="pt-6 space-y-6">
            <div className="p-4 rounded-2xl bg-linear-to-r from-pink-50/70 to-purple-50/70 border border-teal-100 flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-[#1D6474] shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <span className="font-bold text-gray-900">
                  100% Reliable HTML Domain Verification:
                </span>
                <p className="text-gray-600 leading-relaxed">
                  Enter your verification codes or tokens below. The system automatically creates and outputs the exact <code className="bg-white/80 px-1.5 py-0.5 rounded text-[#164E63] font-mono text-[11px]">&lt;meta&gt;</code> tags into the storefront <code className="bg-white/80 px-1.5 py-0.5 rounded text-[#164E63] font-mono text-[11px]">&lt;head&gt;</code> for Google, Meta, Pinterest, and Bing.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Google Search Console */}
              <div className="p-5 rounded-3xl bg-white border border-gray-200 hover:border-teal-300 transition-all shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                      G
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-gray-900">Google Search Console</h3>
                      <p className="text-[11px] text-gray-500">Site verification token or full HTML tag</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                    google-site-verification
                  </span>
                </div>

                <div>
                  <input
                    type="text"
                    value={form.google_site_verification}
                    onChange={(e) => {
                      let val = e.target.value;
                      // If user pastes full tag, extract content
                      const match = val.match(/content=["']([^"']+)["']/i);
                      if (match && match[1]) val = match[1];
                      setForm({ ...form, google_site_verification: val });
                    }}
                    placeholder='e.g. 4zX7k_AbCdEfGhIjKlMnOpQrStUvWxYz12345 or <meta...>'
                    className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#1D6474] focus:ring-1 focus:ring-[#1D6474] outline-hidden"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Outputs: <code className="text-gray-600 font-mono">&lt;meta name=&quot;google-site-verification&quot; content=&quot;...&quot; /&gt;</code>
                  </p>
                </div>
              </div>

              {/* Meta / Facebook Domain Verification */}
              <div className="p-5 rounded-3xl bg-white border border-gray-200 hover:border-teal-300 transition-all shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                      M
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-gray-900">Meta / Facebook Business</h3>
                      <p className="text-[11px] text-gray-500">Domain Verification for Business Manager</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                    facebook-domain-verification
                  </span>
                </div>

                <div>
                  <input
                    type="text"
                    value={form.facebook_domain_verification}
                    onChange={(e) => {
                      let val = e.target.value;
                      const match = val.match(/content=["']([^"']+)["']/i);
                      if (match && match[1]) val = match[1];
                      setForm({ ...form, facebook_domain_verification: val });
                    }}
                    placeholder='e.g. 9abc123def456ghi789jkl012 or <meta...>'
                    className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#1D6474] focus:ring-1 focus:ring-[#1D6474] outline-hidden"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Outputs: <code className="text-gray-600 font-mono">&lt;meta name=&quot;facebook-domain-verification&quot; content=&quot;...&quot; /&gt;</code>
                  </p>
                </div>
              </div>

              {/* Pinterest Claim Tag */}
              <div className="p-5 rounded-3xl bg-white border border-gray-200 hover:border-teal-300 transition-all shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs">
                      P
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-gray-900">Pinterest Verification</h3>
                      <p className="text-[11px] text-gray-500">Claim your website on Pinterest</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-md">
                    p:domain_verify
                  </span>
                </div>

                <div>
                  <input
                    type="text"
                    value={form.pinterest_verification}
                    onChange={(e) => {
                      let val = e.target.value;
                      const match = val.match(/content=["']([^"']+)["']/i);
                      if (match && match[1]) val = match[1];
                      setForm({ ...form, pinterest_verification: val });
                    }}
                    placeholder='e.g. 6a1b2c3d4e5f6a7b8c9d0e or <meta...>'
                    className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#1D6474] focus:ring-1 focus:ring-[#1D6474] outline-hidden"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Outputs: <code className="text-gray-600 font-mono">&lt;meta name=&quot;p:domain_verify&quot; content=&quot;...&quot; /&gt;</code>
                  </p>
                </div>
              </div>

              {/* Bing Webmaster Tools */}
              <div className="p-5 rounded-3xl bg-white border border-gray-200 hover:border-teal-300 transition-all shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-xs">
                      B
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-gray-900">Bing Webmaster Tools</h3>
                      <p className="text-[11px] text-gray-500">Microsoft Bing verification code</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                    msvalidate.01
                  </span>
                </div>

                <div>
                  <input
                    type="text"
                    value={form.bing_site_verification}
                    onChange={(e) => {
                      let val = e.target.value;
                      const match = val.match(/content=["']([^"']+)["']/i);
                      if (match && match[1]) val = match[1];
                      setForm({ ...form, bing_site_verification: val });
                    }}
                    placeholder='e.g. 89BC1A23D4E56F78901234567890ABCD or <meta...>'
                    className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#1D6474] focus:ring-1 focus:ring-[#1D6474] outline-hidden"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Outputs: <code className="text-gray-600 font-mono">&lt;meta name=&quot;msvalidate.01&quot; content=&quot;...&quot; /&gt;</code>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Header Scripts (<head>) */}
        {activeTab === "head" && (
          <div className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                  <FileCode2 className="h-4 w-4 text-[#1D6474]" />
                  Header Scripts (&lt;head&gt;...&lt;/head&gt;)
                </h3>
                <p className="text-[11px] text-gray-500">
                  Injected directly inside the HTML <code className="font-mono text-[#164E63]">&lt;head&gt;</code> tag on every page. Ideal for meta tags, tracking pixels, Google Tag Manager head, or custom styles.
                </p>
              </div>

              {/* Quick Snippet Inserts */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-gray-500">Insert Preset:</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    insertSnippet(
                      "header_scripts",
                      `<!-- Google Tag Manager (Head) -->\n<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':\nnew Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],\nj=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=\n'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);\n})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>\n<!-- End Google Tag Manager -->`
                    )
                  }
                  className="text-[10px] font-bold rounded-xl h-7 px-2.5"
                >
                  + GTM Head
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    insertSnippet(
                      "header_scripts",
                      `<!-- Microsoft Clarity -->\n<script type="text/javascript">\n    (function(c,l,a,r,i,t,y){\n        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};\n        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;\n        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);\n    })(window, document, "clarity", "script", "YOUR_CLARITY_ID");\n</script>`
                    )
                  }
                  className="text-[10px] font-bold rounded-xl h-7 px-2.5"
                >
                  + MS Clarity
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    insertSnippet(
                      "header_scripts",
                      `<style>\n  /* Custom CSS Overrides */\n</style>`
                    )
                  }
                  className="text-[10px] font-bold rounded-xl h-7 px-2.5"
                >
                  + Custom CSS
                </Button>
              </div>
            </div>

            <textarea
              rows={14}
              value={form.header_scripts}
              onChange={(e) => setForm({ ...form, header_scripts: e.target.value })}
              placeholder="<!-- Paste your custom HTML, <meta>, <script>, or <style> tags here -->"
              className="w-full font-mono text-xs p-4 rounded-2xl bg-gray-900 text-gray-100 border border-gray-700 focus:border-[#1D6474] focus:ring-1 focus:ring-[#1D6474] outline-hidden leading-relaxed shadow-inner"
              spellCheck={false}
            />
          </div>
        )}

        {/* TAB 3: Body Top Scripts (<body>) */}
        {activeTab === "body" && (
          <div className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-[#1D6474]" />
                  Body Top Scripts (Immediately after &lt;body&gt;)
                </h3>
                <p className="text-[11px] text-gray-500">
                  Injected immediately after the opening <code className="font-mono text-[#164E63]">&lt;body&gt;</code> tag. Primarily required for Google Tag Manager &lt;noscript&gt; fallback iframe.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-gray-500">Insert Preset:</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    insertSnippet(
                      "body_top_scripts",
                      `<!-- Google Tag Manager (noscript) -->\n<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"\nheight="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>\n<!-- End Google Tag Manager (noscript) -->`
                    )
                  }
                  className="text-[10px] font-bold rounded-xl h-7 px-2.5"
                >
                  + GTM Noscript
                </Button>
              </div>
            </div>

            <textarea
              rows={14}
              value={form.body_top_scripts}
              onChange={(e) => setForm({ ...form, body_top_scripts: e.target.value })}
              placeholder="<!-- e.g. <noscript><iframe src='https://www.googletagmanager.com/ns.html?id=GTM-XXXXX' ...></iframe></noscript> -->"
              className="w-full font-mono text-xs p-4 rounded-2xl bg-gray-900 text-gray-100 border border-gray-700 focus:border-[#1D6474] focus:ring-1 focus:ring-[#1D6474] outline-hidden leading-relaxed shadow-inner"
              spellCheck={false}
            />
          </div>
        )}

        {/* TAB 4: Footer Scripts (</body>) */}
        {activeTab === "footer" && (
          <div className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4 text-[#1D6474]" />
                  Footer Scripts (Before &lt;/body&gt;)
                </h3>
                <p className="text-[11px] text-gray-500">
                  Injected right before the closing <code className="font-mono text-[#164E63]">&lt;/body&gt;</code> tag. Perfect for Live Chat widgets (Tawk.to, Crisp), WhatsApp widgets, and third-party conversion widgets.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-gray-500">Insert Preset:</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    insertSnippet(
                      "footer_scripts",
                      `<!-- Start of Tawk.to Script -->\n<script type="text/javascript">\nvar Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();\n(function(){\nvar s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];\ns1.async=true;\ns1.src='https://embed.tawk.to/YOUR_PROPERTY_ID/default';\ns1.charset='UTF-8';\ns1.setAttribute('crossorigin','*');\ns0.parentNode.insertBefore(s1,s0);\n})();\n</script>\n<!-- End of Tawk.to Script -->`
                    )
                  }
                  className="text-[10px] font-bold rounded-xl h-7 px-2.5"
                >
                  + Tawk.to Chat
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    insertSnippet(
                      "footer_scripts",
                      `<!-- Crisp Chat -->\n<script type="text/javascript">\nwindow.$crisp=[];window.CRISP_WEBSITE_ID="YOUR_WEBSITE_ID";\n(function(){\nd=document;s=d.createElement("script");\ns.src="https://client.crisp.chat/l.js";\ns.async=1;d.getElementsByTagName("head")[0].appendChild(s);\n})();\n</script>`
                    )
                  }
                  className="text-[10px] font-bold rounded-xl h-7 px-2.5"
                >
                  + Crisp Chat
                </Button>
              </div>
            </div>

            <textarea
              rows={14}
              value={form.footer_scripts}
              onChange={(e) => setForm({ ...form, footer_scripts: e.target.value })}
              placeholder="<!-- Paste your live chat widget, tracking code or custom footer scripts here -->"
              className="w-full font-mono text-xs p-4 rounded-2xl bg-gray-900 text-gray-100 border border-gray-700 focus:border-[#1D6474] focus:ring-1 focus:ring-[#1D6474] outline-hidden leading-relaxed shadow-inner"
              spellCheck={false}
            />
          </div>
        )}

        {/* TAB 5: Live HTML Output Preview */}
        {activeTab === "preview" && (
          <div className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                  <Terminal className="h-4 w-4 text-indigo-600" />
                  Live HTML Output Simulation
                </h3>
                <p className="text-[11px] text-gray-500">
                  This preview shows the exact raw HTML code that will be injected into your store pages.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const fullPreview = `<!-- <head> -->\n${
                    form.google_site_verification
                      ? `<meta name="google-site-verification" content="${form.google_site_verification}" />\n`
                      : ""
                  }${
                    form.facebook_domain_verification
                      ? `<meta name="facebook-domain-verification" content="${form.facebook_domain_verification}" />\n`
                      : ""
                  }${
                    form.pinterest_verification
                      ? `<meta name="p:domain_verify" content="${form.pinterest_verification}" />\n`
                      : ""
                  }${
                    form.bing_site_verification
                      ? `<meta name="msvalidate.01" content="${form.bing_site_verification}" />\n`
                      : ""
                  }${form.header_scripts || ""}\n\n<!-- <body> (Top) -->\n${
                    form.body_top_scripts || ""
                  }\n\n<!-- </body> (Footer) -->\n${form.footer_scripts || ""}`;
                  copyToClipboard(fullPreview, "all_preview");
                }}
                className="text-xs font-bold rounded-xl h-8 gap-1.5"
              >
                {copiedKey === "all_preview" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedKey === "all_preview" ? "Copied!" : "Copy Full Code"}
              </Button>
            </div>

            <div className="space-y-4">
              {/* Head Section */}
              <div className="p-4 rounded-2xl bg-gray-900 text-gray-100 border border-gray-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-pink-400 font-bold font-mono border-b border-gray-800 pb-2">
                  <span>&lt;head&gt; Injection Block</span>
                  <span className="text-[10px] text-gray-400">Rendered in &lt;head&gt;</span>
                </div>
                <pre className="text-[11px] font-mono whitespace-pre-wrap text-emerald-400 leading-relaxed overflow-x-auto">
                  {form.google_site_verification && (
                    <span className="text-sky-300">
                      {`<meta name="google-site-verification" content="${form.google_site_verification}" />\n`}
                    </span>
                  )}
                  {form.facebook_domain_verification && (
                    <span className="text-sky-300">
                      {`<meta name="facebook-domain-verification" content="${form.facebook_domain_verification}" />\n`}
                    </span>
                  )}
                  {form.pinterest_verification && (
                    <span className="text-sky-300">
                      {`<meta name="p:domain_verify" content="${form.pinterest_verification}" />\n`}
                    </span>
                  )}
                  {form.bing_site_verification && (
                    <span className="text-sky-300">
                      {`<meta name="msvalidate.01" content="${form.bing_site_verification}" />\n`}
                    </span>
                  )}
                  {form.header_scripts || (
                    <span className="text-gray-500 italic">// No custom header scripts added</span>
                  )}
                </pre>
              </div>

              {/* Body Top Section */}
              <div className="p-4 rounded-2xl bg-gray-900 text-gray-100 border border-gray-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-pink-400 font-bold font-mono border-b border-gray-800 pb-2">
                  <span>&lt;body&gt; Start Injection Block</span>
                  <span className="text-[10px] text-gray-400">Rendered after &lt;body&gt;</span>
                </div>
                <pre className="text-[11px] font-mono whitespace-pre-wrap text-yellow-300 leading-relaxed overflow-x-auto">
                  {form.body_top_scripts || (
                    <span className="text-gray-500 italic">// No body top scripts added</span>
                  )}
                </pre>
              </div>

              {/* Footer Section */}
              <div className="p-4 rounded-2xl bg-gray-900 text-gray-100 border border-gray-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-pink-400 font-bold font-mono border-b border-gray-800 pb-2">
                  <span>&lt;/body&gt; Footer Injection Block</span>
                  <span className="text-[10px] text-gray-400">Rendered before &lt;/body&gt;</span>
                </div>
                <pre className="text-[11px] font-mono whitespace-pre-wrap text-cyan-300 leading-relaxed overflow-x-auto">
                  {form.footer_scripts || (
                    <span className="text-gray-500 italic">// No footer scripts added</span>
                  )}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
