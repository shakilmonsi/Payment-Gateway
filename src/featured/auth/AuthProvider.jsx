import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import instance from "../../utils/axiosInstance";
import { toast } from "react-toastify";
import { AuthContext } from "./AuthContext";

const COOKIE_NAME = "token";

const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!Cookies.get(COOKIE_NAME),
  );
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const setToken = (token) => {
    Cookies.set(COOKIE_NAME, token, {
      expires: 7,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      path: "/",
    });
    instance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  };

  const clearToken = () => {
    Cookies.remove(COOKIE_NAME, {
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      path: "/",
    });
    delete instance.defaults.headers.common["Authorization"];
  };

  const normalizeEmail = (email) => {
    return email ? email.trim().toLowerCase() : "";
  };

  const isResponseSuccessful = (res) => {
    return (
      res.data?.success === true ||
      res.status === 200 ||
      res.status === 201 ||
      (res.status >= 200 && res.status < 300)
    );
  };

  const fetchUserProfile = async () => {
    try {
      console.log("🔄 [AUTH] Fetching user profile...");
      const res = await instance.get("user/profile");

      console.log("🔍 [AUTH] Full API Response:", res);
      console.log("🔍 [AUTH] Response Data:", res.data);
      console.log("🔍 [AUTH] Response Status:", res.status);

      // Try multiple possible data locations
      let currentUser = null;
      if (res.data.data) {
        currentUser = res.data.data;
        console.log("✅ [AUTH] User found in res.data.data");
      } else if (res.data.user) {
        currentUser = res.data.user;
        console.log("✅ [AUTH] User found in res.data.user");
      } else if (res.data && res.data.id) {
        currentUser = res.data;
        console.log("✅ [AUTH] User found in res.data directly");
      } else {
        console.log("❌ [AUTH] No user data found in response");
        console.log("Available keys in response:", Object.keys(res.data));
      }

      if (currentUser) {
        console.log("🔍 [AUTH] Current User Object:", currentUser);
        console.log("🔍 [AUTH] User ID:", currentUser.id);
        console.log("🔍 [AUTH] User Email:", currentUser.email);
        console.log("🔍 [AUTH] User Subscription:", currentUser.subscription);
        console.log("🔍 [AUTH] User hasUsedTrial:", currentUser.hasUsedTrial);

        const subscription = currentUser.subscription;
        const subscriptionStatus = subscription?.status;
        const subscriptionExists = !!subscription;

        console.log("🚨 [AUTH] Subscription Analysis:");
        console.log("  - Exists:", subscriptionExists);
        console.log("  - Status:", subscriptionStatus);
        console.log("  - Full Object:", subscription);

        const calculatedHasUsedTrial =
          subscriptionExists || currentUser.hasUsedTrial || false;

        const userData = {
          ...currentUser,
          isSubscribed: subscriptionStatus === "active",
          hasUsedTrial: calculatedHasUsedTrial,
        };

        console.log("✅ [AUTH] Final User Data to Set:", userData);
        setUser(userData);
        setIsAuthenticated(true);

        return userData;
      } else {
        console.log("❌ [AUTH] No valid user data found");
        clearToken();
        setIsAuthenticated(false);
        return null;
      }
    } catch (error) {
      console.error("❌ [AUTH] Profile fetch error:", error);
      console.error("❌ [AUTH] Error response:", error.response?.data);
      console.error("❌ [AUTH] Error status:", error.response?.status);

      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log("🚪 [AUTH] Auth error - clearing token");
        clearToken();
        setIsAuthenticated(false);
      }
      return null;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const token = Cookies.get(COOKIE_NAME);
      console.log("🔄 [AUTH] Initializing auth. Token exists:", !!token);

      if (token) {
        console.log("🔑 [AUTH] Token found:", token.substring(0, 20) + "...");
        instance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        await fetchUserProfile();
      } else {
        console.log("❌ [AUTH] No token found");
      }
      setLoading(false);
      console.log("💡 [AUTH] Initialization complete.");
    };
    initializeAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const normalizedEmail = normalizeEmail(email);
      const res = await instance.post("/auth/login", {
        email: normalizedEmail,
        password,
      });

      const token = res.data.token;

      if (token) {
        setToken(token);
        const userData = await fetchUserProfile();

        if (userData) {
          setLoading(false);
          return {
            success: true,
            message: res.data.message,
            user: userData,
          };
        } else {
          setLoading(false);
          const message = "Failed to fetch user data after login.";
          setError(message);
          return { success: false, message };
        }
      } else {
        setLoading(false);
        const message = res.data?.message || "Invalid email or password.";
        setError(message);
        return { success: false, message };
      }
    } catch (err) {
      setLoading(false);
      console.error("❌ [AUTH] Login error:", err);
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "An unexpected error occurred during login.";
      setError(message);
      return { success: false, message };
    }
  };

  const logout = () => {
    clearToken();
    setUser(null);
    setIsAuthenticated(false);
    console.log("👋 [AUTH] User logged out.");
  };

  const registerUser = async (userData) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const normalizedUserData = {
        ...userData,
        email: normalizeEmail(userData.email),
      };

      const formData = new FormData();

      Object.keys(normalizedUserData).forEach((key) => {
        if (
          normalizedUserData[key] !== null &&
          normalizedUserData[key] !== undefined
        ) {
          formData.append(key, normalizedUserData[key]);
        }
      });

      const res = await instance.post("/auth/registration", formData);

      if (isResponseSuccessful(res)) {
        const message = res.data?.message || "Registration successful!";
        setSuccess(message);
        return { success: true, user: res.data, requiresVerification: true };
      } else {
        const message =
          res.data?.message || res.data?.error || "Registration failed";
        setError(message);
        return { success: false, message };
      }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Registration failed. An unexpected error occurred.";
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const sendCode = async (email) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const normalizedEmail = normalizeEmail(email);
      const res = await instance.post("/auth/send-code", {
        email: normalizedEmail,
      });

      if (isResponseSuccessful(res)) {
        const message = res.data?.message || "Verification code sent!";
        setSuccess(message);
        return { success: true, message };
      } else {
        const message =
          res.data?.message ||
          res.data?.error ||
          "Failed to send verification code.";
        setError(message);
        return { success: false, message };
      }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Error sending verification code.";
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async (email, code) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const normalizedEmail = normalizeEmail(email);
      const normalizedCode = code.toString().trim();

      const res = await instance.post("/auth/verify-email", {
        email: normalizedEmail,
        code: normalizedCode,
      });

      if (isResponseSuccessful(res)) {
        const message = res.data?.message || "Email verified successfully!";
        setSuccess(message);
        return { success: true, message };
      } else {
        const message =
          res.data?.message || res.data?.error || "Invalid verification code.";
        setError(message);
        return { success: false, message };
      }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Error verifying email.";
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async (email) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const normalizedEmail = normalizeEmail(email);
      const res = await instance.post("/auth/resend-code", {
        email: normalizedEmail,
      });

      if (isResponseSuccessful(res)) {
        const message = res.data?.message || "New code sent successfully!";
        setSuccess(message);
        return { success: true, message };
      } else {
        const message =
          res.data?.message || res.data?.error || "Failed to resend code.";
        setError(message);
        return { success: false, message };
      }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Error resending code.";
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email, newPassword) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const normalizedEmail = normalizeEmail(email);
      const res = await instance.put("/auth/reset-password", {
        email: normalizedEmail,
        newPassword,
      });

      if (isResponseSuccessful(res)) {
        const message = res.data?.message || "Password reset successfully!";
        setSuccess(message);
        return { success: true, message };
      } else {
        const message =
          res.data?.message || res.data?.error || "Failed to reset password.";
        setError(message);
        return { success: false, message };
      }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Error resetting password.";
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  // 🚀 Enhanced Trial function with comprehensive debugging
  const startTrial = async (plan, paymentMethodId) => {
    console.log("🔥 [TRIAL] StartTrial Called with:");
    console.log("  - Plan:", plan);
    console.log("  - PaymentMethodId:", paymentMethodId);
    console.log("  - User Email:", user?.email);
    console.log(
      "  - Current Token:",
      Cookies.get(COOKIE_NAME)?.substring(0, 20) + "...",
    );
    console.log("  - Current User State:", user);

    // Enhanced validation
    if (
      !paymentMethodId ||
      typeof paymentMethodId !== "string" ||
      paymentMethodId.length < 5
    ) {
      const message = "Payment method ID is missing or invalid.";
      console.error("❌ [TRIAL] Validation Error:", message);
      toast.error(message);
      return { success: false, error: message };
    }

    if (!user?.email) {
      const message = "User email not found. Please login again.";
      console.error("❌ [TRIAL] User validation error:", message);
      toast.error(message);
      return { success: false, error: message };
    }

    // Check current subscription status
    console.log(
      "🔍 [TRIAL] Pre-check - Current subscription:",
      user?.subscription,
    );
    console.log("🔍 [TRIAL] Pre-check - Has used trial:", user?.hasUsedTrial);

    if (
      user?.hasUsedTrial ||
      user?.subscription?.status === "trialing" ||
      user?.subscription?.status === "active"
    ) {
      const message = "Trial already used or subscription active.";
      console.error("❌ [TRIAL] Already used/active:", message);
      toast.error("আপনি আগেই ট্রায়াল ব্যবহার করেছেন বা সাবস্ক্রিপশন আছে।");
      return { success: false, error: message };
    }

    try {
      const requestBody = {
        email: user.email,
        priceId: plan?.priceId,
        useTrial: true,
        paymentMethodId: paymentMethodId,
      };

      console.log("📤 [TRIAL] Sending request to backend:");
      console.log("  - URL: /stripeSubscription/create-subscription");
      console.log("  - Body:", requestBody);

      const response = await instance.post(
        "/stripeSubscription/create-subscription",
        requestBody,
      );

      console.log("📥 [TRIAL] Backend Response:");
      console.log("  - Status:", response.status);
      console.log("  - Data:", response.data);
      console.log("  - Headers:", response.headers);

      if (isResponseSuccessful(response)) {
        console.log("✅ [TRIAL] API Success! Processing response...");

        // Immediate UI update with response data
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 10);

        const newSubscriptionData = {
          id: response.data.subscriptionId || `temp_${Date.now()}`,
          subscriptionId: response.data.subscriptionId,
          status: "trialing",
          trialEndsAt: trialEndDate.toISOString(),
          customerId: response.data.customerId,
          customerEmail: user.email,
          planId: plan.priceId,
          planName: plan.title,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userId: user.id,
        };

        console.log(
          "🔄 [TRIAL] Updating user state with:",
          newSubscriptionData,
        );

        setUser((prevUser) => {
          const updatedUser = {
            ...prevUser,
            subscription: newSubscriptionData,
            hasUsedTrial: true,
            isSubscribed: false, // trialing, not active subscription
          };
          console.log("✅ [TRIAL] User state updated to:", updatedUser);
          return updatedUser;
        });

        console.log(
          "🔄 [TRIAL] UI updated immediately. Scheduling backend sync...",
        );

        // Schedule background profile refresh
        setTimeout(async () => {
          try {
            console.log("🔄 [TRIAL] Refreshing profile from backend...");
            const updatedProfile = await fetchUserProfile();
            console.log("✅ [TRIAL] Profile refresh complete:", updatedProfile);
          } catch (error) {
            console.error(
              "⚠️ [TRIAL] Background profile refresh failed:",
              error,
            );
          }
        }, 3000);

        toast.success(
          "ট্রায়াল সফলভাবে শুরু হয়েছে! ১০ দিনের জন্য সব ফিচার ব্যবহার করুন।",
        );
        return { success: true, data: response.data };
      } else {
        const errorMsg =
          response.data?.message ||
          response.data?.error ||
          "ট্রায়াল শুরু করা যায়নি।";
        console.error("❌ [TRIAL] API returned non-success:", errorMsg);
        toast.error(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (error) {
      console.error("❌ [TRIAL] Exception occurred:");
      console.error("  - Error:", error);
      console.error("  - Response Status:", error.response?.status);
      console.error("  - Response Data:", error.response?.data);
      console.error("  - Request Config:", error.config);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।";

      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // 🚀 Enhanced Subscribe function
  const subscribe = async (plan, paymentMethodId) => {
    console.log("🔥 [SUB] Subscribe Called with:");
    console.log("  - Plan:", plan);
    console.log("  - PaymentMethodId:", paymentMethodId);
    console.log("  - User Email:", user?.email);

    if (
      !paymentMethodId ||
      typeof paymentMethodId !== "string" ||
      paymentMethodId.length < 5
    ) {
      const message = "Payment method ID is missing or invalid.";
      console.error("❌ [SUB] Validation Error:", message);
      toast.error(message);
      return { success: false, error: message };
    }

    if (!user?.email) {
      const message = "User email not found. Please login again.";
      console.error("❌ [SUB] User validation error:", message);
      toast.error(message);
      return { success: false, error: message };
    }

    try {
      const requestBody = {
        email: user.email,
        priceId: plan?.priceId,
        paymentMethodId: paymentMethodId,
      };

      console.log("📤 [SUB] Request Body:", requestBody);

      const response = await instance.post(
        "/stripeSubscription/create-subscription",
        requestBody,
      );

      console.log("📥 [SUB] Response:", response.status, response.data);

      if (isResponseSuccessful(response)) {
        console.log("✅ [SUB] Success!");

        if (response.data.redirectUrl) {
          window.location.href = response.data.redirectUrl;
        } else {
          // Update state for active subscription
          setUser((prevUser) => ({
            ...prevUser,
            subscription: {
              ...prevUser?.subscription,
              id: response.data.subscriptionId,
              subscriptionId: response.data.subscriptionId,
              status: "active",
              customerId: response.data.customerId,
              customerEmail: user.email,
              planId: plan.priceId,
              planName: plan.title,
              planAmount: plan.price,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              userId: user.id,
            },
            isSubscribed: true,
            hasUsedTrial: true,
          }));

          setTimeout(() => fetchUserProfile(), 3000);
          toast.success("সাবস্ক্রিপশন সফল হয়েছে!");
        }
        return { success: true, data: response.data };
      } else {
        const errorMsg =
          response.data?.message || "সাবস্ক্রিপশন ব্যর্থ হয়েছে।";
        console.error("❌ [SUB] Error:", errorMsg);
        toast.error(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (error) {
      console.error("❌ [SUB] Exception:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "একটি সমস্যা হয়েছে।";

      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const deleteAccount = async () => {
    return { success: false, message: "Failed to delete account." };
  };

  const value = {
    isAuthenticated,
    user,
    loading,
    error,
    success,
    setError,
    setSuccess,
    login,
    logout,
    registerUser,
    sendCode,
    verifyEmail,
    resendCode,
    resetPassword,
    fetchUserProfile,
    startTrial,
    subscribe,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
