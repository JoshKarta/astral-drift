"use client";

import SelectWithSearch, { SelectOption } from "@/components/SelectWithSearch";
import { useCountries } from "@/hooks/useCountries";
import { useFruits } from "@/hooks/useFruits";

// Example 1: Static options
const frameworkOptions: SelectOption[] = [
  { value: "react", label: "React" },
  { value: "vue", label: "Vue.js" },
  { value: "angular", label: "Angular" },
  { value: "svelte", label: "Svelte" },
];

// Example 2: Transform function for API data
const transformCountries = (data: any[]): SelectOption[] => {
  return data
    .filter((country) => country.name && country.name.common) // Filter out invalid entries
    .map((country) => ({
      value: country.name.common, // Use common name as value
      label: country.name.common, // Use common name as label
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
};

// Example 3: Transform function for fruits API
const transformFruits = (data: any[]): SelectOption[] => {
  return data
    .filter((fruit) => fruit.name) // Filter out invalid entries
    .map((fruit) => ({
      value: fruit.name,
      label: fruit.name,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
};

// Example 4: Transform function for different API
const transformUsers = (data: any[]): SelectOption[] => {
  return data.map((user) => ({
    value: user.id.toString(),
    label: `${user.name} (${user.email})`,
  }));
};

export default function SelectWithSearchExamples() {
  const { countries } = useCountries();
  const { fruits } = useFruits();

  return (
    <div className="space-y-8 p-6">
      <h2 className="text-2xl font-bold">SelectWithSearch Examples</h2>

      {/* Example 1: Static options */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">
          1. Static Options (Frameworks)
        </h3>
        <SelectWithSearch
          options={frameworkOptions}
          placeholder="Select a framework..."
          searchPlaceholder="Search frameworks..."
          emptyMessage="No frameworks found."
          label="Framework"
        />
      </div>

      {/* Example 2: Using custom hook */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">
          2. Using Custom Hook (Countries)
        </h3>
        <SelectWithSearch
          options={countries}
          placeholder="Select a country..."
          searchPlaceholder="Search countries..."
          emptyMessage="No countries found."
          label="Country"
        />
      </div>

      {/* Example 3: Using custom hook for fruits */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">
          3. Using Custom Hook (Fruits)
        </h3>
        <SelectWithSearch
          options={fruits}
          placeholder="Select a fruit..."
          searchPlaceholder="Search fruits..."
          emptyMessage="No fruits found."
          label="Fruit"
        />
      </div>

      {/* Example 4: Direct API fetch with transform */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">
          4. Direct API Fetch (Countries from REST API)
        </h3>
        <SelectWithSearch
          fetchUrl="https://restcountries.com/v3.1/all?fields=name"
          transformData={transformCountries}
          placeholder="Select a country..."
          searchPlaceholder="Search countries..."
          emptyMessage="No countries found."
          label="Country (direct API)"
        />
      </div>

      {/* Example 5: Direct API fetch for fruits */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">
          5. Direct API Fetch (Fruits from Fruityvice API)
        </h3>
        <SelectWithSearch
          fetchUrl="https://www.fruityvice.com/api/fruit/all"
          transformData={transformFruits}
          placeholder="Select a fruit..."
          searchPlaceholder="Search fruits..."
          emptyMessage="No fruits found."
          label="Fruit (direct API)"
        />
      </div>

      {/* Example 6: Another API example */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">
          6. Different API (JSONPlaceholder Users)
        </h3>
        <SelectWithSearch
          fetchUrl="https://jsonplaceholder.typicode.com/users"
          transformData={transformUsers}
          placeholder="Select a user..."
          searchPlaceholder="Search users..."
          emptyMessage="No users found."
          label="User"
        />
      </div>
    </div>
  );
}
