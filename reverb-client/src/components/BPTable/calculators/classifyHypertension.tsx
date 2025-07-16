/**
 * Classifies blood pressure levels based on systolic and diastolic values.
 *
 * This function uses the American Heart Association's guidelines for hypertension
 * classification. The categories are as follows:
 *
 * - Normal: Systolic < 120 mm Hg and Diastolic < 80 mm Hg
 * - Elevated: Systolic 120-129 mm Hg and Diastolic < 80 mm Hg
 * - Stage 1 Hypertension: Systolic 130-139 mm Hg or Diastolic 80-89 mm Hg
 * - Stage 2 Hypertension: Systolic ≥ 140 mm Hg or Diastolic ≥ 90 mm Hg
 * - Hypertensive Urgency|Emergency: Systolic > 180 mm Hg or Diastolic > 120 mm Hg
 *
 * For more details, refer to the American Heart Association's guidelines:
 * https://www.heart.org/-/media/files/health-topics/high-blood-pressure/hypertension-guideline-highlights-flyer.pdf
 *
 * @param {number} systolic - The systolic blood pressure value.
 * @param {number} diastolic - The diastolic blood pressure value.
 * @returns {string} The classification of the blood pressure level.
 */
export function classifyHypertension(systolic: number, diastolic: number) {
  if (systolic > 180 || diastolic > 120) {
    return "Hypertensive Urgency|Emergency";
  } else if (systolic >= 140 || diastolic >= 90) {
    return "Stage 2 Hypertension";
  } else if (
    (systolic >= 130 && systolic <= 139) ||
    (diastolic >= 80 && diastolic <= 89)
  ) {
    return "Stage 1 Hypertension";
  } else if (systolic >= 120 && systolic <= 129 && diastolic < 80) {
    return "Elevated";
  } else if (systolic < 120 && diastolic < 80) {
    return "Normal";
  }
  return "Unknown";
}
