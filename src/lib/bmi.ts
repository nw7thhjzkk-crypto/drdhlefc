/**
 * Calculates BMI based on height in cm and weight in kg.
 * Returns null if inputs are invalid or missing.
 * Result is rounded to 1 decimal place.
 */
export function calculateBMI(
  heightCm: number | null | undefined,
  weightKg: number | null | undefined
): number | null {
  if (!heightCm || !weightKg || heightCm <= 0) {
    return null;
  }

  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);

  return Number(bmi.toFixed(1));
}
