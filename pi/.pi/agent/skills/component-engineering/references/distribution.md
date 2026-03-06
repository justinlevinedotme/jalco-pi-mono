# Distribution & Ownership Reference

<reference>

<overview>
Choosing the right distribution model depends on the required ownership and customization level.
</overview>

<guidelines name="distribution-models">

## Registry (Source Distribution)

Source code is copied directly into the project (e.g., shadcn/ui).

**Advantages:**
- Full ownership
- Zero runtime overhead
- Easy customization

**Disadvantages:**
- Manual updates required
- Code duplication across projects

## NPM (Package Distribution)

Pre-built, versioned code installed as a dependency.

**Advantages:**
- Version management
- Simplified installation

**Disadvantages:**
- Difficult to customize
- Black-box implementation

</guidelines>

<rules name="transparency">

## Transparency Principle

In open-source, consumers SHOULD benefit from visibility.

- You SHOULD provide source maps and readable code
- You MUST document project structure and dependencies clearly
- You MUST include migration guides for breaking changes

</rules>

</reference>
