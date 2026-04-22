/**
 * Utility functions for form validation and formatting
 */

// Clean WhatsApp number - remove all non-digit characters
export const cleanWhatsApp = (value: string): string => value.replace(/\D/g, "");

/**
 * Validate WhatsApp format
 * Accepts: 11 99999-9999, 1199999999, +5511999999999
 * Returns error message or null if valid
 */
export const validateWhatsApp = (value: string): string | null => {
  const cleaned = cleanWhatsApp(value);
  
  // Must have 10-15 digits
  if (cleaned.length < 10 || cleaned.length > 15) {
    return "WhatsApp deve ter entre 10 e 15 dígitos (ex: 11 99999-9999)";
  }
  
  // If 13 digits, must start with 55 (Brazil country code)
  if (cleaned.length === 13 && !cleaned.startsWith("55")) {
    return "Formato inválido. Use DDD + número (ex: 11 99999-9999)";
  }
  
  return null;
};

/**
 * Validate email format
 * Returns error message or null if valid
 */
export const validateEmail = (value: string): string | null => {
  const email = value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return "Email inválido";
  }
  
  return null;
};

/**
 * Format WhatsApp number for wa.me link
 * Ensures it includes country code (55 for Brazil)
 */
export const formatWhatsAppForLink = (cleaned: string): string => {
  return cleaned.startsWith("55") ? cleaned : `55${cleaned}`;
};
