# LogiBill Frontend - Tech Stack

## Languages

| Language | Version | Purpose |
|----------|---------|---------|
| TypeScript | 5.x | Primary language |
| JavaScript | ES2022+ | Build tooling |

## Frontend Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.1.6 | React framework with App Router |
| React | 19.2.3 | UI library |

### Key Next.js Features Used
- App Router with route groups
- Server Components (where applicable)
- Dynamic imports for code splitting
- Image optimization
- Font optimization

## UI & Styling

| Technology | Version | Purpose |
|------------|---------|---------|
| TailwindCSS | 4.x | Utility-first CSS |
| shadcn/ui | latest | Component library |
| Radix UI | various | Accessible primitives |
| Lucide React | latest | Icons |

### Component Categories
- 37 shadcn/ui components in `src/components/ui/`
- Custom domain components in `src/components/{domain}/`
- Shared utilities in `src/components/shared/`

## State Management

| Technology | Version | Purpose |
|------------|---------|---------|
| TanStack Query | 5.x | Server state, caching |
| Zustand | latest | Client state (if needed) |
| React Hook Form | 7.x | Form state |
| Zod | 3.x | Schema validation |

### Query Patterns
```typescript
// Query keys: [entity, id?, filters?]
queryKey: ["customers", params]
queryKey: ["customers", id]
queryKey: ["invoices", { status: "pending" }]
```

## Data Tables

| Technology | Version | Purpose |
|------------|---------|---------|
| TanStack Table | 8.x | Table state, sorting, filtering |

### Features
- Server-side pagination
- Column sorting
- Global and column filtering
- Row selection

## Authentication

| Technology | Purpose |
|------------|---------|
| Supabase Auth | JWT-based authentication |
| Middleware | Route protection |

### Auth Flow
1. Login via Supabase
2. JWT stored in session
3. API client attaches token to requests
4. Middleware protects dashboard routes

## API Integration

| Technology | Purpose |
|------------|---------|
| Fetch API | HTTP client |
| Custom API client | Type-safe wrapper |

### API Client Location
`src/lib/api/client.ts`

### Expected Backend
- Flask REST API (separate repo)
- Base URL: `NEXT_PUBLIC_API_URL`
- 56 planned endpoints

## Testing

| Technology | Version | Purpose |
|------------|---------|---------|
| Playwright | 1.52+ | E2E testing |

### Test Structure
```
e2e/
├── auth.spec.ts        # Authentication flows
├── navigation.spec.ts  # Navigation, keyboard
├── error-pages.spec.ts # 404, error handling
└── fixtures/
    └── auth.ts         # Reusable auth fixture
```

### Browser Coverage
- Chromium (Desktop Chrome)
- Firefox (Desktop Firefox)
- WebKit (Desktop Safari)
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)

## Build & Deploy

| Technology | Purpose |
|------------|---------|
| npm | Package manager |
| Vercel | Deployment platform |
| ESLint | Linting |

### Environment Variables
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

## Key Dependencies

```json
{
  "dependencies": {
    "next": "^16.1.6",
    "react": "^19.2.3",
    "@tanstack/react-query": "^5.x",
    "@tanstack/react-table": "^8.x",
    "react-hook-form": "^7.x",
    "zod": "^3.x",
    "@supabase/supabase-js": "^2.x",
    "recharts": "^2.x",
    "date-fns": "^3.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "tailwindcss": "^4.x",
    "@playwright/test": "^1.52.x"
  }
}
```

## Performance Optimizations

1. **Dynamic Imports** - Charts, dialogs, heavy tables (`src/components/lazy/`)
2. **Package Optimization** - lucide-react, radix-ui, recharts, date-fns
3. **Image Formats** - AVIF, WebP
4. **Font Display** - `swap` for faster paint

## Security Headers

Configured in `next.config.ts`:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=(), microphone=(), geolocation=()
