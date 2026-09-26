"use client";

import { useState, useEffect } from "react";
import { User, Phone, Mail, Calendar, Sparkles, Save, CheckCircle2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/shared/ui/button";
import { Input } from "@/components/shared/ui/input";
import { Label } from "@/components/shared/ui/label";

export default function AccountProfilePage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    gender: "female",
    birthday: "",
    skinType: "combination",
  });

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setFormData({
          fullName: data.user.user_metadata?.full_name || "",
          phone: data.user.user_metadata?.phone || data.user.phone || "",
          email: data.user.email || "",
          gender: data.user.user_metadata?.gender || "female",
          birthday: data.user.user_metadata?.birthday || "",
          skinType: data.user.user_metadata?.skin_type || "combination",
        });
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: formData.fullName,
          phone: formData.phone,
          gender: formData.gender,
          birthday: formData.birthday,
          skin_type: formData.skinType,
        },
      });

      if (!error) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 4000);
      } else {
        alert("Failed to update profile: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="border-b border-gray-100 pb-4">
        <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
          <User className="h-5 w-5 text-[#1D6474]" /> My Profile &amp; Preferences
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Manage your personal information, birthday gifts eligibility, and personalized skincare profile.
        </p>
      </div>

      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>Your profile information has been saved successfully!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm space-y-5 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="prof-name" className="font-bold text-gray-800">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="prof-name"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
                className="pl-10 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="prof-email" className="font-bold text-gray-800">Email Address (Account Login)</Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="prof-email"
                type="email"
                disabled
                value={formData.email}
                className="pl-10 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="prof-phone" className="font-bold text-gray-800">Mobile Number (BD)</Label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="prof-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="01XXXXXXXXX"
                className="pl-10 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="prof-gender" className="font-bold text-gray-800">Gender</Label>
            <select
              id="prof-gender"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="w-full rounded-xl border px-3.5 py-2.5 text-xs font-semibold text-gray-800 focus:outline-none"
            >
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Prefer not to say</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="prof-bday" className="font-bold text-gray-800">Birthday (For Birthday Gift Vouchers)</Label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="prof-bday"
                type="date"
                value={formData.birthday}
                onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                className="pl-10 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="prof-skin" className="font-bold text-gray-800">Primary Skin Type</Label>
            <div className="relative">
              <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                id="prof-skin"
                value={formData.skinType}
                onChange={(e) => setFormData({ ...formData, skinType: e.target.value })}
                className="w-full pl-10 rounded-xl border px-3.5 py-2.5 text-xs font-semibold text-gray-800 focus:outline-none"
              >
                <option value="combination">Combination Skin</option>
                <option value="oily">Oily &amp; Shine-Prone</option>
                <option value="dry">Dry Skin</option>
                <option value="sensitive">Sensitive Skin</option>
                <option value="normal">Normal Skin</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-gray-100">
          <Button
            type="submit"
            disabled={loading}
            className="bg-[#1D6474] hover:bg-[#164E63] text-white font-extrabold px-6 py-2.5 text-xs rounded-xl shadow-md transition-all active:scale-95"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Save className="h-4 w-4 mr-1.5" />}
            {loading ? "Saving Changes..." : "Save Profile Details"}
          </Button>
        </div>
      </form>
    </div>
  );
}
