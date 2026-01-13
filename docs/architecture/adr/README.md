# Architecture Decision Records (ADRs)

## What is an ADR?

An Architecture Decision Record (ADR) captures an important architectural decision made along with its context and consequences.

## Why ADRs?

- **Knowledge Preservation**: Capture the "why" behind architectural decisions
- **Onboarding**: Help new team members understand past decisions
- **Consistency**: Ensure decisions are made thoughtfully and documented

## When to Create an ADR?

Create an ADR when making decisions about:

- ✅ **Architecture patterns**
- ✅ **Technology choices**
- ✅ **Data models**
- ✅ **API design**
- ✅ **Security approaches**

## ADR Naming Convention

```
NNNN-title-of-decision.md
```

Examples:
- `0001-use-jest-for-unit-testing.md`
- `0002-adopt-multi-tier-storage-architecture.md`

## Using the Template

1. Copy `adr-template.md`
2. Fill in all sections
3. Submit for review via PR
4. Update status as it progresses

## Best Practices

**DO:**
- ✅ Write ADRs in clear language
- ✅ Include diagrams when helpful
- ✅ Reference related documentation

**DON'T:**
- ❌ Skip ADRs for "obvious" decisions
- ❌ Write ADRs after the fact
- ❌ Edit accepted ADRs (create superseding ADRs instead)
