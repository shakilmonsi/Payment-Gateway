import React, { useState, useEffect } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { toast } from "react-toastify";
import { useAuth } from "../../../../../featured/auth/AuthContext"; // ⚠️ আপনার সঠিক পাথ দিন

const CARD_ELEMENT_OPTIONS = {
  // কার্ড এলিমেন্টের স্টাইল অপশন
  style: {
    base: {
      fontSize: "16px",
      color: "#424770",
      "::placeholder": {
        color: "#aab7c4",
      },
    },
    invalid: {
      color: "#9e2146",
    },
  },
};

const StripePaymentForm = ({ plan, onPaymentSuccess, isTrial, buttonText }) => {
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();

  useEffect(() => {
    if (stripe && elements) {
      setIsReady(true);
      console.log(
        "🟢 [StripeForm] Stripe and Elements are ready! Button should be enabled.",
      );
    } else {
      setIsReady(false);
    }
  }, [stripe, elements]);

  const handleSubmit = async (event) => {
    if (event) event.preventDefault();

    // 🚨 CRITICAL LOG: এটিই ক্লিক ট্রিগার হলে আসবে
    console.log(
      "➡️ [StripeForm] Button click handler activated. Starting Stripe process...",
    );

    if (!isReady) {
      toast.error("Stripe is not fully loaded. Please wait a moment.");
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement || cardElement._empty || !cardElement._complete) {
      toast.error("অনুগ্রহ করে কার্ডের সম্পূর্ণ ও বৈধ তথ্য দিন।");
      return;
    }

    setLoading(true);

    try {
      console.log("➡️ [StripeForm] Calling stripe.createPaymentMethod...");
      const { paymentMethod, error } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
        billing_details: { email: user?.email, name: user?.name || "Customer" },
      });
      console.log(
        "⬅️ [StripeForm] Received response from stripe.createPaymentMethod.",
      );

      if (error) {
        toast.error(error.message);
        console.error(
          "❌ [StripeForm Error] Payment Method Creation Failed:",
          error,
        );
        return;
      }

      console.log(
        "✅ [StripeForm] Payment Method successfully created. ID:",
        paymentMethod.id,
      );

      // ⚠️ CRITICAL STEP: onPaymentSuccess কল (PricingSection-এর ফাংশন)
      console.log(
        "➡️ [StripeForm] Calling onPaymentSuccess (handleSubscriptionAction) to hit API...",
      );
      await onPaymentSuccess(plan, paymentMethod.id, isTrial);
      console.log("✅ [StripeForm] onPaymentSuccess call finished.");
    } catch (error) {
      console.error("💣 [StripeForm Catch Error]", error);
      toast.error(
        "পেমেন্ট প্রক্রিয়াকরণের সময় একটি অপ্রত্যাশিত ত্রুটি হয়েছে।",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    // 💡 ফর্ম সাবমিট লজিক এড়াতে onSubmit ছাড়াই form ট্যাগ
    <form className="relative z-20 flex flex-col gap-4">
      <div className="relative z-30 rounded-lg border border-gray-300 bg-gray-50 p-3">
        <CardElement options={CARD_ELEMENT_OPTIONS} />
      </div>

      <button
        // 💡 CRITICAL FIX: type="button" এবং onClick={handleSubmit}
        type="button"
        onClick={handleSubmit}
        disabled={!isReady || loading}
        // 💡 CSS FIX: বাটনটিকে অন্য সবকিছুর উপরে আনার জন্য
        style={{ zIndex: 9999, pointerEvents: "auto", position: "relative" }}
        className="inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-lg bg-blue-600 p-2.5 text-base font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Processing..." : buttonText}
      </button>

      {isTrial && (
        <p className="mt-1 text-center text-xs text-gray-500">
          আজ আপনার কোনো চার্জ কাটা হবে না। আমরা শুধুমাত্র ট্রায়ালের জন্য পেমেন্ট
          পদ্ধতি যাচাই করি।
        </p>
      )}
    </form>
  );
};

export default StripePaymentForm;
