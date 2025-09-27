import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const BASE_URL = "https://backend-lbracks.mtscorporate.com/api";

// লোকাল স্টোরেজ থেকে প্রাথমিক ইউজার এবং টোকেন লোড করার হেল্পার ফাংশন
const loadAuthDataFromLocalStorage = () => {
  try {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    return {
      user: storedUser ? JSON.parse(storedUser) : null,
      token: storedToken || null,
    };
  } catch (error) {
    console.error("Failed to load auth data from localStorage", error);
    return { user: null, token: null };
  }
};

const { user: initialUser, token: initialToken } =
  loadAuthDataFromLocalStorage();

// --- AuthSlice Initial State ---
const initialState = {
  user: initialUser,
  token: initialToken,
  isLoading: false,
  error: null,
  success: null, // Success message for various operations
};

// --- Async Thunks ---
// 1. লগইন অ্যাসিনক্রোনাস অপারেশন
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password, rememberMe }, { rejectWithValue }) => {
    try {
      // NOTE: আপনার কোডে এখানে 'backend-ibracks' ব্যবহার করা হয়েছিল।
      // consistency-র জন্য BASE_URL ব্যবহার করা উচিত।
      const response = await fetch(`${BASE_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await response.json();

      if (response.ok) {
        // সফল হলে ডেটা রিটার্ন করুন
        localStorage.setItem("user", JSON.stringify(data.data.user));
        localStorage.setItem("token", data.data.token);
        return data.data; // user এবং token ধারণ করে
      } else {
        // ব্যর্থ হলে ত্রুটি বার্তা সহ rejectWithValue কল করুন
        return rejectWithValue(
          data.message || "Login failed. Please check your credentials.",
        );
      }
    } catch (err) {
      console.error("Login error:", err);
      return rejectWithValue("Network error or server unavailable.");
    }
  },
);

// 2. রেজিস্টার অ্যাসিনক্রোনাস অপারেশন
export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (
    { name, phoneNumber, email, password, confirmPassword, profileImage },
    { rejectWithValue },
  ) => {
    if (password !== confirmPassword) {
      return rejectWithValue("Passwords do not match.");
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      return rejectWithValue("Please enter a valid email address.");
    }

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("phoneNumber", phoneNumber);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("role", "user");
      formData.append("uid", crypto.randomUUID());

      if (profileImage) {
        formData.append("profileImage", profileImage);
      }

      // NOTE: আপনার কোডে এখানে 'backend-ibracks' ব্যবহার করা হয়েছিল।
      // consistency-র জন্য BASE_URL ব্যবহার করা উচিত।
      const response = await fetch(`${BASE_URL}/users/register`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("user", JSON.stringify(data.data.user));
        localStorage.setItem("token", data.data.token);
        return data.data; // user এবং token ধারণ করে
      } else {
        return rejectWithValue(
          data.message || "Registration failed. Please try again.",
        );
      }
    } catch (err) {
      console.error("Registration error:", err);
      return rejectWithValue("Network error or server unavailable.");
    }
  },
);

// 3. পাসওয়ার্ড আপডেট অ্যাসিনক্রোনাস অপারেশন
export const updatePassword = createAsyncThunk(
  "auth/updatePassword",
  async ({ userId, newPassword, token }, { rejectWithValue }) => {
    // টোকেন এখানে প্যারামিটার হিসেবে পাস করা হয়েছে
    try {
      const response = await fetch(`${BASE_URL}/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // এখানে টোকেন ব্যবহার করা হচ্ছে
        },
        body: JSON.stringify({ password: newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        return data.message || "Password updated successfully.";
      } else {
        return rejectWithValue(data.message || "Failed to update password.");
      }
    } catch (err) {
      console.error("Update password error:", err);
      return rejectWithValue("Network error or server unavailable.");
    }
  },
);

// 4. পাসওয়ার্ড রিসেট লিংক পাঠানোর অ্যাসিনক্রোনাস অপারেশন (Forgot Password)
export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (email, { rejectWithValue }) => {
    try {
      // এখানে `userId` এর পরিবর্তে `email` দিয়ে রিকোয়েস্ট যাবে।
      // আপনার `AuthProvider` কোডে `userId` ব্যবহার করা হয়েছিল, যা ভুল।
      // কারণ Forgot Password এর জন্য সাধারণত email পাঠানো হয়।
      const response = await fetch(`${BASE_URL}/users/forgot-password`, {
        // সঠিক এন্ডপয়েন্ট অনুমান করা হলো
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        return data.message || "Password reset link sent to your email.";
      } else {
        return rejectWithValue(
          data.message || "Failed to send password reset link.",
        );
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      return rejectWithValue("Network error or server unavailable.");
    }
  },
);

// --- AuthSlice Definition ---
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Reducers for synchronous state updates
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isLoading = false;
      state.error = null;
      state.success = null;
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    },
    clearAuthMessages: (state) => {
      // error and success messages clear করার জন্য
      state.error = null;
      state.success = null;
    },
    // Optionally, if you want to set user/token directly (e.g., from an external source)
    setUserAndToken: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      localStorage.setItem("user", JSON.stringify(action.payload.user));
      localStorage.setItem("token", action.payload.token);
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Login User ---
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.success = "Login successful!";
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload; // error message from rejectWithValue
        state.user = null;
        state.token = null;
      })
      // --- Register User ---
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user; // Auto-login after registration
        state.token = action.payload.token; // Auto-login after registration
        state.success = "User registered and logged in!";
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.user = null;
        state.token = null;
      })
      // --- Update Password ---
      .addCase(updatePassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(updatePassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = action.payload; // success message
      })
      .addCase(updatePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // --- Forgot Password ---
      .addCase(forgotPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = action.payload; // success message
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, clearAuthMessages, setUserAndToken } = authSlice.actions; // Synchronous actions
export default authSlice.reducer; // The reducer to be added to the store
