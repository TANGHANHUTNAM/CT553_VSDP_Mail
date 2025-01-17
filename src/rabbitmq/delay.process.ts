export function delayProcess(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
