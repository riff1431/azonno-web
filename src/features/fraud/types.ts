export interface BDCourierConfig {
  apiKey: string;
  enabled: boolean;
  autoCheckOnOrder: boolean;
  minSuccessRatioWarning: number; // e.g., 70%
  blockThresholdRatio: number; // e.g., 40%
  updated_at?: string;
}

export interface BDCourierCourierStat {
  name: string;
  logo?: string;
  total: number;
  success: number;
  cancelled: number;
  ratio: number;
}

export interface BDCourierReport {
  success: boolean;
  phone: string;
  total_parcel: number;
  success_parcel: number;
  cancelled_parcel: number;
  success_ratio: number; // 0 to 100
  risk_level: "safe" | "medium" | "high" | "critical";
  color: "emerald" | "amber" | "red" | "zinc";
  badge_text: string;
  risk_verdict: string;
  raw_risk_verdict?: any;
  courier_details: {
    steadfast?: BDCourierCourierStat;
    pathao?: BDCourierCourierStat;
    redx?: BDCourierCourierStat;
    paperfly?: BDCourierCourierStat;
    carrybee?: BDCourierCourierStat;
    parceldex?: BDCourierCourierStat;
    courrierfast?: BDCourierCourierStat;
    ecourier?: BDCourierCourierStat;
    deliverytiger?: BDCourierCourierStat;
    sundarban?: BDCourierCourierStat;
    saparibahan?: BDCourierCourierStat;
    [key: string]: BDCourierCourierStat | undefined;
  };
  reports_count: number;
  reports: Array<{
    id?: number;
    name?: string;
    reason: string;
    date?: string;
    courier?: string;
    courierLogo?: string;
  }>;
  source: "live_api" | "cached";
  checked_at: string;
  message?: string;
}

export interface BDCourierProviderInfo {
  key: string;
  name: string;
  bnName: string;
  logo: string;
}

export const BDCOURIER_PROVIDERS: BDCourierProviderInfo[] = [
  { key: "steadfast", name: "SteadFast", bnName: "Steadfast", logo: "https://api.bdcourier.com/c-logo/steadfast-logo.png" },
  { key: "pathao", name: "Pathao", bnName: "Pathao", logo: "https://api.bdcourier.com/c-logo/pathao-logo.png" },
  { key: "redx", name: "RedX", bnName: "RedX", logo: "https://api.bdcourier.com/c-logo/redx-logo.png" },
  { key: "paperfly", name: "PaperFly", bnName: "Paperfly", logo: "https://api.bdcourier.com/c-logo/paperfly-logo.png" },
  { key: "carrybee", name: "CarryBee", bnName: "Carrybee", logo: "https://api.bdcourier.com/c-logo/carrybee-logo.webp" },
  { key: "parceldex", name: "ParcelDex", bnName: "ParcelDex", logo: "https://api.bdcourier.com/c-logo/parceldex-logo.png" },
  { key: "courrierfast", name: "CourierFast", bnName: "CourierFast", logo: "https://api.bdcourier.com/c-logo/courierfast-logo.png" },
  { key: "ecourier", name: "eCourier", bnName: "-", logo: "https://api.bdcourier.com/c-logo/ecourier-logo.png" },
  { key: "deliverytiger", name: "Delivery Tiger", bnName: "Delivery :00", logo: "https://api.bdcourier.com/c-logo/deliverytiger-logo.png" },
  { key: "sundarban", name: "Sundarban Courier", bnName: "Sundarban ", logo: "https://api.bdcourier.com/c-logo/sundarban-logo.png" },
  { key: "saparibahan", name: "SA Paribahan", bnName: "  ", logo: "https://api.bdcourier.com/c-logo/saparibahan-logo.png" },
];
