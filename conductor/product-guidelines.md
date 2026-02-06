# LogiBill Frontend - Product Guidelines

## Voice and Tone

### Primary Voice

**Professional and Technical** - Clear, precise communication appropriate for business users managing financial and operational data.

### Tone Guidelines

| Context | Tone | Example |
|---------|------|---------|
| Success messages | Concise, confirming | "Invoice created successfully" |
| Error messages | Helpful, actionable | "Unable to save. Please check required fields." |
| Empty states | Encouraging, guiding | "No invoices yet. Create your first invoice." |
| Loading states | Minimal, unobtrusive | (skeleton screens, no text) |

### Writing Principles

1. **Be Direct** - Lead with the action or information
2. **Be Specific** - Use exact numbers and names
3. **Be Consistent** - Use same terms throughout (e.g., "Customer" not "Client")
4. **Be Accessible** - Avoid jargon where possible

## Design Principles

### 1. Simplicity Over Features

- Show only what's needed for the current task
- Progressive disclosure for advanced options
- Reduce cognitive load with clear hierarchy

### 2. Performance First

- Lazy load heavy components (charts, dialogs)
- Optimize bundle size with tree-shaking
- Use skeletons for perceived performance

### 3. Accessibility (WCAG 2.1 AA)

- Skip links for keyboard navigation
- Proper heading hierarchy
- Sufficient color contrast (4.5:1 minimum)
- Focus management in modals
- Screen reader announcements for dynamic content

### 4. Consistency

- Use shadcn/ui component library throughout
- Follow established patterns for similar features
- Consistent spacing, typography, and colors

## UI Patterns

### Navigation

- Sidebar navigation for primary sections
- Breadcrumbs for hierarchical pages
- Command palette (Cmd+K) for quick actions

### Data Display

- DataTable for lists with sorting, filtering, pagination
- Cards for summary/overview information
- Badges for status indicators

### Forms

- React Hook Form + Zod validation
- Inline validation with error messages
- Disabled state during submission

### Feedback

- Toast notifications for actions (sonner)
- Alert dialogs for destructive actions
- Loading skeletons for async content

## Terminology

| Use | Don't Use |
|-----|-----------|
| Customer | Client, Account |
| Order | Shipment (unless specific) |
| Invoice | Bill |
| Billing Period | Cycle |
| Accrual | Deferred Revenue |
| Rule | Policy, Condition |

## Iconography

Using Lucide React icons consistently:

| Concept | Icon |
|---------|------|
| Customers | Users |
| Orders | Package |
| Invoices | FileText |
| Billing | DollarSign |
| Settings | Settings |
| Add/Create | Plus |
| Edit | Pencil |
| Delete | Trash2 |
| Search | Search |
| Filter | Filter |
