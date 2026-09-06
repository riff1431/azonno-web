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
    <FraudBlacklistClient
      initialProfiles={profiles}
      initialBDCourierSettings={bdcourierSettings}
    />
  );
}

