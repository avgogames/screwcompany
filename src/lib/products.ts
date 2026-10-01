export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  specs: Record<string, string>;
  priceCents: number;
  unit: string;
  minQty: number;
};

// The catalog lives in code so prices are always computed server-side from a trusted source.
// Replace or extend with your own products (or move to the database) as needed.
export const products: Product[] = [
  {
    id: "p-001",
    slug: "steel-angle-bracket",
    name: "Galvanized Steel Angle Bracket",
    category: "Brackets",
    description:
      "Heavy-duty 90° angle bracket stamped from hot-dip galvanized steel for structural and equipment mounting.",
    specs: { Material: "S235 galvanized steel", Size: "100 × 100 × 80 mm", Thickness: "4 mm", Load: "450 kg" },
    priceCents: 450,
    unit: "piece",
    minQty: 10,
  },
  {
    id: "p-002",
    slug: "cnc-aluminum-housing",
    name: "CNC Machined Aluminum Housing",
    category: "Machined Parts",
    description:
      "Precision 5-axis machined enclosure from 6061-T6 aluminum, anodized finish, ideal for electronics and sensors.",
    specs: { Material: "6061-T6 aluminum", Tolerance: "±0.02 mm", Finish: "Black anodized", Size: "120 × 80 × 40 mm" },
    priceCents: 6800,
    unit: "piece",
    minQty: 1,
  },
  {
    id: "p-003",
    slug: "hex-bolt-m12",
    name: "Hex Bolt M12 × 60 (Grade 8.8)",
    category: "Fasteners",
    description: "High-tensile zinc-plated hex bolts sold in boxes of 100 for construction and machinery assembly.",
    specs: { Thread: "M12 × 1.75", Length: "60 mm", Grade: "8.8", Pack: "100 pcs" },
    priceCents: 3200,
    unit: "box",
    minQty: 1,
  },
  {
    id: "p-004",
    slug: "stainless-flange",
    name: "Stainless Steel Weld Neck Flange",
    category: "Pipe Fittings",
    description: "ASME B16.5 weld neck flange forged from 316L stainless for corrosive and high-pressure lines.",
    specs: { Material: "316L stainless", Size: "DN50 / 2\"", Class: "150", Standard: "ASME B16.5" },
    priceCents: 5400,
    unit: "piece",
    minQty: 1,
  },
  {
    id: "p-005",
    slug: "conveyor-roller",
    name: "Gravity Conveyor Roller",
    category: "Material Handling",
    description: "Sealed-bearing steel roller for gravity and powered conveyors, spring-loaded axle for easy install.",
    specs: { Diameter: "50 mm", Length: "600 mm", Bearing: "6204 sealed", Load: "120 kg" },
    priceCents: 1850,
    unit: "piece",
    minQty: 4,
  },
  {
    id: "p-006",
    slug: "laser-cut-steel-plate",
    name: "Laser-Cut Mild Steel Plate",
    category: "Sheet Metal",
    description: "Custom laser-cut mounting plate, deburred and primed. Send drawings after ordering for custom profiles.",
    specs: { Material: "Mild steel S275", Thickness: "6 mm", "Max size": "1500 × 3000 mm", Finish: "Primed" },
    priceCents: 2900,
    unit: "piece",
    minQty: 1,
  },
];

export function getProduct(idOrSlug: string): Product | undefined {
  return products.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
}

export function formatPrice(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
}
