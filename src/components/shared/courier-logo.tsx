"use client";

import React, { useState } from "react";
import { Truck } from "lucide-react";

interface CourierBrandLogoProps {
  name: string;
  logoUrl?: string;
  className?: string;
}

export function CourierBrandLogo({ name, logoUrl, className = "h-4 w-4" }: CourierBrandLogoProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const normalized = (name || "").toLowerCase().trim();

  // If external image is provided and hasn't failed, render with cross-origin safety
  if (logoUrl && !imgFailed) {
    return (
      <img
        src={logoUrl}
        alt={name}
        className={`${className} object-contain rounded shrink-0`}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        onError={() => setImgFailed(true)}
      />
    );
  }

  // Pixel-perfect SVG brand badges for Bangladeshi couriers
  if (normalized.includes("pathao")) {
    return (
      <span
        className={`${className} inline-flex items-center justify-center rounded-md bg-[#EE2A24] text-white font-black text-[9px] shrink-0 shadow-2xs select-none`}
        title="Pathao Express"
      >
        P
      </span>
    );
  }

  if (normalized.includes("steadfast")) {
    return (
      <span
        className={`${className} inline-flex items-center justify-center rounded-md bg-[#0066cc] text-white font-black text-[9px] shrink-0 shadow-2xs select-none`}
        title="SteadFast Courier"
      >
        S
      </span>
    );
  }

  if (normalized.includes("redx")) {
    return (
      <span
        className={`${className} inline-flex items-center justify-center rounded-md bg-[#E11D48] text-white font-black text-[9px] shrink-0 shadow-2xs select-none`}
        title="RedX Logistics"
      >
        X
      </span>
    );
  }

  if (normalized.includes("paperfly")) {
    return (
      <span
        className={`${className} inline-flex items-center justify-center rounded-md bg-[#0284C7] text-white font-black text-[9px] shrink-0 shadow-2xs select-none`}
        title="PaperFly Delivery"
      >
        PF
      </span>
    );
  }

  if (normalized.includes("carrybee")) {
    return (
      <span
        className={`${className} inline-flex items-center justify-center rounded-md bg-[#F59E0B] text-slate-900 font-black text-[9px] shrink-0 shadow-2xs select-none`}
        title="CarryBee"
      >
        CB
      </span>
    );
  }

  if (normalized.includes("parceldex")) {
    return (
      <span
        className={`${className} inline-flex items-center justify-center rounded-md bg-[#8B5CF6] text-white font-black text-[9px] shrink-0 shadow-2xs select-none`}
        title="ParcelDex"
      >
        PD
      </span>
    );
  }

  if (normalized.includes("courrierfast") || normalized.includes("courierfast")) {
    return (
      <span
        className={`${className} inline-flex items-center justify-center rounded-md bg-[#10B981] text-white font-black text-[9px] shrink-0 shadow-2xs select-none`}
        title="CourrierFast"
      >
        CF
      </span>
    );
  }

  if (normalized.includes("ecourier")) {
    return (
      <span
        className={`${className} inline-flex items-center justify-center rounded-md bg-[#059669] text-white font-black text-[9px] shrink-0 shadow-2xs select-none`}
        title="eCourier"
      >
        eC
      </span>
    );
  }

  if (normalized.includes("deliverytiger") || normalized.includes("tiger")) {
    return (
      <span
        className={`${className} inline-flex items-center justify-center rounded-md bg-[#FF5722] text-white font-black text-[9px] shrink-0 shadow-2xs select-none`}
        title="Delivery Tiger"
      >
        DT
      </span>
    );
  }

  if (normalized.includes("sundarban")) {
    return (
      <span
        className={`${className} inline-flex items-center justify-center rounded-md bg-[#0D9488] text-white font-black text-[9px] shrink-0 shadow-2xs select-none`}
        title="Sundarban Courier"
      >
        SC
      </span>
    );
  }

  if (normalized.includes("saparibahan") || normalized.includes("paribahan")) {
    return (
      <span
        className={`${className} inline-flex items-center justify-center rounded-md bg-[#1E3A8A] text-white font-black text-[9px] shrink-0 shadow-2xs select-none`}
        title="SA Paribahan"
      >
        SA
      </span>
    );
  }

  return (
    <span
      className={`${className} inline-flex items-center justify-center rounded-md bg-gray-700 text-white shrink-0 shadow-2xs select-none`}
      title={name || "Courier Hub"}
    >
      <Truck className="h-2.5 w-2.5" />
    </span>
  );
}
