export function calculateMean(data: number[]) {
  return data.reduce((acc, curr) => acc + curr, 0) / data.length;
}
