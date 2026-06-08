export interface WalletTypeConfig {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  letter: string;
}

export const WALLET_TYPES: WalletTypeConfig[] = [
  {
    id: "mobikwik",
    name: "Mobikwik",
    color: "#2563eb",
    bgColor: "#eff6ff",
    letter: "M",
  },
  {
    id: "phonepe",
    name: "PhonePe",
    color: "#7c3aed",
    bgColor: "#f5f3ff",
    letter: "P",
  },
  {
    id: "freecharge",
    name: "Freecharge",
    color: "#ea580c",
    bgColor: "#fff7ed",
    letter: "F",
  },
  {
    id: "airtel",
    name: "Airtel",
    color: "#dc2626",
    bgColor: "#fef2f2",
    letter: "A",
  },
  {
    id: "paytm",
    name: "Paytm",
    color: "#0ea5e9",
    bgColor: "#f0f9ff",
    letter: "P",
  },
];

export function getWalletType(id: string) {
  return WALLET_TYPES.find((w) => w.id === id);
}
