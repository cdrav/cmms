// Oscurece un color hex un porcentaje dado — usado para el estado :hover de los
// botones de marca sin depender de una paleta Tailwind fija.
export function darkenHex(hex: string, amount = 0.15): string {
  const clean = hex.replace("#", "");
  const num = parseInt(clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean, 16);
  if (Number.isNaN(num)) return hex;

  const r = Math.max(0, Math.min(255, Math.floor(((num >> 16) & 255) * (1 - amount))));
  const g = Math.max(0, Math.min(255, Math.floor(((num >> 8) & 255) * (1 - amount))));
  const b = Math.max(0, Math.min(255, Math.floor((num & 255) * (1 - amount))));

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
