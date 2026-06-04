import axiosInstance from '../api/axiosInstance';
import { ENDPOINTS } from '../api/endpoints';

// Register new user
export const registerUser = async (data: {
  name: string;
  email: string;
  password: string;
  phone: string;
}) => {
  const response = await axiosInstance.post(ENDPOINTS.REGISTER, data);
  return response.data;
};

// Login user — returns JWT token + user info
export const loginUser = async (data: {
  email: string;
  password: string;
}) => {
  const response = await axiosInstance.post(ENDPOINTS.LOGIN, data);
  return response.data;
};

// Forgot password — sends OTP to email
export const forgotPassword = async (email: string) => {
  const response = await axiosInstance.post(ENDPOINTS.FORGOT_PASSWORD, { email });
  return response.data;
};

// Verify OTP
export const verifyOTP = async (data: {
  email: string;
  otp: string;
}) => {
  const response = await axiosInstance.post(ENDPOINTS.VERIFY_OTP, data);
  return response.data;
};

// Verify registration OTP
export const verifyRegistration = async (data: {
  email: string;
  otp: string;
}) => {
  const response = await axiosInstance.post(ENDPOINTS.VERIFY_REGISTRATION, data);
  return response.data;
};

// Resend registration OTP
export const resendRegistrationOtp = async (email: string) => {
  const response = await axiosInstance.post(ENDPOINTS.RESEND_REGISTRATION_OTP, { email });
  return response.data;
};

// Reset password
export const resetPassword = async (data: {
  email: string;
  otp: string;
  newPassword: string;
}) => {
  const response = await axiosInstance.post(ENDPOINTS.RESET_PASSWORD, data);
  return response.data;
};

// Logout
export const logoutUser = async () => {
  const response = await axiosInstance.post(ENDPOINTS.LOGOUT);
  return response.data;
};
