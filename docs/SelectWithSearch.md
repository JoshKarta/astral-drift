# SelectWithSearch Component

A highly reusable and flexible select component with search functionality that supports both static options and dynamic data fetching from APIs.

## Features

- 🔍 **Search functionality** - Filter options with built-in search
- 🌐 **API integration** - Fetch data from any REST API
- 🔄 **Loading states** - Built-in loading indicators
- ❌ **Error handling** - Graceful error handling with user feedback
- 🎨 **Customizable** - Fully customizable labels, placeholders, and styling
- ♿ **Accessible** - Built with accessibility in mind
- 📱 **Responsive** - Works on all screen sizes

## Basic Usage

### Static Options

```tsx
import SelectWithSearch, { SelectOption } from "@/components/SelectWithSearch";

const options: SelectOption[] = [
  { value: "react", label: "React" },
  { value: "vue", label: "Vue.js" },
  { value: "angular", label: "Angular" },
];

function MyComponent() {
  const [value, setValue] = useState("");

  return (
    <SelectWithSearch
      value={value}
      onValueChange={setValue}
      options={options}
      placeholder="Select a framework..."
      label="Framework"
    />
  );
}
```

### API Integration

```tsx
// Using the built-in countries hook
import { useCountries } from "@/hooks/useCountries";

function CountrySelector() {
  const { countries } = useCountries();
  const [selectedCountry, setSelectedCountry] = useState("");

  return (
    <SelectWithSearch
      value={selectedCountry}
      onValueChange={setSelectedCountry}
      options={countries}
      placeholder="Select a country..."
      searchPlaceholder="Search countries..."
      label="Country"
    />
  );
}
```

### Direct API Fetch

```tsx
// Transform function for API data
const transformCountries = (data: any[]): SelectOption[] => {
  return data
    .filter((country) => country.name && country.name.common) // Filter out invalid entries
    .map((country) => ({
      value: country.name.common,
      label: country.name.common,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
};

function CountrySelectorWithAPI() {
  const [selectedCountry, setSelectedCountry] = useState("");

  return (
    <SelectWithSearch
      value={selectedCountry}
      onValueChange={setSelectedCountry}
      fetchUrl="https://restcountries.com/v3.1/all?fields=name"
      transformData={transformCountries}
      placeholder="Select a country..."
      label="Country"
    />
  );
}
```

## Props

| Prop                | Type                            | Default               | Description                                 |
| ------------------- | ------------------------------- | --------------------- | ------------------------------------------- |
| `value`             | `string`                        | `""`                  | Current selected value                      |
| `onValueChange`     | `(value: string) => void`       | -                     | Callback when selection changes             |
| `placeholder`       | `string`                        | `"Select option..."`  | Placeholder text when no option is selected |
| `searchPlaceholder` | `string`                        | `"Search..."`         | Placeholder text for search input           |
| `emptyMessage`      | `string`                        | `"No options found."` | Message when no options match search        |
| `label`             | `string`                        | -                     | Optional label for the select               |
| `className`         | `string`                        | -                     | Additional CSS classes                      |
| `disabled`          | `boolean`                       | `false`               | Whether the select is disabled              |
| `options`           | `SelectOption[]`                | -                     | Static options array                        |
| `fetchUrl`          | `string`                        | -                     | URL to fetch options from                   |
| `transformData`     | `(data: any) => SelectOption[]` | -                     | Function to transform API response          |
| `id`                | `string`                        | -                     | Custom ID for the select element            |

## Types

```tsx
interface SelectOption {
  value: string;
  label: string;
}
```

## Integration with React Hook Form

```tsx
import { useForm } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
} from "@/components/ui/form";

function FormExample() {
  const form = useForm();

  return (
    <FormField
      control={form.control}
      name="country"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Country</FormLabel>
          <FormControl>
            <SelectWithSearch
              value={field.value}
              onValueChange={field.onChange}
              options={countries}
              placeholder="Select a country..."
              disabled={field.disabled}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
}
```

## Custom Hooks

### useCountries

A custom hook for fetching countries from the REST Countries API:

```tsx
import { useCountries } from "@/hooks/useCountries";

function MyComponent() {
  const { countries, loading, error } = useCountries();

  if (loading) return <div>Loading countries...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <SelectWithSearch options={countries} placeholder="Select a country..." />
  );
}
```

## Styling

The component uses Tailwind CSS classes and can be customized using the `className` prop. It integrates seamlessly with shadcn/ui components.

## Accessibility

- Proper ARIA attributes for screen readers
- Keyboard navigation support
- Focus management
- Semantic HTML structure
