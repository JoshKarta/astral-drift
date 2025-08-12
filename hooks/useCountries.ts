"use client";

import { useEffect, useState } from "react";
import { SelectOption } from "@/components/SelectWithSearch";

interface Country {
  name: {
    common: string;
    official: string;
  };
  cca2: string;
  cca3: string;
}

export function useCountries() {
  const [countries, setCountries] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCountries = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("https://restcountries.com/v3.1/all");
        if (!response.ok) {
          throw new Error(`Failed to fetch countries: ${response.statusText}`);
        }
        const data: Country[] = await response.json();
        
        // Transform the data to SelectOption format
        const transformedCountries: SelectOption[] = data
          .map((country) => ({
            value: country.name.common,
            label: country.name.common,
          }))
          .sort((a, b) => a.label.localeCompare(b.label)); // Sort alphabetically
        
        setCountries(transformedCountries);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch countries");
        setCountries([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCountries();
  }, []);

  return { countries, loading, error };
}
