# VISUAL AUDIT RULES

1. Screenshot-grounded only. A finding without a screenshot reference or
   source path is invalid.
2. Severity scale: P0 broken/unusable · P1 blocks professional use ·
   P2 polish · P3 nice-to-have.
3. Score rubric /10: 9–10 ships against Figma/Fusion today · 7–8 minor
   polish · 5–6 structural UX gaps · <5 route not production-viable.
4. Contrast claims must state the pair and computed ratio (WCAG 2.2 AA:
   4.5:1 text, 3:1 large text/UI components).
5. Touch-target claims must state measured px at the iPad viewport
   (1194×834 @2x); minimum 44×44pt.
6. 3D claims must distinguish observed (screenshot) from code-inferred
   (source) from UNVERIFIED (needs runtime profiling).
7. Do not propose new design languages. Obsidian/cyan/gold glassmorphism
   is the system; improve execution, not direction.
8. Every recommendation names files and lands in a phase:
   P0→Phase 1 · UX→Phase 2 · perf→Phase 3 · iPad→Phase 4 · commercial→Phase 5.
