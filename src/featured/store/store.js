import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice"; // আপনার authSlice এর পাথ

export const store = configureStore({
  reducer: {
    auth: authReducer, // 'auth' key এর অধীনে authSlice reducer যোগ করা হয়েছে
    // আপনার অন্যান্য slice reducer গুলি এখানে যোগ করুন
  },
});
