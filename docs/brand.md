# Brand & Logo

## Naming rationale

**AboutFit** — two everyday English words that carry triple meaning in the apparel context:

1. **About / Fit** — literally "关于合身", the single most-asked question by online apparel shoppers.
2. **A · Fit** — "A" reads as the indefinite article ("a perfect fit") and visually doubles as the silhouette of a garment hanging on a hanger.
3. **About-face** — a subtle nod to the brand's superpower: turning a flat-lay photo *about-face* into a fully styled on-model lookbook.

The name is short (7 letters), pronounceable in EN/ZH/JA, available as `.com`-class domain candidates, and avoids overused "AI / GPT / Vision" suffixes.

## Brand positioning

| Axis | AboutFit |
|---|---|
| Vertical | Apparel only (no jewelry, no 3C, no furniture) |
| Buyer | DTC apparel brands, Taobao/Tmall 服装店主, Shopify boutiques, TikTok Shop sellers |
| Job-to-be-done | Replace a 5-person photoshoot team (model + photographer + stylist + retoucher + copywriter) with a single operator |
| Tone | Quiet · editorial · craft — closer to *Aritzia* / *COS* / *MUJI* than to *Temu* |

## Color tokens

```css
/* Primary — Indigo Ink */
--af-indigo-950: #0F0D2C;
--af-indigo-900: #1E1B4B;   /* brand primary */
--af-indigo-600: #4F46E5;

/* Accent — Coral Thread */
--af-coral-500:  #FB7185;   /* brand accent */
--af-coral-300:  #FDA4AF;

/* Neutrals — Calico */
--af-stone-50:   #FAFAF7;   /* canvas */
--af-stone-200:  #E7E5DE;
--af-stone-700:  #44423C;
--af-stone-900:  #1C1B17;
```

Indigo references denim and ink-stamped tech packs; coral references the thread on a sewing machine. The neutrals are warm-greyed (calico) rather than pure white/black — apparel photography looks lifeless on cool greys.

## Typography

- **Display**: *Fraunces* (variable, SOFT 50, OPSZ 144) — for hero headings, gives an editorial fashion-magazine voice
- **UI**: *Inter* (variable) — for all functional UI
- **Mono**: *JetBrains Mono* — for size charts, SKU codes, technical specs

## Logo prompt (for image generation)

Use this prompt verbatim with Midjourney v6 / Doubao 即梦 / DALL·E 3 / Imagen 3:

```
A minimalist vector logo for an apparel-tech brand called "AboutFit".
Concept: an abstract uppercase letter "A" whose two diagonal strokes are formed
by the silhouette of a long garment (a coat or dress) hanging from an invisible
hanger; the crossbar of the "A" is replaced by a single horizontal stitch line
in coral thread, with one tiny knot at the right end.
Style: editorial fashion mark, geometric, single continuous line where possible,
Bauhaus-meets-Aritzia. Negative space inside the "A" reads as a hanging garment.
Color: deep indigo ink #1E1B4B on warm off-white #FAFAF7 background,
single coral #FB7185 accent on the stitch line only.
No gradients, no 3D, no drop shadows, no text, no extra ornaments.
Square 1:1, centered, generous padding, suitable for a 32px favicon and a
512px app icon. Vector-clean edges.
```

### Logotype lockup

When the mark is paired with the wordmark:

```
[mark]  About·Fit
```

- The wordmark uses *Fraunces* SemiBold, tracking −10
- A middle dot (·) — not a hyphen — separates the two halves
- Minimum clear space on all sides = height of the lowercase "o"
- Minimum size: mark 16px, lockup 88px wide

## Don'ts

- ❌ Never render the mark in pure black — use `--af-indigo-900`
- ❌ Never rotate or skew the "A"
- ❌ Never recolor the coral stitch — it's the single brand-recognition cue
- ❌ Never tagline-stack ("AboutFit / AI for Apparel") under the lockup; keep the mark clean
