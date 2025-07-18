import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalizes subcategory names to ensure consistency across the application
 * Format: First letter capital, rest lowercase
 * @param subcategory - The subcategory name to normalize
 * @returns The normalized subcategory name
 */
export function normalizeSubcategoryName(subcategory: string): string {
  if (!subcategory || typeof subcategory !== 'string') return '';
  const trimmed = subcategory.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

/**
 * Compares two subcategory names case-insensitively
 * @param subcategory1 - First subcategory name
 * @param subcategory2 - Second subcategory name
 * @returns True if the subcategories match (case-insensitive)
 */
export function compareSubcategories(subcategory1: string, subcategory2: string): boolean {
  if (!subcategory1 || !subcategory2) return false;
  return subcategory1.toLowerCase().trim() === subcategory2.toLowerCase().trim();
}
