// Mean Arterial Pressure = 1/3*(SBP) + 2/3*(DBP)
export function calculateMAP(systolic: number, diastolic: number) {
  return ((systolic + 2 * diastolic) / 3).toFixed(0);
}
