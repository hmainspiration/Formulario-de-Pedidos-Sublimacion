export interface OrderItem {
  id?: string | number;
  product_type: string;
  design: string;
  design_code?: string;
  size?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Order {
  id?: string | number;
  customer_name: string;
  church: string;
  total_amount: number;
  items: OrderItem[];
  created_at?: string;
}

export interface ProductSize {
  label: string;
  group: string;
  price: number;
}

export interface Design {
  label: string;
  code: string;
}

export interface ProductCatalogItem {
  id: string;
  name: string;
  designs: Design[];
  sizes?: ProductSize[];
  price?: number;
}

export const CATALOG: Record<string, ProductCatalogItem> = {
  camisas: {
    id: "camisas",
    name: "Camisa Sublimada Centenario",
    designs: [
      { label: "Frente simple - Árbol", code: "C1DA" },
      { label: "Frente simple - 100 Años", code: "C1DC" },
      { label: "Frente simple - Naciones", code: "C1DN" },
      { label: "Frente y espalda - Árbol", code: "C2DA" },
      { label: "Frente y espalda - 100 Años", code: "C2DC" },
      { label: "Frente y espalda - Naciones", code: "C2DN" },
    ],
    sizes: [
      { label: "1", group: "Juveniles 0-8", price: 280 },
      { label: "2", group: "Juveniles 0-8", price: 280 },
      { label: "3", group: "Juveniles 0-8", price: 280 },
      { label: "4", group: "Juveniles 0-8", price: 280 },
      { label: "5", group: "Juveniles 0-8", price: 280 },
      { label: "6", group: "Juveniles 0-8", price: 280 },
      { label: "7", group: "Juveniles 0-8", price: 280 },
      { label: "8", group: "Juveniles 0-8", price: 280 },
      { label: "9", group: "10 a XL", price: 300 },
      { label: "10", group: "10 a XL", price: 300 },
      { label: "12", group: "10 a XL", price: 300 },
      { label: "14", group: "10 a XL", price: 300 },
      { label: "16", group: "10 a XL", price: 300 },
      { label: "S", group: "10 a XL", price: 300 },
      { label: "M", group: "10 a XL", price: 300 },
      { label: "L", group: "10 a XL", price: 300 },
      { label: "XL", group: "10 a XL", price: 300 },
      { label: "2XL", group: "2XL y 3XL", price: 340 },
      { label: "3XL", group: "2XL y 3XL", price: 340 },
    ]
  },
  tazas: {
    id: "tazas",
    name: "Taza Sublimada 11oz",
    designs: [
      { label: "Diseño Árbol", code: "1TDA" },
      { label: "Diseño 100 Años", code: "1TDC" },
      { label: "Diseño Naciones", code: "1TDN" },
    ],
    price: 150
  },
  termo_acero: {
    id: "termo_acero",
    name: "Termo de acero 500ml",
    designs: [
      { label: "Diseño Árbol", code: "2TCDA" },
      { label: "Diseño 100 Años", code: "2TCDC" },
      { label: "Diseño Naciones", code: "2TCDN" },
    ],
    price: 450
  },
  termo_aluminio: {
    id: "termo_aluminio",
    name: "Termo de aluminio 600ml",
    designs: [
      { label: "Diseño Árbol", code: "3TADA" },
      { label: "Diseño 100 Años", code: "3TADC" },
      { label: "Diseño Naciones", code: "3TADN" },
    ],
    price: 240
  },
  llaveros: {
    id: "llaveros",
    name: "Llaveros",
    designs: [
      { label: "Diseño Árbol", code: "LL2DA" },
      { label: "Diseño 100 Años", code: "LL2DC" },
      { label: "Diseño Naciones", code: "LL2DN" },
    ],
    price: 120
  },
  gorras: {
    id: "gorras",
    name: "Gorras",
    designs: [
      { label: "Diseño Árbol", code: "G1DA" },
      { label: "Diseño 100 Años", code: "G1DC" },
      { label: "Diseño Naciones", code: "G1DN" },
    ],
    price: 180
  },
  laminas: {
    id: "laminas",
    name: "Láminas de aluminio 21x29",
    designs: [
      { label: "Retrato Apóstol Naasón Joaquín", code: "R1NJG" },
      { label: "Retrato Apóstol Samuel Joaquín", code: "R1SJF" },
      { label: "Retrato Apóstol Aarón Joaquín", code: "R1AJG" },
    ],
    price: 300
  },
  papel_foto: {
    id: "papel_foto",
    name: "Papel Fotográfico",
    designs: [
      { label: "Fotografía Apóstol Naasón Joaquín", code: "F1NJG" },
      { label: "Fotografía Apóstol Samuel Joaquín", code: "F1SJF" },
      { label: "Fotografía Apóstol Aarón Joaquín", code: "F1AJG" },
    ],
    price: 150
  }
};
