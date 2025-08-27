export const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
export const rnd = (min: number, max: number) => Math.random() * (max - min) + min;
export const now = () => Date.now();
export const fmtTime = (ms: number) => new Date(ms).toLocaleTimeString();
