# Component Patterns Reference

<reference>

<rules name="accessibility-checklist">

## Accessibility Checklist

- You MUST NOT use `onClick` on `<div>` without `role` and `tabIndex`
- SVGs MUST have `aria-hidden="true"` or a `<title>`
- Focus indicators MUST be visible
- Form inputs MUST have associated `<label>` or `aria-label`

</rules>

<guidelines name="composition">

## Composition Patterns

| Part | Purpose |
|------|---------|
| **Root** | Container with context provider |
| **Trigger** | Activator using `asChild` |
| **Content** | The main displayed part |

</guidelines>

<rules name="naming">

## Naming Conventions

- You SHOULD use standard suffixes: `Trigger`, `Content`, `Header`, `Footer`, `Title`, `Description`
- You MUST use kebab-case for `data-slot` values

</rules>

</reference>
