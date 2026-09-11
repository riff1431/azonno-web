"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export interface CartItem {
  id: string; // unique item identifier (product_id or variant_id)
  product_id: string;
  variant_id?: string | null;
  sku?: string | null;
  name: string;
  slug: string;
  price: number;
  regular_price: number;
  image_url?: string | null;
  quantity: number;
  brand_name?: string | null;
  variant_label?: string | null;
}

export interface AppliedCoupon {
  id: string;
  code: string;
  type: "percentage" | "fixed" | "free_shipping";
  value: number;
  max_discount: number | null;
  min_cart_amount: number | null;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  discount: number;
  coupon: AppliedCoupon | null;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  restoreCart: (items: CartItem[], couponCode?: string) => void;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const supabase = createClient();

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("ecomx_cart");
      if (stored) {
        setItems(JSON.parse(stored));
      }
      const storedCoupon = localStorage.getItem("ecomx_coupon");
      if (storedCoupon) {
        setCoupon(JSON.parse(storedCoupon));
      }
    } catch (err) {
      console.warn("Failed to load cart from localStorage", err);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem("ecomx_cart", JSON.stringify(items));
      if (coupon) {
        localStorage.setItem("ecomx_coupon", JSON.stringify(coupon));
      } else {
        localStorage.removeItem("ecomx_coupon");
      }
    } catch (err) {
      console.warn("Failed to persist cart", err);
    }
  }, [items, coupon, isLoaded]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const addItem = (product: Omit<CartItem, "quantity">, quantity: number = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = React.useCallback(() => {
    setItems((prev) => (prev.length === 0 ? prev : []));
    setCoupon((prev) => (prev === null ? prev : null));
  }, []);

  const restoreCart = React.useCallback((newItems: CartItem[], couponCode?: string) => {
    if (Array.isArray(newItems) && newItems.length > 0) {
      setItems(newItems);
      try {
        localStorage.setItem("ecomx_cart", JSON.stringify(newItems));
      } catch (err) {
        console.warn("Failed to persist restored cart", err);
      }
    }
  }, []);

  // Subtotal calculation
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Discount calculation
  let discount = 0;
  if (coupon) {
    if (coupon.type === "percentage") {
      const rawDiscount = (subtotal * coupon.value) / 100;
      discount = coupon.max_discount
        ? Math.min(rawDiscount, coupon.max_discount)
        : rawDiscount;
    } else if (coupon.type === "fixed") {
      discount = Math.min(coupon.value, subtotal);
    }
  }

  // Apply coupon validation
  const applyCoupon = async (code: string): Promise<{ success: boolean; message: string }> => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return { success: false, message: "Please enter a coupon code" };

    const { data: found, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", trimmed)
      .eq("status", "active")
      .maybeSingle();

    if (error || !found) {
      return { success: false, message: "Invalid or expired coupon code." };
    }

    const now = new Date();
    if (found.expires_at && new Date(found.expires_at) < now) {
      return { success: false, message: "This coupon code has expired." };
    }

    if (found.starts_at && new Date(found.starts_at) > now) {
      return { success: false, message: "This coupon code is not active yet." };
    }

    if (found.usage_limit && (found.usage_count || 0) >= found.usage_limit) {
      return { success: false, message: "This coupon has reached its maximum usage limit." };
    }

    if (found.min_cart_amount && subtotal < found.min_cart_amount) {
      return {
        success: false,
        message: `Minimum order of ৳${found.min_cart_amount} required for this coupon.`,
      };
    }

    setCoupon({
      id: found.id,
      code: found.code,
      type: found.type,
      value: found.value,
      max_discount: found.max_discount,
      min_cart_amount: found.min_cart_amount,
    });

    return { success: true, message: `Coupon "${found.code}" applied successfully!` };
  };

  const removeCoupon = () => {
    setCoupon(null);
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        discount,
        coupon,
        isCartOpen,
        openCart,
        closeCart,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        restoreCart,
        applyCoupon,
        removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
