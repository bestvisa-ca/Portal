// TestStripePaymentPage.tsx — Plan A + Option B (in-layout hydration) + userInfo + testCase gate
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { NoSidebarLayout } from "../site-layouts/NoSidebarLayout"; // uses Site-Navbar internally
import { Button } from "../components/ui/button";
import { Loader2, Lock, ShieldCheck, RefreshCw, Info } from "lucide-react";
import { useUser } from "../site-contexts/UserContext"; // only used inside UserHydrator

// --- Brand palette ---
const BRAND = {
  light: "#efefef",
  primary: "#a4262c",
  navy: "#011d41",
  white: "#ffffff",
};

// --- Stripe ---
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

// --- Local dev token endpoint ---
const LOCAL_TOKEN_URL =
  import.meta.env.VITE_LOCAL_GET_TOKEN_URL ?? "http://localhost:3001/api/get-token";
const isLocalDev = import.meta.env.MODE === "development";

// --- Flow endpoints (unchanged) ---
const FLOW_URLS = {
  bv_payment_status: {
    local: import.meta.env.VITE_BV_PAYMENT_STATUS_LOCAL,
    powerpages: "/_api/cloudflow/v1.0/trigger/f03b3e9b-0672-f011-bec2-6045bd5dca91",
  },
  payment_intent_creation: {
    local: import.meta.env.VITE_PAYMENT_INTENT_LOCAL,
    powerpages: "/_api/cloudflow/v1.0/trigger/564677df-c675-f011-b4cc-002248ae768f",
  },
  pp_payment_creation: {
    local: import.meta.env.VITE_PP_PAYMENT_CREATION_LOCAL,
    powerpages: "/_api/cloudflow/v1.0/trigger/5af8c913-d275-f011-b4cc-002248ad99ee",
  },
  pp_payment_update: {
    local: import.meta.env.VITE_PP_PAYMENT_UPDATE_LOCAL,
    powerpages: "/_api/cloudflow/v1.0/trigger/483cfd9c-d375-f011-b4cc-6045bd5dca91",
  },
};

// --- Local token cache ---
let _cachedLocalToken: string | null = null;
let _cachedLocalTokenAt = 0;
const LOCAL_TOKEN_TTL = 4 * 60 * 1000; // 4 minutes

async function getLocalAccessToken(): Promise<string> {
  if (_cachedLocalToken && Date.now() - _cachedLocalTokenAt < LOCAL_TOKEN_TTL) return _cachedLocalToken;
  const res = await fetch(LOCAL_TOKEN_URL, { method: "POST" });
  if (!res.ok) throw new Error("Failed to get local access token");
  const j = await res.json();
  const token = j.accessToken ?? j.access_token ?? j.token;
  if (!token) throw new Error("get-token did not return an access token.");
  _cachedLocalToken = token;
  _cachedLocalTokenAt = Date.now();
  return token;
}

// --- Flow call wrapper (unchanged) ---
async function callFlow(urlLocal: string, urlPP: string, body: object) {
  if (isLocalDev) {
    const token = await getLocalAccessToken();
    const res = await fetch(urlLocal, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("Local flow call failed");
    return await res.json();
  } else {
    const response = await (window as any).shell.ajaxSafePost({
      type: "POST",
      url: urlPP,
      data: { eventData: JSON.stringify(body) },
    });
    return JSON.parse(response);
  }
}

// --- Small UI components ---
function Heading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-6 text-center">
      <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 ring-1 ring-black/10 bg-[#011d41] text-white">
        <ShieldCheck className="h-4 w-4" />
        <span className="text-xs font-semibold tracking-wide">Secure Checkout</span>
      </div>
      <h1 className="text-2xl font-bold" style={{ color: BRAND.navy }}>
        {title}
      </h1>
      {subtitle && <p className="mt-1 text-sm text-neutral-600">{subtitle}</p>}
    </header>
  );
}

function Banner({
  tone,
  children,
}: {
  tone: "info" | "error" | "success";
  children: React.ReactNode;
}) {
  const toneStyles = {
    info: { base: "bg-[#efefef] ring-black/10", bar: "bg-[#011d41]" },
    error: { base: "bg-red-50 ring-red-200", bar: "bg-[#a4262c]" },
    success: { base: "bg-green-50 ring-green-200", bar: "bg-emerald-600" },
  } as const;
  return (
    <div className={`relative overflow-hidden rounded-xl ring ${toneStyles[tone].base}`}>
      <div className={`absolute left-0 top-0 h-full w-1 ${toneStyles[tone].bar}`} />
      <div className="px-4 py-3 pl-5 text-sm">{children}</div>
    </div>
  );
}

// --- Checkout Form ---
const CheckoutForm = ({
  amount,
  description,
  bvPaymentId,
  onPaymentSuccess,
  onPaymentFailure,
}: any) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const cardElementOptions = useMemo(
    () => ({
      style: {
        base: {
          color: BRAND.navy,
          fontFamily: "Inter, system-ui, sans-serif",
          fontSmoothing: "antialiased",
          fontSize: "16px",
          iconColor: BRAND.primary,
          "::placeholder": { color: "#9ca3af" },
        },
        invalid: { color: BRAND.primary, iconColor: BRAND.primary },
      },
    }),
    []
  );

  async function updatePaymentStatus(ppPaymentId: string, statusCode: number) {
    await callFlow(
      FLOW_URLS.pp_payment_update.local,
      FLOW_URLS.pp_payment_update.powerpages,
      { pp_payment_id: ppPaymentId, pp_paymentstatus: statusCode }
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;
    setIsProcessing(true);
    setErrorMessage(null);
    let newPpPaymentId: string | null = null;

    try {
      const intentResponse = await callFlow(
        FLOW_URLS.payment_intent_creation.local,
        FLOW_URLS.payment_intent_creation.powerpages,
        { amount: Math.round(amount * 100), currency: "cad" }
      );
      const clientSecret = intentResponse.client_secret;
      if (!clientSecret) throw new Error("Failed to create Payment Intent.");

      const ppPaymentResponse = await callFlow(
        FLOW_URLS.pp_payment_creation.local,
        FLOW_URLS.pp_payment_creation.powerpages,
        {
          userid: isLocalDev ? import.meta.env.VITE_LOCAL_DEV_USER_ID : undefined,
          bv_payment_id: bvPaymentId,
          pp_paymentidentifier: intentResponse.id,
          pp_paymentmethod: "stripe",
        }
      );

      newPpPaymentId = ppPaymentResponse.pp_payment_id;
      if (!newPpPaymentId) throw new Error("Failed to get payment record ID.");

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error("Card element not found.");

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      });

      if (error) throw new Error(error.message || "Payment error");

      if (paymentIntent?.status === "succeeded") {
        await updatePaymentStatus(newPpPaymentId, 3);
        onPaymentSuccess();
      } else {
        await updatePaymentStatus(newPpPaymentId, 2);
        throw new Error(`Payment failed: ${paymentIntent?.status || "unknown"}`);
      }
    } catch (err: any) {
      if (newPpPaymentId) await updatePaymentStatus(newPpPaymentId, 2);
      setErrorMessage(err.message);
      onPaymentFailure(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Heading title="Complete your payment" subtitle={description} />

      <div className="rounded-2xl border p-4 ring-1 ring-black/5 bg-[#f9fafb]">
        <div className="mb-3">
          <span className="block text-sm text-neutral-600 mb-1">Description</span>
          <span className="block font-medium leading-snug" style={{ color: BRAND.navy }}>
            {description}
          </span>
        </div>
        <div className="flex items-center justify-between border-t pt-2">
          <span className="text-sm text-neutral-600">Amount</span>
          <span className="text-lg font-bold" style={{ color: BRAND.navy }}>
            ${amount.toFixed(2)} CAD
          </span>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <CardElement options={cardElementOptions} />
      </div>
      <p className="mt-2 text-xs text-neutral-500">
        Use test card 4242 4242 4242 4242 with any future date & CVC.
      </p>

      {errorMessage && <Banner tone="error">{errorMessage}</Banner>}

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="group w-full gap-2 rounded-2xl px-6 py-4 text-base font-semibold text-white shadow transition disabled:opacity-60"
        style={{ backgroundColor: BRAND.primary }}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" /> Processing...
          </>
        ) : (
          <>
            <Lock className="h-5 w-5" /> Pay now
          </>
        )}
      </Button>

      <div className="flex items-start gap-2 text-xs text-neutral-600">
        <Info className="mt-0.5 h-4 w-4" />
        <p>
          Your payment details are encrypted and processed by Stripe. We do not store your card
          information.
        </p>
      </div>
    </form>
  );
};

// --- Hydrate user INSIDE the provider (Option B) ---
function UserHydrator({
  first,
  last,
  profileImage,
}: {
  first?: string;
  last?: string;
  profileImage?: string;
}) {
  const { setUser } = useUser();
  useEffect(() => {
    if (first || last) {
      setUser({
        firstName: first ?? "",
        lastName: last ?? "",
        profileImage: profileImage ?? "/default-avatar.png",
      });
    }
  }, [first, last, profileImage, setUser]);
  return null;
}

// --- Page ---
export default function PaymentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const bvPaymentId = searchParams.get("id");
  const returnUrl = searchParams.get("returnUrl");

  type PageStatus = "loading" | "invalid" | "paid" | "pending" | "error" | "forbidden";
  const [status, setStatus] = useState<PageStatus>("loading");
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState("");

  // Keep user fields locally, then hydrate in-layout via UserHydrator
  const [first, setFirst] = useState<string>("");
  const [last, setLast] = useState<string>("");
  const [photo, setPhoto] = useState<string>("");

  useEffect(() => {
    if (!bvPaymentId) return setStatus("invalid");
    checkPaymentStatus(bvPaymentId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bvPaymentId]);

function handleSuccessRedirect() {
  if (!returnUrl) {
    // For home page, you can still use React Router
    navigate("/", { replace: true });
    return;
  }

  // For any returnUrl, just use window.location to ensure it works
  // This will work for both internal and external URLs
  try {
    // If it's a relative URL, make it absolute
    const targetUrl = returnUrl.startsWith('/') 
      ? window.location.origin + returnUrl 
      : returnUrl;
    
    console.log("Redirecting to:", targetUrl);
    window.location.href = targetUrl;
  } catch (error) {
    console.error("Redirect failed:", error);
    // Fallback to home
    navigate("/", { replace: true });
  }
}



  async function checkPaymentStatus(pid: string) {
    setStatus("loading");
    try {
      const res = await callFlow(
        FLOW_URLS.bv_payment_status.local,
        FLOW_URLS.bv_payment_status.powerpages,
        {
          pid,
          // NEW: include userid so Flow can verify ownership (local dev uses env var)
          userid: isLocalDev ? import.meta.env.VITE_LOCAL_DEV_USER_ID : undefined,
        }
      );

      // If your Flow now wraps user data under res.userInfo and enforces testCase, keep this:
      const ui = res?.userInfo ?? res ?? {};
      const f = ui.firstName ?? ui.firstname ?? "";
      const l = ui.lastName ?? ui.lastname ?? "";
      const p = ui.profileimage
        ? `data:image/png;base64,${ui.profileimage}`
        : ui.profileImage ?? ui.photoUrl ?? "/default-avatar.png";

      setFirst(f);
      setLast(l);
      setPhoto(p);

      // Optional gate if you're using res.testCase:
      if (res?.testCase === false) {
        setStatus("invalid"); // or "forbidden" if you already have that state
        return;
      }

      if (res.result === "invalid") setStatus("invalid");
      else if (res.result === "paid") setStatus("paid");
      else if (res.result === "pending") {
        setAmount(res.amount);
        setDescription(res.description);
        setStatus("pending");
      } else setStatus("error");
    } catch {
      setStatus("error");
    }
  }


  const StatusView = () => {
    if (status === "loading") return <Banner tone="info">Checking payment status...</Banner>;
    if (status === "invalid") return <Banner tone="error">Invalid payment link.</Banner>;
    if (status === "forbidden")
      return (
        <div className="space-y-3">
          <Banner tone="error">
            This test page is restricted to test users. If you believe this is a mistake, please contact support.
          </Banner>
          <Button
            onClick={() => navigate("/")}
            className="text-white"
            style={{ backgroundColor: BRAND.primary }}
          >
            Go home
          </Button>
        </div>
      );
    if (status === "paid")
      return (
        <div className="space-y-3">
          <Banner tone="success">
            Your payment is successful. The following processes may take a few seconds to apply.
          </Banner>
          <Button
            onClick={handleSuccessRedirect}
            style={{ backgroundColor: BRAND.primary }}
            className="text-white"
          >
            Continue
          </Button>
        </div>
      );
    if (status === "error")
      return (
        <div className="space-y-3">
          <Banner tone="error">Something went wrong.</Banner>
          <Button
            variant="outline"
            onClick={() => bvPaymentId && checkPaymentStatus(bvPaymentId)}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" /> Retry
          </Button>
        </div>
      );
    return null;
  };

  return (
    <NoSidebarLayout navbarVariant="simple">
      {/* Hydrate user inside the provider used by NoSidebarLayout (which renders Site-Navbar) */}
      <UserHydrator first={first} last={last} profileImage={photo} />

      <div className="min-h-screen w-full p-4" style={{ backgroundColor: BRAND.light }}>
        <div className="mx-auto max-w-md rounded-3xl bg-white p-6 shadow-lg ring-1 ring-black/5 md:p-8">
          {status !== "pending" ? (
            <>
              <Heading title="Payment status" />
              <StatusView />
            </>
          ) : (
            <Elements stripe={stripePromise}>
              <CheckoutForm
                amount={amount}
                description={description}
                bvPaymentId={bvPaymentId as string}
                onPaymentSuccess={() => setStatus("paid")}
                onPaymentFailure={() => setStatus("error")}
              />
            </Elements>
          )}
        </div>
        <p className="mx-auto mt-6 max-w-md text-center text-xs text-neutral-500">
          Test environment • CAD • Contact support for help.
        </p>
      </div>
    </NoSidebarLayout>
  );
}
