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
      console.log("🔍 [AUTH] Response Status:", res.status); // Try multiple possible data locations

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
        console.log("  - Exists:", subscriptionExists);
        console.log("  - Status:", subscriptionStatus);
        console.log("  - Full Object:", subscription);

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
  }; // ⚠️ এই ফাংশনগুলি এখন createGenericSubscription দ্বারা প্রতিস্থাপিত হবে (ঐতিহাসিক সামঞ্জস্যের জন্য রাখা হয়েছে)

  const startTrial = async (plan, paymentMethodId) => {
    // ... (logic)
    // এটি এখন createGenericSubscription কল করতে পারে বা এই লজিকটি সরাসরি ব্যবহার করা বন্ধ করতে পারে।
    // আপাতত, আমরা createGenericSubscription ব্যবহার করব।
    return await createGenericSubscription(
      paymentMethodId,
      plan?.priceId,
      true,
    );
  };
  const subscribe = async (plan, paymentMethodId) => {
    // ... (logic)
    // আপাতত, আমরা createGenericSubscription ব্যবহার করব।
    return await createGenericSubscription(
      paymentMethodId,
      plan?.priceId,
      false,
    );
  }; // ✅ পোস্টম্যানের ডেটা মডেল অনুযায়ী নতুন শক্তিশালী ফাংশন

  const createGenericSubscription = async (
    paymentMethodId,
    priceId,
    isInitialTrial = false,
  ) => {
    console.log("🔥 [GEN_SUB] createGenericSubscription Called with:");
    console.log("  - PaymentMethodId:", paymentMethodId);
    console.log("  - PriceId:", priceId);
    console.log("  - Is Initial Trial (initial):", isInitialTrial);
    console.log("  - User ID:", user?.id);
    if (!paymentMethodId || !user?.id) {
      const message =
        "Payment method ID বা User ID অনুপস্থিত। অনুগ্রহ করে লগইন করুন।";
      console.error("❌ [GEN_SUB] Validation Error:", message);
      toast.error(message);
      return { success: false, error: message };
    }

    try {
      // রিকোয়েস্ট বডি (Postman-এর Body-এর মতো)
      const requestBody = {
        paymentMethodId: paymentMethodId,
        userId: user.id, // আপনার ইউজার অবজেক্ট থেকে নেওয়া হলো
        priceId: priceId,
        initial: isInitialTrial, // Postman-এর 'initial' প্যারামিটার
      };

      console.log("📤 [GEN_SUB] Sending request to backend:", requestBody);
      const response = await instance.post(
        "/stripeSubscription/create-subscription", // <-- আপনার দেওয়া Endpoint
        requestBody,
      );

      if (isResponseSuccessful(response)) {
        console.log("✅ [GEN_SUB] Subscription API Call Successful!");
        toast.success("সাবস্ক্রিপশন প্রক্রিয়া সফল হয়েছে!"); // সফল হলে প্রোফাইল ডেটা রিফ্রেশ করুন
        setTimeout(() => fetchUserProfile(), 3000);
        return { success: true, data: response.data };
      } else {
        const errorMsg =
          response.data?.message || "সাবস্ক্রিপশন তৈরি করা যায়নি।";
        console.error("❌ [GEN_SUB] API returned non-success:", errorMsg);
        toast.error(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (error) {
      console.error("💣 [GEN_SUB] Exception occurred:", error);
      const errorMessage =
        error.response?.data?.message || error.message || "একটি সমস্যা হয়েছে।";
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
    createGenericSubscription, // ✅ নতুন ফাংশন
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
