# Dũng Lại Lập Trình — Official Website

## Mission
Create implementation-ready, token-driven UI guidance for Dũng Lại Lập Trình — Official Website that is optimized for consistency, accessibility, and fast delivery across web app.

## Brand
- Product/brand: Dũng Lại Lập Trình — Official Website
- URL: https://www.dunglailaptrinh.com/#
- Audience: buyers, teams, and decision-makers
- Product surface: web app

## Style Foundations
- Visual style: structured, tokenized, content-first
- Main font style: `font.family.primary=Inter`, `font.family.stack=Inter, -apple-system, sans-serif`, `font.size.base=16px`, `font.weight.base=400`, `font.lineHeight.base=25.6px`
- Typography scale: `font.size.xs=11px`, `font.size.sm=12px`, `font.size.md=13px`, `font.size.lg=13.33px`, `font.size.xl=14px`, `font.size.2xl=15px`, `font.size.3xl=16px`, `font.size.4xl=17px`
- Color palette: `color.text.primary=#94a3b8`, `color.text.secondary=#f1f5f9`, `color.text.tertiary=#e2e8f0`, `color.text.inverse=#2dd4bf`, `color.surface.base=#000000`, `color.surface.muted=#111119`, `color.border.muted=#ffffff`, `color.surface.strong=#14b8a6`
- Spacing scale: `space.1=6px`, `space.2=7px`, `space.3=8px`, `space.4=9px`, `space.5=10px`, `space.6=12px`, `space.7=14px`, `space.8=16px`
- Radius/shadow/motion tokens: `radius.xs=8px`, `radius.sm=14px`, `radius.md=20px`, `radius.lg=28px`, `radius.xl=50px`, `radius.2xl=100px` | `shadow.1=rgba(249, 115, 22, 0.4) 0px 0px 0px 0px`, `shadow.2=rgba(200, 75, 36, 0.15) 0px 0px 0px 1px, rgba(0, 0, 0, 0.5) 0px 32px 80px 0px, rgba(200, 75, 36, 0.06) 0px 0px 60px 0px` | `motion.duration.instant=150ms`, `motion.duration.fast=200ms`

## Accessibility
- Target: WCAG 2.2 AA
- Keyboard-first interactions required.
- Focus-visible rules required.
- Contrast constraints required.

## Writing Tone
Concise, confident, implementation-focused.

## Rules: Do
- Use semantic tokens, not raw hex values, in component guidance.
- Every component must define states for default, hover, focus-visible, active, disabled, loading, and error.
- Component behavior should specify responsive and edge-case handling.
- Interactive components must document keyboard, pointer, and touch behavior.
- Accessibility acceptance criteria must be testable in implementation.

## Rules: Don't
- Do not allow low-contrast text or hidden focus indicators.
- Do not introduce one-off spacing or typography exceptions.
- Do not use ambiguous labels or non-descriptive actions.
- Do not ship component guidance without explicit state rules.

## Guideline Authoring Workflow
1. Restate design intent in one sentence.
2. Define foundations and semantic tokens.
3. Define component anatomy, variants, interactions, and state behavior.
4. Add accessibility acceptance criteria with pass/fail checks.
5. Add anti-patterns, migration notes, and edge-case handling.
6. End with a QA checklist.

## Required Output Structure
- Context and goals.
- Design tokens and foundations.
- Component-level rules (anatomy, variants, states, responsive behavior).
- Accessibility requirements and testable acceptance criteria.
- Content and tone standards with examples.
- Anti-patterns and prohibited implementations.
- QA checklist.

## Component Rule Expectations
- Include keyboard, pointer, and touch behavior.
- Include spacing and typography token requirements.
- Include long-content, overflow, and empty-state handling.
- Include known page component density: buttons (37), links (32), cards (17), lists (16), navigation (1).

- Extraction diagnostics: Audience and product surface inference confidence is low; verify generated brand context.

## Quality Gates
- Every non-negotiable rule must use "must".
- Every recommendation should use "should".
- Every accessibility rule must be testable in implementation.
- Teams should prefer system consistency over local visual exceptions.
