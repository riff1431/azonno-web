"use server";

import { getSetting, updateGroupSettings } from "@/lib/settings/config-service";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export interface ExpenseItem {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  paymentAccount?: string;
  createdAt: string;
}

export interface AccountItem {
  id: string;
  name: string;
  type: string;
  balance: number;
  accountNo: string;
  updatedAt: string;
}

export interface DueItem {
  id: string;
  entity: string;
  type: string;
  amount: number;
  paid: number;
  status: "due" | "partial" | "settled";
  dueDate: string;
  notes: string;
  createdAt?: string;
}

export interface InvestorItem {
  id: string;
  name: string;
  equity: string;
  capital: number;
  profitDistributed: number;
  contact: string;
  status: string;
}

const DEFAULT_EXPENSES: ExpenseItem[] = [
  {
    id: "exp-1",
    category: "Freight & Customs",
    amount: 45000,
    description: "Air cargo customs clearance from Incheon to Dhaka Airport (DAC)",
    date: "2026-08-28",
    paymentAccount: "BRAC Bank (Corporate Account)",
    createdAt: new Date("2026-08-28").toISOString(),
  },
  {
    id: "exp-2",
    category: "Packaging Materials",
    amount: 8500,
    description: "500x Custom branded holographic skincare mailer boxes & bubble wrap",
    date: "2026-08-25",
    paymentAccount: "bKash Merchant Wallet",
    createdAt: new Date("2026-08-25").toISOString(),
  },
  {
    id: "exp-3",
    category: "SMS Gateway",
    amount: 1500,
    description: "10,000 Masked transactional SMS credits (BulkSMSBD)",
    date: "2026-08-20",
    paymentAccount: "The City Bank (Merchant Account)",
    createdAt: new Date("2026-08-20").toISOString(),
  },
  {
    id: "exp-4",
    category: "Cloud Infrastructure",
    amount: 3200,
    description: "Supabase Pro tier + Cloudinary Media storage",
    date: "2026-08-01",
    paymentAccount: "BRAC Bank (Corporate Account)",
    createdAt: new Date("2026-08-01").toISOString(),
  },
];

const DEFAULT_ACCOUNTS: AccountItem[] = [
  {
    id: "acc-1",
    name: "BRAC Bank (Corporate Account)",
    type: "Asset (Bank)",
    balance: 485000,
    accountNo: "1501-XXXX-XXXX-001",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "acc-2",
    name: "The City Bank (Merchant Account)",
    type: "Asset (Bank)",
    balance: 210000,
    accountNo: "1102-XXXX-XXXX-002",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "acc-3",
    name: "bKash Merchant Wallet",
    type: "Asset (MFS)",
    balance: 65400,
    accountNo: "017XXXXXXXX",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "acc-4",
    name: "SteadFast Courier COD Receivable",
    type: "Asset (Receivable)",
    balance: 45200,
    accountNo: "SF-M-8823",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "acc-5",
    name: "Cash in Hand (Petty Cash)",
    type: "Asset (Cash)",
    balance: 18500,
    accountNo: "HQ-VAULT-01",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "acc-6",
    name: "Seoul Wholesale Supplier Payable",
    type: "Liability (Payable)",
    balance: -120000,
    accountNo: "SUP-KR-01",
    updatedAt: new Date().toISOString(),
  },
];

const DEFAULT_DUES: DueItem[] = [
  {
    id: "due-1",
    entity: "SteadFast Courier",
    type: "Receivable (COD Remittance)",
    amount: 45200,
    paid: 0,
    status: "due",
    dueDate: "2026-09-04",
    notes: "COD collection for 34 delivered orders in Dhaka & Chattogram",
    createdAt: new Date("2026-09-01").toISOString(),
  },
  {
    id: "due-2",
    entity: "Seoul Cosmetics Wholesale Ltd",
    type: "Payable (Supplier Stock)",
    amount: 120000,
    paid: 40000,
    status: "partial",
    dueDate: "2026-09-15",
    notes: "Balance for August 500x COSRX Snail Essence shipment",
    createdAt: new Date("2026-08-20").toISOString(),
  },
  {
    id: "due-3",
    entity: "Pathao Courier",
    type: "Receivable (COD Remittance)",
    amount: 18450,
    paid: 0,
    status: "due",
    dueDate: "2026-09-08",
    notes: "COD collection for 14 delivered parcels",
    createdAt: new Date("2026-09-02").toISOString(),
  },
];

const DEFAULT_INVESTORS: InvestorItem[] = [
  {
    id: "inv-1",
    name: "Rahim Chowdhury",
    equity: "35.0%",
    capital: 2500000,
    profitDistributed: 185000,
    contact: "+880 1819-112233",
    status: "Active Stakeholder",
  },
  {
    id: "inv-2",
    name: "Tanzim Hasan",
    equity: "15.0%",
    capital: 1000000,
    profitDistributed: 78000,
    contact: "+880 1711-445566",
    status: "Active Stakeholder",
  },
];

/* =========================================================================
   DYNAMIC P&L ENGINE (Calculated Real-Time from Supabase Orders & Expenses)
   ========================================================================= */

export interface DetailedPnLData {
  grossRevenue: number;
  productSalesSubtotal: number;
  deliveryCollected: number;
  discountsTotal: number;
  orderCount: number;
  cogsTotal: number;
  grossProfit: number;
  grossMarginPct: number;
  expensesTotal: number;
  shippingCarrierExpenses: number;
  smsAndMarketingExpenses: number;
  packagingExpenses: number;
  freightAndCustomsExpenses: number;
  otherOperatingExpenses: number;
  expensesByCategory: Record<string, number>;
  netProfit: number;
  netMarginPct: number;
  dateRange: string;
}

export async function getDetailedPnL(dateRange: string = "all"): Promise<DetailedPnLData> {
  const supabase = createAdminClient();

  // 1. Fetch Orders
  let query = supabase.from("orders").select("id, total, subtotal, shipping_amount, discount_amount, status, created_at");

  if (dateRange === "today") {
    const today = new Date().toISOString().split("T")[0];
    query = query.gte("created_at", today);
  } else if (dateRange === "7d") {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    query = query.gte("created_at", d.toISOString());
  } else if (dateRange === "this_month") {
    const d = new Date();
    const firstDay = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
    query = query.gte("created_at", firstDay);
  }

  const { data: orders } = await query;
  const orderList = orders || [];

  const grossRevenue = orderList.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const productSalesSubtotal = orderList.reduce((sum, o) => sum + Number(o.subtotal || o.total || 0), 0);
  const deliveryCollected = orderList.reduce((sum, o) => sum + Number(o.shipping_amount || 0), 0);
  const discountsTotal = orderList.reduce((sum, o) => sum + Number(o.discount_amount || 0), 0);

  // 2. Calculate COGS (Standard 55% procurement landing cost for authentic Korean/UK imported cosmetics)
  const cogsTotal = Math.round(productSalesSubtotal * 0.55);
  const grossProfit = Math.max(0, grossRevenue - cogsTotal);
  const grossMarginPct = grossRevenue > 0 ? Math.round((grossProfit / grossRevenue) * 100) : 45;

  // 3. Fetch Operational Expenses
  const expenses = await getExpenses();
  const expensesByCategory: Record<string, number> = {};
  let expensesTotal = 0;

  for (const exp of expenses) {
    const amt = Number(exp.amount || 0);
    expensesTotal += amt;
    expensesByCategory[exp.category] = (expensesByCategory[exp.category] || 0) + amt;
  }

  // Estimated courier dispatch fee based on order count
  const shippingCarrierExpenses = (expensesByCategory["Courier & Logistics"] || 0) + (orderList.length * 55);
  const smsAndMarketingExpenses = (expensesByCategory["SMS Gateway"] || 0) + (expensesByCategory["Marketing & Ads"] || 0);
  const packagingExpenses = expensesByCategory["Packaging Materials"] || 0;
  const freightAndCustomsExpenses = expensesByCategory["Freight & Customs"] || 0;
  const otherOperatingExpenses = Math.max(
    0,
    expensesTotal - (packagingExpenses + freightAndCustomsExpenses + (expensesByCategory["SMS Gateway"] || 0) + (expensesByCategory["Marketing & Ads"] || 0))
  );

  const totalOpex = expensesTotal + (orderList.length * 55);
  const netProfit = grossProfit - totalOpex;
  const netMarginPct = grossRevenue > 0 ? Math.round((netProfit / grossRevenue) * 100) : 0;

  return {
    grossRevenue,
    productSalesSubtotal,
    deliveryCollected,
    discountsTotal,
    orderCount: orderList.length,
    cogsTotal,
    grossProfit,
    grossMarginPct,
    expensesTotal: totalOpex,
    shippingCarrierExpenses,
    smsAndMarketingExpenses,
    packagingExpenses,
    freightAndCustomsExpenses,
    otherOperatingExpenses,
    expensesByCategory,
    netProfit,
    netMarginPct,
    dateRange,
  };
}

/* =========================================================================
   EXPENSES ACTIONS
   ========================================================================= */

export async function getExpenses(): Promise<ExpenseItem[]> {
  const expenses = await getSetting<ExpenseItem[]>("finance", "expenses", DEFAULT_EXPENSES);
  return expenses || DEFAULT_EXPENSES;
}

export async function addExpense(data: {
  category: string;
  amount: number;
  description: string;
  date: string;
  paymentAccount?: string;
}): Promise<ExpenseItem[]> {
  const current = await getExpenses();
  const newExpense: ExpenseItem = {
    id: `exp-${Date.now()}`,
    category: data.category.trim(),
    amount: Math.abs(Number(data.amount)),
    description: data.description.trim(),
    date: data.date || new Date().toISOString().split("T")[0],
    paymentAccount: data.paymentAccount || undefined,
    createdAt: new Date().toISOString(),
  };

  const updated = [newExpense, ...current];
  await updateGroupSettings("finance", { expenses: updated });

  // If a payment account was specified, deduct amount from account balance
  if (data.paymentAccount) {
    try {
      const accounts = await getAccounts();
      const targetAcc = accounts.find((a) => a.name === data.paymentAccount || a.id === data.paymentAccount);
      if (targetAcc) {
        await saveAccount({
          id: targetAcc.id,
          name: targetAcc.name,
          type: targetAcc.type,
          balance: targetAcc.balance - Math.abs(Number(data.amount)),
          accountNo: targetAcc.accountNo,
        });
      }
    } catch {}
  }

  revalidatePath("/admin/finance/costs");
  revalidatePath("/admin/finance/pnl");
  revalidatePath("/admin/finance/accounting");
  return updated;
}

export async function deleteExpense(id: string): Promise<ExpenseItem[]> {
  const current = await getExpenses();
  const updated = current.filter((e) => e.id !== id);
  await updateGroupSettings("finance", { expenses: updated });
  revalidatePath("/admin/finance/costs");
  revalidatePath("/admin/finance/pnl");
  return updated;
}

/* =========================================================================
   ACCOUNTING & BALANCES ACTIONS
   ========================================================================= */

export async function getAccounts(): Promise<AccountItem[]> {
  const accounts = await getSetting<AccountItem[]>("finance", "accounts", DEFAULT_ACCOUNTS);
  return accounts || DEFAULT_ACCOUNTS;
}

export async function saveAccount(data: {
  id?: string;
  name: string;
  type: string;
  balance: number;
  accountNo: string;
}): Promise<AccountItem[]> {
  const current = await getAccounts();
  let updated: AccountItem[];

  if (data.id) {
    updated = current.map((a) =>
      a.id === data.id
        ? {
            ...a,
            name: data.name.trim(),
            type: data.type.trim(),
            balance: Number(data.balance),
            accountNo: data.accountNo.trim(),
            updatedAt: new Date().toISOString(),
          }
        : a
    );
  } else {
    const newAcc: AccountItem = {
      id: `acc-${Date.now()}`,
      name: data.name.trim(),
      type: data.type.trim(),
      balance: Number(data.balance),
      accountNo: data.accountNo.trim(),
      updatedAt: new Date().toISOString(),
    };
    updated = [...current, newAcc];
  }

  await updateGroupSettings("finance", { accounts: updated });
  revalidatePath("/admin/finance/accounting");
  return updated;
}

export async function transferFunds(data: {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  notes?: string;
}): Promise<{ success: boolean; accounts: AccountItem[]; error?: string }> {
  const amt = Math.abs(Number(data.amount));
  if (amt <= 0) return { success: false, accounts: await getAccounts(), error: "Invalid transfer amount." };

  const current = await getAccounts();
  const fromAcc = current.find((a) => a.id === data.fromAccountId);
  const toAcc = current.find((a) => a.id === data.toAccountId);

  if (!fromAcc || !toAcc) {
    return { success: false, accounts: current, error: "Source or destination account not found." };
  }

  const updated = current.map((a) => {
    if (a.id === data.fromAccountId) {
      return { ...a, balance: a.balance - amt, updatedAt: new Date().toISOString() };
    }
    if (a.id === data.toAccountId) {
      return { ...a, balance: a.balance + amt, updatedAt: new Date().toISOString() };
    }
    return a;
  });

  await updateGroupSettings("finance", { accounts: updated });
  revalidatePath("/admin/finance/accounting");
  return { success: true, accounts: updated };
}

export async function deleteAccount(id: string): Promise<AccountItem[]> {
  const current = await getAccounts();
  const updated = current.filter((a) => a.id !== id);
  await updateGroupSettings("finance", { accounts: updated });
  revalidatePath("/admin/finance/accounting");
  return updated;
}

/* =========================================================================
   DUES & SETTLEMENTS ACTIONS
   ========================================================================= */

export async function getDues(): Promise<DueItem[]> {
  const dues = await getSetting<DueItem[]>("finance", "dues", DEFAULT_DUES);
  return dues || DEFAULT_DUES;
}

export async function addDue(data: {
  entity: string;
  type: string;
  amount: number;
  dueDate: string;
  notes?: string;
}): Promise<DueItem[]> {
  const current = await getDues();
  const newDue: DueItem = {
    id: `due-${Date.now()}`,
    entity: data.entity.trim(),
    type: data.type.trim(),
    amount: Math.abs(Number(data.amount)),
    paid: 0,
    status: "due",
    dueDate: data.dueDate,
    notes: data.notes?.trim() || "",
    createdAt: new Date().toISOString(),
  };

  const updated = [newDue, ...current];
  await updateGroupSettings("finance", { dues: updated });
  revalidatePath("/admin/finance/dues");
  return updated;
}

export async function settleDue(
  id: string,
  paymentAmount: number,
  depositAccountId?: string,
  notes?: string
): Promise<DueItem[]> {
  const current = await getDues();
  const due = current.find((d) => d.id === id);
  const amt = Math.abs(Number(paymentAmount));

  const updated = current.map((d) => {
    if (d.id !== id) return d;
    const newPaid = d.paid + amt;
    const newStatus: "due" | "partial" | "settled" =
      newPaid >= d.amount ? "settled" : newPaid > 0 ? "partial" : "due";
    return {
      ...d,
      paid: newPaid,
      status: newStatus,
      notes: notes ? `${d.notes} [Settlement: ৳${amt} - ${notes}]` : d.notes,
    };
  });

  await updateGroupSettings("finance", { dues: updated });

  // If receiving Courier COD remittance into Bank, automatically increment Bank balance
  if (depositAccountId && due) {
    try {
      const accounts = await getAccounts();
      const targetAcc = accounts.find((a) => a.id === depositAccountId || a.name === depositAccountId);
      if (targetAcc) {
        await saveAccount({
          id: targetAcc.id,
          name: targetAcc.name,
          type: targetAcc.type,
          balance: targetAcc.balance + amt,
          accountNo: targetAcc.accountNo,
        });
      }
    } catch {}
  }

  revalidatePath("/admin/finance/dues");
  revalidatePath("/admin/finance/accounting");
  return updated;
}

export async function deleteDue(id: string): Promise<DueItem[]> {
  const current = await getDues();
  const updated = current.filter((d) => d.id !== id);
  await updateGroupSettings("finance", { dues: updated });
  revalidatePath("/admin/finance/dues");
  return updated;
}

/* =========================================================================
   INVESTORS & EQUITY ACTIONS
   ========================================================================= */

export async function getInvestors(): Promise<InvestorItem[]> {
  const investors = await getSetting<InvestorItem[]>("finance", "investors", DEFAULT_INVESTORS);
  return investors || DEFAULT_INVESTORS;
}

export async function addInvestor(data: {
  name: string;
  equity: string;
  capital: number;
  contact: string;
  status: string;
}): Promise<InvestorItem[]> {
  const current = await getInvestors();
  const newInv: InvestorItem = {
    id: `inv-${Date.now()}`,
    name: data.name.trim(),
    equity: data.equity.includes("%") ? data.equity : `${data.equity}%`,
    capital: Math.abs(Number(data.capital)),
    profitDistributed: 0,
    contact: data.contact.trim(),
    status: data.status.trim() || "Active Stakeholder",
  };

  const updated = [...current, newInv];
  await updateGroupSettings("finance", { investors: updated });
  revalidatePath("/admin/finance/investors");
  return updated;
}

export async function distributeProfit(
  id: string,
  amount: number,
  paymentAccountId?: string
): Promise<InvestorItem[]> {
  const amt = Math.abs(Number(amount));
  const current = await getInvestors();
  const updated = current.map((inv) => {
    if (inv.id !== id) return inv;
    return {
      ...inv,
      profitDistributed: inv.profitDistributed + amt,
    };
  });

  await updateGroupSettings("finance", { investors: updated });

  // If a payment account was specified, deduct dividend payment from account balance
  if (paymentAccountId) {
    try {
      const accounts = await getAccounts();
      const targetAcc = accounts.find((a) => a.id === paymentAccountId || a.name === paymentAccountId);
      if (targetAcc) {
        await saveAccount({
          id: targetAcc.id,
          name: targetAcc.name,
          type: targetAcc.type,
          balance: targetAcc.balance - amt,
          accountNo: targetAcc.accountNo,
        });
      }
    } catch {}
  }

  revalidatePath("/admin/finance/investors");
  revalidatePath("/admin/finance/accounting");
  return updated;
}

export async function deleteInvestor(id: string): Promise<InvestorItem[]> {
  const current = await getInvestors();
  const updated = current.filter((inv) => inv.id !== id);
  await updateGroupSettings("finance", { investors: updated });
  revalidatePath("/admin/finance/investors");
  return updated;
}
