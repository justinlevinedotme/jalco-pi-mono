# Accessibility (a11y) & State Reference

<reference>

<overview>
Accessibility is a baseline requirement. All components MUST be usable by everyone, including keyboard-only and screen-reader users.
</overview>

<rules name="semantic-html">

## 1. Semantic HTML & Keyboard Maps

- **Foundation:** You MUST start with native elements (`<button>`, `<select>`)
- **Keyboard Navigation:** All interactive elements MUST be reachable via `Tab`

<examples>

### Keyboard Map Implementation

```tsx
const handleKeyDown = (e: React.KeyboardEvent) => {
  switch(e.key) {
    case 'ArrowDown': focusNext(); break;
    case 'Escape': close(); break;
    case 'Enter': case ' ': select(); break;
  }
};
```

</examples>

</rules>

<guidelines name="aria-patterns">

## 2. ARIA Patterns

| Type | Purpose | Examples |
|------|---------|----------|
| **Role** | Define what it is | `role="menu"`, `role="dialog"` |
| **State** | Describe dynamic status | `aria-expanded`, `aria-invalid`, `aria-checked` |
| **Properties** | Define relationships | `aria-controls="id"`, `aria-labelledby="id"` |
| **Live Regions** | Dynamic content updates | `aria-live="polite"` for "3 results found" |

</guidelines>

<rules name="focus-management">

## 3. Focus Management

- **Focus Trapping:** You MUST use for Modals/Dialogs to keep focus inside while open
- **Focus Restoration:** You MUST return focus to the trigger element when a component closes
- **Focus Visible:** Use `:focus-visible` in CSS to show focus indicators only for keyboard users

</rules>

<constraints name="color-contrast">

## 4. Color & Contrast

- **WCAG Ratios:** 4.5:1 for normal text, 3:1 for large text
- **Color Independence:** You MUST NOT convey info with color alone. Use icons or text labels.

</constraints>

<guidelines name="controlled-state">

## 5. Controlled vs. Uncontrolled State

Professional components SHOULD support both modes.

| Mode | Description |
|------|-------------|
| **Controlled** | Parent owns state via `value` and `onChange` |
| **Uncontrolled** | Component owns state via `defaultValue` |

**Implementation:** Use `useControllableState` (from Radix UI or similar) to merge both paths seamlessly.

<examples>

```tsx
const [value, setValue] = useControllableState({
  prop: controlledValue,
  defaultProp: defaultValue,
  onChange: onValueChange,
});
```

</examples>

</guidelines>

</reference>
