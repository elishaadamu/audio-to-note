import { API_URL } from "@/constants/Config";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export const getAuthToken = async () => {
  if (Platform.OS === "web") {
    return localStorage.getItem("AUTH_TOKEN");
  }
  return await SecureStore.getItemAsync("AUTH_TOKEN");
};

export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = await getAuthToken();
  
  const headers = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  } as any;

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};
