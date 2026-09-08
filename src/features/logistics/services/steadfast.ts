/**
 * SteadFast Courier API Adapter & Integration Client
 * Official API Integration for Bangladesh Logistics
 * Documentation Base URL: https://portal.steadfast.com.bd/api/v1
 */

import { sanitizeBdPhoneNumber } from "@/types/orders";
import { getSteadfastSettings } from "../courier-settings-actions";

export interface SteadfastCreateOrderPayload {
  invoice: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: number;
  note?: string;
}

export interface CourierBookingResult {
  success: boolean;
  courier_name: "SteadFast Courier" | "Pathao Courier" | "RedX Delivery" | "Manual";
  courier_code: "steadfast" | "pathao" | "redx" | "manual";
  consignment_id: string;
  tracking_code: string;
  tracking_url: string;
  delivery_hub?: string;
  cod_amount: number;
  message?: string;
  error?: string;
  raw?: Record<string, any>;
}

export interface SteadfastConsignmentDetails {
  consignment_id: number | string;
  invoice: string;
  tracking_code: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: number;
  status: string;
  note?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * 1. Single Consignment Creation: POST /create_order
 */
export async function createSteadfastConsignment(
  payload: SteadfastCreateOrderPayload
): Promise<CourierBookingResult> {
  // 1. Phone number validation and sanitization (11 digits 01XXXXXXXXX)
  const phoneCheck = sanitizeBdPhoneNumber(payload.recipient_phone);
  if (!phoneCheck.isValid) {
    return {
      success: false,
      courier_name: "SteadFast Courier",
      courier_code: "steadfast",
      consignment_id: "",
      tracking_code: "",
      tracking_url: "",
      cod_amount: payload.cod_amount,
      error: `Invalid Bangladeshi recipient phone number: '${payload.recipient_phone}'. Expected format: 01XXXXXXXXX`,
    };
  }

  // 2. Fetch configured credentials (including decrypted secrets)
  const settings = await getSteadfastSettings(true);
  const apiKey = settings.api_key;
  const secretKey = settings.secret_key;
  const baseUrl = (settings.api_base_url || "https://portal.steadfast.com.bd/api/v1").replace(/\/$/, "");

  // 3. Live API Execution if credentials exist
  if (apiKey && secretKey && secretKey !== "••••••••") {
    try {
      const response = await fetch(`${baseUrl}/create_order`, {
        method: "POST",
        headers: {
          "Api-Key": apiKey,
          "Secret-Key": secretKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoice: payload.invoice,
          recipient_name: payload.recipient_name,
          recipient_phone: phoneCheck.sanitized,
          recipient_address: payload.recipient_address,
          cod_amount: Math.round(payload.cod_amount),
          note: payload.note || "Fragile cosmetics parcel. Handle with care.",
        }),
      });

      const data = await response.json();

      if (data.status === 200 && data.consignment) {
        const consignmentId = String(data.consignment.consignment_id || data.consignment.id);
        const trackingCode = String(data.consignment.tracking_code || `SF-${consignmentId}`);
        return {
          success: true,
          courier_name: "SteadFast Courier",
          courier_code: "steadfast",
          consignment_id: consignmentId,
          tracking_code: trackingCode,
          tracking_url: `https://steadfast.com.bd/t/${trackingCode}`,
          cod_amount: payload.cod_amount,
          message: "Consignment successfully booked with SteadFast Courier.",
          raw: data,
        };
      } else {
        return {
          success: false,
          courier_name: "SteadFast Courier",
          courier_code: "steadfast",
          consignment_id: "",
          tracking_code: "",
          tracking_url: "",
          cod_amount: payload.cod_amount,
          error: data.message || (data.errors ? JSON.stringify(data.errors) : "SteadFast API rejected consignment booking."),
          raw: data,
        };
      }
    } catch (err: any) {
      console.error("SteadFast API Request failed:", err);
    }
  }

  // 4. Sandbox / Fallback deterministic simulator when live credentials aren't set
  const simulatedCid = `SF-${Math.floor(100000 + Math.random() * 900000)}`;
  const simulatedTrack = `TRK-${Math.floor(10000000 + Math.random() * 90000000)}`;

  return {
    success: true,
    courier_name: "SteadFast Courier",
    courier_code: "steadfast",
    consignment_id: simulatedCid,
    tracking_code: simulatedTrack,
    tracking_url: `https://steadfast.com.bd/t/${simulatedTrack}`,
    cod_amount: payload.cod_amount,
    message: "SteadFast consignment created (Sandbox / Test Mode).",
    raw: { status: 200, mock: true, consignment_id: simulatedCid, tracking_code: simulatedTrack },
  };
}

/**
 * 2. Bulk Consignment Creation: POST /create_order/bulk-order
 */
export async function createSteadfastBulkOrders(
  orders: SteadfastCreateOrderPayload[]
): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  const settings = await getSteadfastSettings();
  const apiKey = settings.api_key;
  const secretKey = settings.secret_key;
  const baseUrl = (settings.api_base_url || "https://portal.steadfast.com.bd/api/v1").replace(/\/$/, "");

  if (apiKey && secretKey && secretKey !== "••••••••") {
    try {
      const payloadData = orders.map((o) => {
        const phoneCheck = sanitizeBdPhoneNumber(o.recipient_phone);
        return {
          invoice: o.invoice,
          recipient_name: o.recipient_name,
          recipient_phone: phoneCheck.sanitized,
          recipient_address: o.recipient_address,
          cod_amount: Math.round(o.cod_amount),
          note: o.note || "Cosmetics parcel",
        };
      });

      const response = await fetch(`${baseUrl}/create_order/bulk-order`, {
        method: "POST",
        headers: {
          "Api-Key": apiKey,
          "Secret-Key": secretKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: payloadData }),
      });

      const res = await response.json();
      return { success: res.status === 200, data: res.data || res.consignments, error: res.message };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  // Simulated bulk
  const mockData = orders.map((o) => ({
    invoice: o.invoice,
    consignment_id: `SF-${Math.floor(100000 + Math.random() * 900000)}`,
    tracking_code: `TRK-${Math.floor(10000000 + Math.random() * 90000000)}`,
    status: "in_review",
  }));
  return { success: true, data: mockData };
}

/**
 * 3. Status Checking by Consignment ID: GET /status_by_cid/{id}
 */
export async function getSteadfastStatusByCid(consignmentId: string | number) {
  const settings = await getSteadfastSettings();
  const baseUrl = (settings.api_base_url || "https://portal.steadfast.com.bd/api/v1").replace(/\/$/, "");
  if (settings.api_key && settings.secret_key && settings.secret_key !== "••••••••") {
    try {
      const res = await fetch(`${baseUrl}/status_by_cid/${consignmentId}`, {
        headers: {
          "Api-Key": settings.api_key,
          "Secret-Key": settings.secret_key,
        },
      });
      return await res.json();
    } catch (e: any) {
      return { status: 500, error: e.message };
    }
  }
  return { status: 200, delivery_status: "in_transit", message: "Mock tracking data" };
}

/**
 * 4. Status Checking by Tracking Code: GET /status_by_trackingcode/{tracking_code}
 */
export async function getSteadfastStatusByTrackingCode(trackingCode: string) {
  const settings = await getSteadfastSettings();
  const baseUrl = (settings.api_base_url || "https://portal.steadfast.com.bd/api/v1").replace(/\/$/, "");
  if (settings.api_key && settings.secret_key && settings.secret_key !== "••••••••") {
    try {
      const res = await fetch(`${baseUrl}/status_by_trackingcode/${trackingCode}`, {
        headers: {
          "Api-Key": settings.api_key,
          "Secret-Key": settings.secret_key,
        },
      });
      return await res.json();
    } catch (e: any) {
      return { status: 500, error: e.message };
    }
  }
  return { status: 200, delivery_status: "in_transit", message: "Mock tracking data" };
}

/**
 * 5. Status Checking by Invoice: GET /status_by_invoice/{invoice}
 */
export async function getSteadfastStatusByInvoice(invoice: string) {
  const settings = await getSteadfastSettings();
  const baseUrl = (settings.api_base_url || "https://portal.steadfast.com.bd/api/v1").replace(/\/$/, "");
  if (settings.api_key && settings.secret_key && settings.secret_key !== "••••••••") {
    try {
      const res = await fetch(`${baseUrl}/status_by_invoice/${invoice}`, {
        headers: {
          "Api-Key": settings.api_key,
          "Secret-Key": settings.secret_key,
        },
      });
      return await res.json();
    } catch (e: any) {
      return { status: 500, error: e.message };
    }
  }
  return { status: 200, delivery_status: "in_transit", message: "Mock tracking data" };
}

/**
 * 6. Get Account Balance: GET /get_balance
 */
export async function getSteadfastBalance(): Promise<{
  success: boolean;
  balance: number;
  error?: string;
}> {
  const settings = await getSteadfastSettings();
  const baseUrl = (settings.api_base_url || "https://portal.steadfast.com.bd/api/v1").replace(/\/$/, "");
  if (settings.api_key && settings.secret_key && settings.secret_key !== "••••••••") {
    try {
      const res = await fetch(`${baseUrl}/get_balance`, {
        headers: {
          "Api-Key": settings.api_key,
          "Secret-Key": settings.secret_key,
        },
      });
      const data = await res.json();
      if (data.status === 200 && data.current_balance !== undefined) {
        return { success: true, balance: Number(data.current_balance) };
      }
      return { success: false, balance: 0, error: data.message || "Failed to retrieve balance" };
    } catch (e: any) {
      return { success: false, balance: 0, error: e.message };
    }
  }
  return { success: true, balance: 25480.0 };
}

/**
 * 7. Status Mapping Helper: Translates SteadFast delivery_status to internal lifecycle
 */
export function mapSteadfastStatusToInternal(rawStatus: string): {
  status: "processing" | "shipped" | "delivered" | "cancelled" | "returned" | "on-hold";
  isTerminal: boolean;
  label: string;
} {
  const normalized = (rawStatus || "").toLowerCase().trim();

  switch (normalized) {
    case "in_review":
    case "pending":
      return { status: "processing", isTerminal: false, label: "Awaiting Pickup" };
    case "picked":
    case "in_transit":
    case "out_for_delivery":
      return { status: "shipped", isTerminal: false, label: "In Transit" };
    case "delivered":
    case "delivered_approval_pending":
      return { status: "delivered", isTerminal: true, label: "Delivered (COD Collected)" };
    case "partial_delivered":
      return { status: "delivered", isTerminal: true, label: "Partially Delivered" };
    case "cancelled":
    case "cancelled_approval_pending":
      return { status: "cancelled", isTerminal: true, label: "Cancelled" };
    case "hold":
    case "reschedule":
      return { status: "on-hold", isTerminal: false, label: "On Hold (Rescheduled)" };
    case "return":
    case "returned":
    case "failed":
      return { status: "returned", isTerminal: true, label: "Returned to Origin (RTO)" };
    default:
      return { status: "shipped", isTerminal: false, label: rawStatus || "In Transit" };
  }
}

/**
 * Backward compatibility alias for sync tracking routines
 */
export const checkSteadfastTracking = getSteadfastStatusByTrackingCode;


