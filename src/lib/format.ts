const clp = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
const number = new Intl.NumberFormat("es-CL");

export const formatPrice = (value: number) => clp.format(value);
export const formatKm = (value: number) => `${number.format(value)} km`;

export function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export const labels = {
  transmission: { MANUAL: "Manual", AUTOMATIC: "Automática" },
  fuel: { GASOLINE: "Bencina", DIESEL: "Diésel", HYBRID: "Híbrido", ELECTRIC: "Eléctrico", OTHER: "Otro" },
  body: { SUV: "SUV", SEDAN: "Sedán", HATCHBACK: "Hatchback", PICKUP: "Pickup", WAGON: "Station Wagon", COUPE: "Coupé", VAN: "Van", OTHER: "Otro" },
  status: { AVAILABLE: "Disponible", RESERVED: "Reservado", SOLD: "Vendido", DRAFT: "Borrador" }
} as const;
