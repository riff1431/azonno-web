import { Suspense } from "react";
import { getFraudProfiles } from "@/features/fraud/actions";
import { getBDCourierSettings } from "@/features/fraud/bdcourier-service";
import FraudBlacklistClient from "./fraud-blacklist-client";

export const metadata = {
  title: "Fraud Prevention & Blacklist — Admin Dashboard",
};

export default async function AdminFraudPage() {
  const [profiles, bdcourierSettings] = await Promise.all([
    getFraudProfiles(),
    getBDCourierSettings(),
  ]);

  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-500 font-bold">Loading Fraud Prevention Hub...</div>}>
      <FraudBlacklistClient
        initialProfiles={profiles}
        initialBDCourierSettings={bdcourierSettings}
      />
    </Suspense>
  );
}
