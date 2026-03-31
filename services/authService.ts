import { apiRequest } from "./apiClient";

export const authService = {
  login: async (email: string, pin: string) => {
    return apiRequest("/login", {
      method: "POST",
      body: JSON.stringify({ email, password: pin }),
    });
  },

  signup: async (name: string, email: string, pin: string) => {
    return apiRequest("/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password: pin }),
    });
  },

  resetPin: async (email: string, pin: string) => {
    return apiRequest("/reset-pin", {
      method: "POST",
      body: JSON.stringify({ email, newPassword: pin }),
    });
  },

  verifyOtp: async (email: string, otp: string) => {
    return apiRequest("/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    });
  },

  forgotPin: async (email: string) => {
    return apiRequest("/forgot-pin", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  getMe: async () => {
    return apiRequest("/me");
  },

  updateMe: async (data: { name?: string; email?: string; password?: string; preferredLanguage?: string }) => {
    return apiRequest("/me", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
};
