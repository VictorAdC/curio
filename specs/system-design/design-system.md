# Design System Strategy: The Sonic Architecture

## 1. Overview & Creative North Star

The Creative North Star for this design system is **"The Sonic Architecture."**

In professional music environments, focus is a finite resource. This system is designed to mimic the high-precision, low-fatigue environment of a world-class recording studio. We are moving away from "generic dark mode" toward a **"Studio Dark"** aesthetic — an intentional, high-contrast environment where UI elements are treated like physical hardware controls.

The design breaks the "template" look through intentional asymmetry and tonal depth. By utilizing high-contrast typography scales and overlapping surface layers, we create a layout that feels editorial and curated rather than programmed. Every element must feel like it was placed by a master engineer, prioritizing functional precision and visual silence.

---

## 2. Colors: Tonal Precision

The palette is rooted in a deep charcoal foundation (`#131313`), punctuated by high-visibility accents that guide the musician's eye without causing chromatic fatigue.

### The "No-Line" Rule

To achieve a premium, custom feel, **1px solid borders for sectioning are strictly prohibited.** We do not use lines to define space; we use light. Boundaries must be defined solely through:

- **Background Color Shifts:** Moving from `surface` to `surface_container_low`.
- **Subtle Tonal Transitions:** Using the hierarchy of containers to denote a change in functional zone.

### Surface Hierarchy & Nesting

Treat the UI as a series of physical layers — like stacked sheets of obsidian glass.

| Layer | Token | Value | Purpose |
|---|---|---|---|
| Base | `surface` | `#131313` | Primary background |
| Secondary zones | `surface_container_low` | — | Sidebars, panels |
| Active work areas | `surface_container_high` | — | Waveform, score view |
| Critical interactive elements | `surface_container_highest` | — | Elements that must "pop" |

### The "Glass & Gradient" Rule

Standard flat colors feel "out-of-the-box." To elevate the experience:

- **Glassmorphism:** Use semi-transparent versions of `surface_variant` with a 20px–40px `backdrop-blur` for floating overlays (e.g., metronome settings or tempo pickers).
- **Signature Textures:** For primary CTAs (like "Start Practice"), use a subtle linear gradient transitioning from `primary` (`#ffb693`) to `primary_container` (`#ff6b00`). This adds "soul" and a sense of tactile light common in high-end audio hardware.

---

## 3. Typography: The Editorial Rhythm

We use **Inter** for its neutral, technical clarity, but apply it with an editorial mindset.

| Role | Scale | Treatment |
|---|---|---|
| Display & Headlines | `display-lg`, `headline-md` | Tighter letter-spacing (`-0.02em`) — authoritative and custom |
| Metadata & Labels | `label-sm` | Conveys DAW precision (BPM, Key, Time Signature) |
| Active content | `on_surface` | High contrast; active song titles |
| Secondary content | `on_surface_variant` | Lower contrast; artist names, "Last Practiced" |

**Hierarchy of Focus:** High-contrast pairing is key. `on_surface` for primary, `on_surface_variant` for everything that supports it.

---

## 4. Elevation & Depth: Tonal Layering

Depth is achieved through **Tonal Layering** rather than traditional drop shadows.

- **The Layering Principle:** Place a `surface_container_lowest` card on a `surface_container_low` section to create a soft, natural "recess" or "lift" — mimicking how light hits different planes of a physical console.
- **Ambient Shadows:** Used sparingly for floating elements only. Must be extra-diffused (blur: 24px–48px) and low-opacity (4%–8%). Shadow color must be a tinted version of `surface_container_lowest` to feel integrated.
- **The "Ghost Border" Fallback:** If a border is required for accessibility, use the `outline_variant` token at 15% opacity. Never use 100% opaque borders.
- **Tactile Transitions:** On hover, move an element up one level in the surface hierarchy (e.g., from `surface_container` to `surface_container_high`) rather than just changing color.

---

## 5. Components: Functional Hardware

Every component should feel like a piece of high-end audio equipment.

### Buttons

| Type | Style |
|---|---|
| Primary | Gradient fill (`primary` → `primary_container`) with `on_primary_container` text; `md` roundedness (0.375rem) |
| Tertiary | No background; `secondary` (`#98cbff`) text with a "Ghost Border" on hover |

### Chips (Markers)

Use `secondary_container` for loop markers. Sharp, high-contrast — functioning like "tabs" on a mixer.

### Input Fields

Use `surface_container_highest` for the field body. Forbid the bottom-line-only style. Use a full-fill with a "Ghost Border" to define the hit area.

### Cards & Lists

Strictly forbid divider lines. Use vertical white space from the spacing scale (24px or 32px) to separate list items. For active items, shift the background to `surface_bright` or add a `primary` left-accent bar (3px width).

### DAW-Specific Components

- **The Playhead:** 2px vertical line using `primary` (`#ffb693`) with a soft glow (4px blur of the same color).
- **The Waveform:** Background `surface_container_low`, foreground `secondary_fixed_dim`.

---

## 6. Do's and Don'ts

### Do

- **Use Asymmetry:** Place controls in a way that prioritizes the right hand or specific practice workflows, breaking the centered-grid habit.
- **Embrace "Dark Space":** Let the `surface` background breathe. Large areas of empty charcoal allow `primary` and `secondary` accents to feel more significant.
- **Prioritize Legibility:** Ensure `on_surface` text always meets WCAG AAA standards against the `surface` background.

### Don't

- **No 100% White:** Avoid `#FFFFFF`. Use `on_surface` (`#e5e2e1`) for a premium, "Studio" feel that reduces eye strain during long sessions.
- **No Sharp Corners:** Avoid `none` roundedness unless for technical data charts. Use `md` or `lg` to make the "hardware" feel ergonomic.
- **No Heavy Shadows:** Never use high-opacity, dark black shadows — they muddy the deep charcoal palette. If the surface hierarchy is correct, shadows aren't needed.
