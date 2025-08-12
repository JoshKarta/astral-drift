"use client";

import { useEffect, useState } from "react";
import { SelectOption } from "@/components/SelectWithSearch";

// Fallback fruits data in case API fails
const fallbackFruits: SelectOption[] = [
  { value: "Apple", label: "Apple" },
  { value: "Banana", label: "Banana" },
  { value: "Orange", label: "Orange" },
  { value: "Grape", label: "Grape" },
  { value: "Strawberry", label: "Strawberry" },
  { value: "Blueberry", label: "Blueberry" },
  { value: "Pineapple", label: "Pineapple" },
  { value: "Mango", label: "Mango" },
  { value: "Kiwi", label: "Kiwi" },
  { value: "Peach", label: "Peach" },
  { value: "Pear", label: "Pear" },
  { value: "Cherry", label: "Cherry" },
  { value: "Watermelon", label: "Watermelon" },
  { value: "Lemon", label: "Lemon" },
  { value: "Lime", label: "Lime" },
].sort((a, b) => a.label.localeCompare(b.label));

interface Fruit {
  name: string;
  id: number;
  family: string;
  order: string;
  genus: string;
  nutritions: {
    calories: number;
    fat: number;
    sugar: number;
    carbohydrates: number;
    protein: number;
  };
}

export function useFruits() {
  const [fruits, setFruits] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFruits = async () => {
      setLoading(true);
      setError(null);
      try {
        // Create a timeout promise to handle slow API responses
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Request timeout")), 10000),
        );

        const fetchPromise = fetch("https://www.fruityvice.com/api/fruit/all", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const response = (await Promise.race([
          fetchPromise,
          timeoutPromise,
        ])) as Response;

        if (!response.ok) {
          throw new Error(`Failed to fetch fruits: ${response.statusText}`);
        }

        const data: Fruit[] = await response.json();

        // Transform the data to SelectOption format
        const transformedFruits: SelectOption[] = data
          .filter((fruit) => fruit && fruit.name) // Filter out invalid entries
          .map((fruit) => ({
            value: fruit.name,
            label: fruit.name,
          }))
          .sort((a, b) => a.label.localeCompare(b.label)); // Sort alphabetically

        setFruits(transformedFruits);
      } catch (err) {
        console.warn(
          "Failed to fetch fruits from API, using fallback data:",
          err,
        );
        setError(err instanceof Error ? err.message : "Failed to fetch fruits");
        // Use fallback data instead of empty array
        setFruits(fallbackFruits);
      } finally {
        setLoading(false);
      }
    };

    fetchFruits();
  }, []);

  return { fruits, loading, error };
}
