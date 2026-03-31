import { apiRequest } from "./apiClient";

export const authService = {
  login: async (email: string, pin: string) => {
    return apiRequest("/login", {
      method: "POST",
      body: JSON.stringify({ email, pin }), // Now takes pin
    });
  },

  signup: async (name: string, email: string, password: string, preferredLanguage: string = 'English') => {
    return apiRequest("/signup", {
      method: "POST",
      body: JSON.stringify({ name, email, password, preferredLanguage }),
    });
  },

  resetPin: async (email: string, pin: string, token: string) => {
    return apiRequest("/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, newPassword: pin, token }),
    });
  },

  verifyOtp: async (email: string, token: string) => {
    return apiRequest("/verify-reset-token", {
      method: "POST",
      body: JSON.stringify({ email, token }),
    });
  },

  verifySignupOtp: async (email: string, token: string) => {
    return apiRequest("/verify-signup-otp", {
      method: "POST",
      body: JSON.stringify({ email, token }),
    });
  },

  setPin: async (pin: string) => {
    return apiRequest("/set-pin", {
      method: "POST",
      body: JSON.stringify({ pin }),
    });
  },

  forgotPin: async (email: string) => {
    return apiRequest("/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  getMe: async () => {
    return apiRequest("/me");
  },

  updateMe: async (data: { name?: string; email?: string; password?: string; pin?: string; preferredLanguage?: string }) => {
    return apiRequest("/me", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
};
