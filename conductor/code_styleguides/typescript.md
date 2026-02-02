# TypeScript Style Guide

## File Organization

### Directory Structure
```
src/
├── app/                 # Next.js App Router pages
├── components/
│   ├── ui/             # shadcn/ui components
│   ├── layout/         # App layout (sidebar, header)
│   ├── tables/         # DataTable components
│   ├── {domain}/       # Domain components (billing, invoices, etc.)
│   ├── shared/         # Reusable components
│   ├── lazy/           # Dynamic imports
│   └── accessibility/  # A11y utilities
├── hooks/              # Custom React hooks
├── lib/
│   ├── api/           # API client
│   ├── supabase/      # Supabase client
│   └── utils.ts       # Utility functions
├── stores/            # Zustand stores (if needed)
└── types/             # TypeScript type definitions
```

### File Naming
- Components: `kebab-case.tsx` (e.g., `data-table.tsx`)
- Hooks: `use-{name}.ts` (e.g., `use-customers.ts`)
- Types: `{domain}.ts` (e.g., `customer.ts`)
- Utilities: `{purpose}.ts` (e.g., `format.ts`)

## TypeScript Conventions

### Type Definitions

```typescript
// Prefer interfaces for objects that can be extended
interface Customer {
  id: number;
  name: string;
  email?: string;
}

// Use type for unions, intersections, primitives
type CustomerStatus = "active" | "inactive" | "suspended";

// Export types alongside components
export interface CustomerCardProps {
  customer: Customer;
  onEdit?: (id: number) => void;
}

export function CustomerCard({ customer, onEdit }: CustomerCardProps) {
  // ...
}
```

### Generics

```typescript
// Use descriptive generic names
interface ApiResponse<TData> {
  data: TData;
  error?: string;
}

// Constrain generics when appropriate
function getItem<T extends { id: number }>(items: T[], id: number): T | undefined {
  return items.find(item => item.id === id);
}
```

### Null Handling

```typescript
// Use optional chaining
const name = customer?.name;

// Use nullish coalescing
const displayName = customer?.name ?? "Unknown";

// Avoid non-null assertions (!) unless absolutely necessary
```

## React Patterns

### Component Structure

```typescript
"use client"; // Only when needed

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Types first
interface MyComponentProps {
  title: string;
  className?: string;
}

// Named export (not default)
export function MyComponent({ title, className }: MyComponentProps) {
  // Hooks at top
  const [isOpen, setIsOpen] = useState(false);

  // Event handlers
  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  // Early returns for loading/error states
  if (!title) return null;

  // Main render
  return (
    <div className={cn("base-styles", className)}>
      <h1>{title}</h1>
      <Button onClick={handleClick}>Toggle</Button>
    </div>
  );
}
```

### Hooks

```typescript
// Custom hook pattern
export function useCustomer(id: number | string) {
  return useQuery({
    queryKey: ["customers", id],
    queryFn: async () => {
      const response = await api.get<Customer>(`/api/v1/customers/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}
```

### Forms

```typescript
// Zod schema + React Hook Form
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

export function MyForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  const onSubmit = (data: FormValues) => {
    // Handle submit
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields */}
      </form>
    </Form>
  );
}
```

## API Integration

### API Client Usage

```typescript
// Use the typed api object
import { api } from "@/lib/api/client";

// GET with params
const response = await api.get<PaginatedResponse<Customer>>(
  "/api/v1/customers",
  { page: 1, per_page: 20 }
);

// POST with body
const result = await api.post<Customer>("/api/v1/customers", {
  name: "New Customer",
});
```

### Query Keys

```typescript
// Consistent query key patterns
queryKey: ["customers"]                    // List
queryKey: ["customers", params]            // Filtered list
queryKey: ["customers", id]                // Single item
queryKey: ["customers", id, "orders"]      // Related data
```

## Styling

### Tailwind + cn()

```typescript
import { cn } from "@/lib/utils";

// Merge conditional classes
<div className={cn(
  "base-class",
  isActive && "active-class",
  variant === "primary" && "primary-variant",
  className // Always last for overrides
)} />
```

### Component Variants

```typescript
// Use cva for variant-based styling
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "base-classes",
  {
    variants: {
      variant: {
        default: "default-classes",
        destructive: "destructive-classes",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

## Error Handling

```typescript
// In mutations
const mutation = useMutation({
  mutationFn: async (data) => {
    const response = await api.post("/api/v1/endpoint", data);
    return response.data;
  },
  onSuccess: () => {
    toast.success("Action completed");
    queryClient.invalidateQueries({ queryKey: ["entity"] });
  },
  onError: (error) => {
    toast.error("Action failed");
    console.error(error);
  },
});

// In async functions
try {
  const result = await someAsyncOperation();
} catch (error) {
  if (error instanceof ApiError) {
    // Handle API error
  }
  throw error;
}
```

## Accessibility

```typescript
// Always include accessible labels
<Button aria-label="Close dialog">
  <XIcon />
</Button>

// Use semantic HTML
<nav aria-label="Main navigation">
  {/* Navigation items */}
</nav>

// Announce dynamic changes
import { announceToScreenReader } from "@/components/accessibility";
announceToScreenReader("Item deleted");
```

## Imports

### Import Order

```typescript
// 1. React/Next
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// 2. External packages
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

// 3. Internal absolute imports
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils";

// 4. Types
import type { Customer } from "@/types/customer";
```

### Path Aliases

```typescript
// Use @ alias for src/
import { Button } from "@/components/ui/button";

// Don't use relative imports outside same directory
// Bad: import { Button } from "../../../components/ui/button";
```
