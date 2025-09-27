// instance.js

import axios from "axios";
import Cookies from "js-cookie";

const BASE_URL = "https://backend.panthertaxis.mtscorporate.com/api";
const COOKIE_NAME = "token";

const instance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    Accept: "application/json",
  },
});

instance.interceptors.request.use(
  (config) => {
    try {
      const token = Cookies.get(COOKIE_NAME);
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    } catch (e) {
      console.error("Failed to get token from cookies:", e);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// getData ফাংশনটি ঠিক করা হয়েছে
export const getData = async (endpoint, id = null, params = {}) => {
  try {
    // এখানে পরিবর্তন করা হয়েছে: '/' সরানো হয়েছে
    const url = id ? `${endpoint}/${id}` : `${endpoint}`;
    const response = await instance.get(url, { params });
    return response.data;
  } catch (error) {
    console.error(`GET Error [/${endpoint}]:`, error);
    throw error;
  }
};

// postData, updateData এবং deleteData ফাংশনগুলোও একইভাবে ঠিক করা প্রয়োজন।
export const postData = async (endpoint, payload) => {
  try {
    const response = await instance.post(`${endpoint}`, payload);
    return response.data;
  } catch (error) {
    console.error(`POST Error [/${endpoint}]:`, error);
    throw error;
  }
};

export const updateData = async (endpoint, id, payload) => {
  try {
    const response = await instance.put(`${endpoint}/${id}`, payload);
    return response.data;
  } catch (error) {
    console.error(`PUT Error [/${endpoint}/${id}]:`, error);
    throw error;
  }
};

export const deleteData = async (endpoint, id) => {
  try {
    const response = await instance.delete(`${endpoint}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`DELETE Error [/${endpoint}/${id}]:`, error);
    throw error;
  }
};

export default instance;
