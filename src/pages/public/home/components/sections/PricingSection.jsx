import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { RiCheckboxCircleLine } from "react-icons/ri";

// Stripe Imports
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

import { useAuth } from "../../../../../featured/auth/AuthContext";
import StripePaymentForm from "../Stripe/StripePaymentForm";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const PricingSection = () => {
  const [loading, setLoading] = useState({});
  const [selectedPlan, setSelectedPlan] = useState(null);

  const { user, isAuthenticated, startTrial, subscribe } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("🔍 [PRICING] Component mounted/updated");
    console.log("🔍 [PRICING] Is Authenticated:", isAuthenticated);
    console.log("🔍 [PRICING] User Object:", user);
    console.log("🔍 [PRICING] User Subscription:", user?.subscription);
    console.log("🔍 [PRICING] User hasUsedTrial:", user?.hasUsedTrial);
  }, [user, isAuthenticated]);

  const pricingData = [
    {
      id: "monthly_plan",
      title: "Monthly Subscription",
      price: "£5/monthly",
      period: "Per Month",
      trial: "10-Day FREE Trial",
      trialNote: "No payment required",
      priceId: "price_1SBprCFJTw8ifWpVxapLpW5c",
      features: [
        "Daily vehicle checks",
        "Full history & export",
        "Expiry date reminders",
        "Useful Links",
        "Email support",
        "Cancel anytime",
      ],
      isAnnual: false,
    },
    {
      id: "annual_plan",
      title: "Annual Subscription",
      price: "£99/year",
      period: "Annual",
      trial: "10-Day FREE Trial",
      trialNote: "No payment required",
      priceId: "price_1SBpnBFJTw8ifWpVj3NZQmjD",
      features: [
        "Daily vehicle checks",
        "Full history & export",
        "Expiry date reminders",
        "Useful Links",
        "Priority email support",
        "Advanced analytics",
        "Cancel anytime",
      ],
      isAnnual: true,
    },
  ];

  // **ENHANCED SUBSCRIPTION ACTION HANDLER**
  const handleSubscriptionAction = async (plan, paymentMethodId, isTrial) => {
    console.log("🎯 [PRICING] handleSubscriptionAction called:");
    console.log("  - Plan:", plan);
    console.log("  - PaymentMethodId:", paymentMethodId);
    console.log("  - Is Trial:", isTrial);
    console.log("  - Current User:", user);

    // Validate payment method
    if (!paymentMethodId || typeof paymentMethodId !== "string") {
      toast.error("পেমেন্ট মেথড সিলেক্ট করুন।");
      return;
    }

    setLoading((prev) => ({ ...prev, [plan.id]: true }));
    setSelectedPlan(null); // Close payment form

    // Check priceId
    if (!plan.priceId || plan.priceId.includes("_ID_HERE")) {
      toast.error(
        "প্ল্যানের priceId সেট করা হয়নি। অ্যাডমিনের সাথে যোগাযোগ করুন।",
      );
      setLoading((prev) => ({ ...prev, [plan.id]: false }));
      return;
    }

    try {
      const planData = {
        id: plan.id,
        priceId: plan.priceId,
        title: plan.title,
        price: plan.price,
        paymentMethodId: paymentMethodId,
      };

      console.log(
        "📤 [PRICING] Calling",
        isTrial ? "startTrial" : "subscribe",
        "with:",
        planData,
      );

      let result;
      if (isTrial) {
        result = await startTrial(planData, paymentMethodId);
      } else {
        result = await subscribe(planData, paymentMethodId);
      }

      console.log("📥 [PRICING] Action result:", result);

      if (result && result.success) {
        // Handle redirect case
        if (result.redirect && result.data?.redirectUrl) {
          console.log("🔄 [PRICING] Redirecting to Stripe checkout");
          return; // Don't show toast, user will be redirected
        }

        toast.success(
          isTrial
            ? "ট্রায়াল সফলভাবে শুরু হয়েছে! ১০ দিনের জন্য সব ফিচার ব্যবহার করুন।"
            : "সাবস্ক্রিপশন প্রক্রিয়া সফল হয়েছে!",
        );
      } else {
        const errorMessage =
          result?.error ||
          result?.message ||
          "প্রক্রিয়া সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।";

        toast.error(errorMessage);
        console.error("❌ [PRICING] Action failed:", result);
      }
    } catch (error) {
      console.error("❌ [PRICING] Exception:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "একটি সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।";

      toast.error(errorMessage);
    } finally {
      setLoading((prev) => ({ ...prev, [plan.id]: false }));
    }
  };

  const handleButtonClick = (plan, isTrial) => {
    console.log("🖱️ [PRICING] Button clicked:", plan.title, "Trial:", isTrial);

    if (!isAuthenticated) {
      console.log("⚠️ [PRICING] User not authenticated, redirecting to login");
      toast.warn("অনুগ্রহ করে লগইন করুন।");
      navigate("/login");
      return;
    }

    console.log("✅ [PRICING] User authenticated, showing payment form");
    setSelectedPlan({ ...plan, isTrial });
  };

  const handleManageSubscription = () => {
    console.log("🔧 [PRICING] Manage subscription clicked");
    toast.info(
      "আপনি ইতিমধ্যে সাবস্ক্রাইব করেছেন। এখানে আপনার প্ল্যান ম্যানেজ করুন।",
    );
    navigate("/dashboard/subscription");
  };

  // **ENHANCED USER STATUS LOGIC** - এটাই মূল সমস্যা ছিল
  const getUserStatus = () => {
    console.log("🔍 [PRICING] getUserStatus called");
    console.log("🔍 [PRICING] User object:", JSON.stringify(user, null, 2));

    if (!isAuthenticated) {
      console.log("📝 [PRICING] Status: Not authenticated");
      return {
        showTrialButton: true,
        showSubscribeButton: true,
        showManageButton: false,
        statusText: "লগইন করুন",
      };
    }

    const subscription = user?.subscription;
    const subscriptionStatus = subscription?.status;
    const hasUsedTrial = user?.hasUsedTrial;

    console.log("🔍 [PRICING] Status Analysis:");
    console.log("  - Subscription exists:", !!subscription);
    console.log("  - Subscription status:", subscriptionStatus);
    console.log("  - Has used trial (user field):", hasUsedTrial);
    console.log("  - Calculated trial usage:", hasUsedTrial || !!subscription);

    // Active paid subscription
    if (subscriptionStatus === "active") {
      console.log("📝 [PRICING] Status: Active subscription");
      return {
        showTrialButton: false,
        showSubscribeButton: false,
        showManageButton: true,
        statusText: "সক্রিয় সাবস্ক্রিপশন",
      };
    }

    // Currently in trial period
    if (subscriptionStatus === "trialing") {
      console.log("📝 [PRICING] Status: Trial active");
      return {
        showTrialButton: false,
        showSubscribeButton: true,
        showManageButton: false,
        statusText: "ট্রায়াল চলছে",
      };
    }

    // Subscription cancelled or past due
    if (
      subscriptionStatus === "canceled" ||
      subscriptionStatus === "past_due"
    ) {
      console.log("📝 [PRICING] Status: Subscription issues");
      return {
        showTrialButton: false,
        showSubscribeButton: true,
        showManageButton: true,
        statusText: "সাবস্ক্রিপশন সমস্যা",
      };
    }

    // Has used trial (either explicitly marked or has/had subscription)
    if (hasUsedTrial === true || subscription) {
      console.log("📝 [PRICING] Status: Trial used, show subscribe only");
      return {
        showTrialButton: false,
        showSubscribeButton: true,
        showManageButton: false,
        statusText: "ট্রায়াল শেষ",
      };
    }

    // New user - no trial used, no subscription
    console.log("📝 [PRICING] Status: New user");
    return {
      showTrialButton: true,
      showSubscribeButton: true,
      showManageButton: false,
      statusText: "নতুন ব্যবহারকারী",
    };
  };

  const userStatus = getUserStatus();
  console.log("🎯 [PRICING] Final user status:", userStatus);

  return (
    <div
      id="pricing"
      className="flex w-full flex-col items-center justify-center gap-4 bg-blue-600/5 px-4 py-24 sm:px-12 md:px-16 lg:px-24"
    >
      <div className="flex max-w-7xl flex-col items-center justify-center gap-10">
        <div className="mb-5 flex flex-col items-center justify-start gap-4 text-center font-['Roboto']">
          <h1 className="text-3xl font-semibold text-neutral-800 sm:text-4xl md:text-5xl">
            Simple, Transparent Pricing
          </h1>
          <p className="text-sm font-normal text-neutral-600 sm:text-base">
            Start with a free trial, then choose the plan that works for you.
          </p>
          {isAuthenticated && (
            <div className="rounded-lg bg-blue-100 px-4 py-2">
              <p className="text-sm text-blue-800">
                আপনার বর্তমান স্ট্যাটাস:{" "}
                <span className="font-semibold">{userStatus.statusText}</span>
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex w-full max-w-5xl flex-col items-center justify-center gap-10 md:flex-row md:flex-wrap">
        {pricingData.map((plan) => (
          <div
            key={plan.id}
            className={`w-full max-w-sm transform overflow-hidden rounded-2xl shadow-[20px_20px_36px_0px_rgba(18,118,249,0.20)] transition-all duration-300 md:w-96 lg:w-96 ${
              plan.isAnnual
                ? "bg-blue-600 text-white"
                : "bg-white text-zinc-700"
            }`}
          >
            <div
              className={`flex w-full flex-col items-center justify-start gap-3 px-6 py-6 font-[Inter] ${
                plan.isAnnual
                  ? "bg-blue-600 text-white"
                  : "bg-white text-zinc-700"
              }`}
            >
              <div className="flex flex-col items-center justify-start gap-3 self-stretch">
                <div className="font-[Inter] text-xl font-[600]">
                  {plan.title}
                </div>
                <div className="text-3xl font-[700]">{plan.price}</div>
              </div>
              <div className="text-base font-normal capitalize">
                {plan.period}
              </div>
              <div
                className={`flex flex-col items-center justify-start self-stretch rounded-lg p-2 font-[600] outline outline-1 outline-offset-[-1px] ${
                  plan.isAnnual
                    ? "bg-blue-500/20 outline-blue-500/10"
                    : "bg-white outline-neutral-600/5"
                }`}
              >
                <div
                  className={`text-sm font-semibold ${
                    plan.isAnnual ? "text-white" : "text-yellow-900"
                  }`}
                >
                  {plan.trial}
                </div>
                <div
                  className={`text-xs font-normal ${
                    plan.isAnnual ? "text-white" : "text-yellow-900"
                  }`}
                >
                  {plan.trialNote}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-start gap-6 bg-[#FFF] px-5 pb-8 font-['Roboto']">
              <div className="flex w-full flex-col items-start justify-start gap-2 pt-6">
                {plan.features.map((feature, featureIndex) => (
                  <div
                    key={featureIndex}
                    className="inline-flex w-full items-center justify-start gap-3"
                  >
                    <RiCheckboxCircleLine className="h-5 w-5 flex-shrink-0 text-green-500" />
                    <div
                      className={`text-base font-normal ${
                        plan.isAnnual ? "text-[#747474]" : "text-neutral-500"
                      }`}
                    >
                      {feature}
                    </div>
                  </div>
                ))}
              </div>

              {/* **ENHANCED BUTTON SECTION** */}
              <div className="flex flex-col items-center justify-start gap-3 self-stretch font-['Roboto'] text-base font-semibold text-white">
                {selectedPlan?.id === plan.id ? (
                  <div className="w-full">
                    <Elements stripe={stripePromise}>
                      <StripePaymentForm
                        plan={plan}
                        onPaymentSuccess={handleSubscriptionAction}
                        isTrial={selectedPlan.isTrial}
                        buttonText={
                          selectedPlan.isTrial
                            ? "Confirm Free Trial"
                            : "Confirm Subscription"
                        }
                      />
                    </Elements>

                    <button
                      onClick={() => setSelectedPlan(null)}
                      className="mt-2 w-full text-sm text-red-500 hover:text-red-700"
                    >
                      Cancel
                    </button>
                  </div>
                ) : userStatus.showManageButton ? (
                  <button
                    className="inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-lg p-2.5 outline outline-1 outline-offset-[-1px] outline-blue-600 disabled:opacity-50"
                    onClick={handleManageSubscription}
                    disabled={loading[plan.id] || false}
                  >
                    <span className="text-base font-[600] text-blue-600">
                      Manage Subscription
                    </span>
                  </button>
                ) : (
                  <>
                    {userStatus.showTrialButton && (
                      <button
                        className="inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-lg bg-blue-600 p-2.5 transition-colors hover:bg-blue-700 disabled:opacity-50"
                        onClick={() => handleButtonClick(plan, true)}
                        disabled={loading[plan.id] || false}
                      >
                        <span className="text-base font-[600] text-white">
                          {loading[plan.id]
                            ? "শুরু হচ্ছে..."
                            : "Start Free Trial"}
                        </span>
                      </button>
                    )}

                    {userStatus.showSubscribeButton && (
                      <button
                        className="inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-lg p-2.5 outline outline-1 outline-offset-[-1px] outline-blue-600 transition-colors hover:bg-blue-50 disabled:opacity-50"
                        onClick={() => handleButtonClick(plan, false)}
                        disabled={loading[plan.id] || false}
                      >
                        <span className="text-base font-[600] text-blue-600">
                          {loading[plan.id]
                            ? "প্রক্রিয়া চলছে..."
                            : "Subscribe Now"}
                        </span>
                      </button>
                    )}
                  </>
                )}

                <div className="w-full text-center text-xs leading-tight font-normal text-neutral-600">
                  Cancel anytime • No hidden fees • Secure payments
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 max-w-4xl text-center">
        <div className="rounded-lg bg-white p-6 shadow-lg">
          <h3 className="mb-4 text-xl font-semibold text-gray-800">
            কেন আমাদের সার্ভিস বেছে নেবেন?
          </h3>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="mb-2 text-2xl">🚗</div>
              <h4 className="font-semibold">দৈনিক চেক</h4>
              <p className="text-sm text-gray-600">
                আপনার গাড়ির সব তথ্য দৈনিক আপডেট
              </p>
            </div>
            <div className="text-center">
              <div className="mb-2 text-2xl">📊</div>
              <h4 className="font-semibold">সম্পূর্ণ হিস্ট্রি</h4>
              <p className="text-sm text-gray-600">সব রেকর্ড এক্সপোর্ট করুন</p>
            </div>
            <div className="text-center">
              <div className="mb-2 text-2xl">⏰</div>
              <h4 className="font-semibold">রিমাইন্ডার</h4>
              <p className="text-sm text-gray-600">
                এক্সপায়ারি ডেটের আগে জানুন
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingSection;
