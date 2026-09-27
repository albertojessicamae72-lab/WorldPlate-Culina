// @ts-nocheck
import {
  Utensils,
  Soup,
  Flame,
  Salad,
  Coffee,
  Cookie,
  Sandwich,
  Wine,
  Egg,
  FlameKindling, // Fixed: Removed the space
  Store
} from 'lucide-react';

export const CATEGORIES = [
  { code: "main", name: "Main Dishes", icon: Utensils },
  { code: "noodles", name: "Noodles & Pasta", icon: Soup },
  { code: "rice", name: "Rice Dishes", icon: Flame },
  { code: "salads", name: "Salads & Vegetables", icon: Salad },
  { code: "soups", name: "Soups & Stews", icon: FlameKindling }, // Fixed: Updated here as well
  { code: "bread", name: "Bread & Baked Goods", icon: Sandwich },
  { code: "desserts", name: "Desserts", icon: Cookie },
  { code: "drinks", name: "Drinks", icon: Coffee },
  { code: "snacks", name: "Snacks", icon: Cookie },
  { code: "breakfast", name: "Breakfast", icon: Egg },
  { code: "sauces", name: "Sauces & Condiments", icon: Wine },
  { code: "streetfood", name: "Street Food", icon: Store },
];

export const getCategory = (code) => CATEGORIES.find((c) => c.code === code);
