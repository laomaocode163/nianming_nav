# Registered Lucide Icons

Category and sub-category `icon` fields in `src/config/data/categories.json` must match a
key in the `iconMap` of `src/components/ui/CategoryIcon.vue`. Unknown names fall back to
`Star` (blank-looking icon), so always register or reuse a known name.

## Already registered icon names

Use these directly in `categories.json` without editing `CategoryIcon.vue`:

```
star, bot, boxes, terminal, book-open, zap, blocks, rocket, file-code, file-text, coffee,
braces, leaf, link, hammer, palette, newspaper, gamepad-2, film, clapperboard, music,
library, monitor, shield-check, globe, wrench, pencil, image, video, rss, puzzle, radio,
cpu, lightbulb, pen-line, smile-plus, ellipsis, sparkles, plug, bar-chart, briefcase,
search, compass, paintbrush, users
```

Example mapping (name → Lucide component):

```
star: Star
bot: Bot
file-code: FileCode
book-open: BookOpen
bar-chart: BarChart3
gamepad-2: Gamepad2
pen-line: PenLine
smile-plus: SmilePlus
shield-check: ShieldCheck
file-text: FileText
```

## Adding a new icon

When none of the registered names fits, register a new Lucide icon:

1. Find the icon in `lucide-vue-next` (https://lucide.dev/icons). Note its PascalCase
   component name (e.g. `Briefcase`, `Paintbrush`).
2. In `src/components/ui/CategoryIcon.vue`, add it to the import list:

   ```ts
   import { Briefcase, Paintbrush } from 'lucide-vue-next';
   ```

3. Add it to the `iconMap` with a kebab-case key:

   ```ts
   const iconMap: Record<string, LucideIcon> = {
     // ...existing...
     briefcase: Briefcase,
     paintbrush: Paintbrush,
   };
   ```

4. Use that kebab-case key as the category's `icon` value.

Keep the import list and `iconMap` entries alphabetically grouped for readability.
