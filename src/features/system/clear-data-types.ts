export interface DataClearableFeature {
  id: string;
  nameBn: string;
  nameEn: string;
  category: string;
  descriptionBn: string;
  descriptionEn: string;
  impactWarning: string;
  severity: "high" | "medium" | "low" | "critical";
}

export const CLEARABLE_FEATURES: DataClearableFeature[] = [
  {
    id: "pixels_tracking",
    nameBn: "Meta Pixel & TikTok Pixel Tracking :00 (Meta / TikTok Pixel & CAPI)",
    nameEn: "Meta Pixel, TikTok Pixel & CAPI Tracking Data",
    category: "Marketing",
    descriptionBn: "All Meta Pixel ID, items Pixel ID,  API  and Test  Code  ।",
    descriptionEn: "Resets Meta Pixel ID, TikTok Pixel ID, Conversion API access tokens, and test event codes.",
    impactWarning: "   Tracking permanently  ।",
    severity: "medium",
  },
  {
    id: "marketing_logs",
    nameBn: "Marketing     (Marketing & Event Logs)",
    nameEn: "Marketing & Conversion Event Logs",
    category: "Marketing",
    descriptionBn: " Pixel  , Server- CAPI   and    ।",
    descriptionEn: "Purges integration logs, CAPI event history, and diagnostic server records.",
    impactWarning: " Marketing Tracking      ।",
    severity: "low",
  },
  {
    id: "abandoned_checkouts",
    nameBn: "Complete    :00 (Abandoned Checkouts & Incomplete Leads)",
    nameEn: "Abandoned Checkouts & Incomplete Leads",
    category: "Fraud & Leads",
    descriptionBn: "   Phone Number, Customers  Order and   :00  ।",
    descriptionEn: "Permanently purges all captured lead phone numbers and abandoned checkout records.",
    impactWarning: "Complete Order  Complete   ।",
    severity: "medium",
  },
  {
    id: "orders_transactions",
    nameBn: "Order  Payment  (Orders & Transactions Data)",
    nameEn: "Orders, Order Items & Transaction History",
    category: "Orders",
    descriptionBn: " Customers Order,  , Payment  and Status   Complete    ।",
    descriptionEn: "Permanently deletes all orders, order line items, status histories, and payment logs.",
    impactWarning: " Order    and     !",
    severity: "critical",
  },
  {
    id: "reviews_qa",
    nameBn: " Reviews  Question-Answer (Customer Reviews & Q&A)",
    nameEn: "Customer Reviews & Product Q&A",
    category: "Storefront",
    descriptionBn: "Products   Customers Reviews, items,  and Products Question-Answer  ।",
    descriptionEn: "Deletes all customer reviews, ratings, user photos, and answered/pending questions.",
    impactWarning: "Products  Reviews  items    ।",
    severity: "high",
  },
  {
    id: "coupons_vouchers",
    nameBn: "Coupon Code   use  (Coupons & Usage Logs)",
    nameEn: "Coupons, Promos & Usage Logs",
    category: "Promotions",
    descriptionBn: " Active  Inactive Coupon Code and  User Coupon use     ।",
    descriptionEn: "Deletes all discount codes, promo campaigns, and user redemption histories.",
    impactWarning: "   Coupon  Discount  ।",
    severity: "medium",
  },
  {
    id: "finance_expenses_dues",
    nameBn: "     (Expenses & Dues Ledger)",
    nameEn: "Expenses, Costs & Dues Ledger",
    category: "Finance",
    descriptionBn: "  , , SMS  and  Courier  Reset ।",
    descriptionEn: "Clears all logged operating costs, expense records, and pending dues entries.",
    impactWarning: "      Authentic Order :00  ।",
    severity: "high",
  },
  {
    id: "system_cache",
    nameBn: " Cash    (System Cache & Redis Store)",
    nameEn: "System Cache & Config Cache Store",
    category: "System",
    descriptionBn: "Server  - Cash, Module Status Cash  Settings  ।",
    descriptionEn: "Flushes in-memory cache, revalidates all paths, and syncs live database state.",
    impactWarning: " :00   ,  Cash  ।",
    severity: "low",
  },
];
