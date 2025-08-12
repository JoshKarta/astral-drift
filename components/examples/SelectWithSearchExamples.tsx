"use client";

import SelectWithSearch, { SelectOption } from "@/components/SelectWithSearch";
import { useCountries } from "@/hooks/useCountries";

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
    .map((country) => ({
      value: country.cca2, // Use country code as value
      label: country.name.common, // Use common name as label
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
};

// Example 3: Transform function for different API
const transformUsers = (data: any[]): SelectOption[] => {
  return data.map((user) => ({
    value: user.id.toString(),
    label: `${user.name} (${user.email})`,
  }));
};

export default function SelectWithSearchExamples() {
  const { countries } = useCountries();

  return (
    <div className="space-y-8 p-6">
      <h2 className="text-2xl font-bold">SelectWithSearch Examples</h2>
      
      {/* Example 1: Static options */}
      <div>
        <h3 className="text-lg font-semibold mb-4">1. Static Options (Frameworks)</h3>
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
        <h3 className="text-lg font-semibold mb-4">2. Using Custom Hook (Countries)</h3>
        <SelectWithSearch
          options={countries}
          placeholder="Select a country..."
          searchPlaceholder="Search countries..."
          emptyMessage="No countries found."
          label="Country"
        />
      </div>

      {/* Example 3: Direct API fetch with transform */}
      <div>
        <h3 className="text-lg font-semibold mb-4">3. Direct API Fetch (Countries with codes)</h3>
        <SelectWithSearch
          fetchUrl="https://restcountries.com/v3.1/all"
          transformData={transformCountries}
          placeholder="Select a country..."
          searchPlaceholder="Search countries..."
          emptyMessage="No countries found."
          label="Country (with codes)"
        />
      </div>

      {/* Example 4: Another API example */}
      <div>
        <h3 className="text-lg font-semibold mb-4">4. Different API (JSONPlaceholder Users)</h3>
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
