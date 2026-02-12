# Design Brief: Kursverwaltungssystem

## 1. App Analysis
- **What this app does:** Ein umfassendes Kursverwaltungssystem für Bildungseinrichtungen - verwaltet Kurse, Dozenten, Teilnehmer, Räume und Anmeldungen mit allen CRUD-Operationen.
- **Who uses this:** Verwaltungsmitarbeiter einer Akademie, VHS oder Weiterbildungsinstitution
- **The ONE thing users care about most:** Schneller Überblick über aktive Kurse und deren Auslastung
- **Primary actions:** Kurs anlegen, Teilnehmer anmelden, Bezahlstatus aktualisieren

## 2. What Makes This Design Distinctive
- **Visual identity:** Akademische Eleganz mit modernem Touch - warme Slate-Töne treffen auf tiefes Indigo als Akzent. Nicht steril wie alte Uni-Software, sondern einladend wie ein Premium-Lernportal.
- **Layout strategy:** Tab-basierte Navigation für die 5 Entitäten, Hero-Dashboard mit KPIs oben, dann Tabellen für Datenverwaltung
- **Unique element:** Gradient-Header mit dem Hero-KPI (aktive Kurse) als visuellem Anker - subtile "glow" Effekte bei wichtigen Aktionen

## 3. Theme & Colors
- **Font:** Plus Jakarta Sans - modern, professionell, hervorragende Lesbarkeit
- **Google Fonts:** `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap`
- **Why this font:** Perfekte Balance zwischen Professionalität und Zugänglichkeit, excellent für Daten-Interfaces

### Color Palette (HSL)
- **Primary (Indigo):** hsl(234 89% 54%) - tiefes, vertrauenswürdiges Akademie-Blau
- **Primary Glow:** hsl(234 89% 64%) - hellere Version für Hover/Glow
- **Background:** hsl(220 20% 98%) - warm off-white mit leichtem Blau-Touch
- **Card:** hsl(0 0% 100%) - reines Weiß für Karten
- **Foreground:** hsl(222 47% 11%) - tiefes Slate für Text
- **Muted:** hsl(220 14% 96%) - subtiles Grau
- **Muted Foreground:** hsl(220 9% 46%) - sekundärer Text
- **Success:** hsl(142 76% 36%) - für "Bezahlt" Status
- **Warning:** hsl(38 92% 50%) - für "Ausstehend" Status

## 4. Mobile Layout
- **Layout approach:** Single-column, Tab-Bar unten für Navigation
- **What users see:** Header mit App-Name → KPI-Cards (horizontal scrollbar) → Tab-Content mit Listen
- **Touch targets:** Minimum 44px, FAB (Floating Action Button) für primäre Aktion

## 5. Desktop Layout
- **Overall structure:** Sidebar-Navigation links (280px) + Main Content
- **Section layout:** KPI-Row oben (4 Karten), dann Tabellen mit Such-/Filterleiste
- **Hover states:** Subtile Hintergrund-Änderung, Aktions-Buttons erscheinen

## 6. Components

### Hero KPI
- **Metric:** Aktive Kurse
- **Style:** Größere Karte mit Gradient-Hintergrund, Icon, Zahl prominent

### Secondary KPIs
- Teilnehmer gesamt
- Anmeldungen diesen Monat
- Auslastung (%)

### Tables
- Striped rows, sticky header
- Inline-Edit für schnelle Änderungen
- Action-Buttons am Zeilenende (Edit, Delete)

### Primary Action Buttons
- "Neuer Kurs", "Neue Anmeldung" etc.
- Gradient-Hintergrund mit Glow-Shadow

## 7. Visual Details
- **Border radius:** 12px für Karten, 8px für Buttons, 6px für Inputs
- **Shadows:**
  - Cards: `0 1px 3px hsl(222 47% 11% / 0.1), 0 1px 2px hsl(222 47% 11% / 0.06)`
  - Elevated: `0 10px 30px -10px hsl(234 89% 54% / 0.2)`
- **Spacing:** 8px grid system
- **Animations:**
  - Transitions: `all 0.2s cubic-bezier(0.4, 0, 0.2, 1)`
  - Button hover: slight scale(1.02) + glow

## 8. CSS Variables

```css
:root {
  --font-sans: 'Plus Jakarta Sans', system-ui, sans-serif;

  /* Primary palette */
  --primary: hsl(234 89% 54%);
  --primary-glow: hsl(234 89% 64%);
  --primary-foreground: hsl(0 0% 100%);

  /* Backgrounds */
  --background: hsl(220 20% 98%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(222 47% 11%);

  /* Text */
  --foreground: hsl(222 47% 11%);
  --muted: hsl(220 14% 96%);
  --muted-foreground: hsl(220 9% 46%);

  /* States */
  --success: hsl(142 76% 36%);
  --success-foreground: hsl(0 0% 100%);
  --warning: hsl(38 92% 50%);
  --warning-foreground: hsl(0 0% 100%);

  /* Gradients */
  --gradient-primary: linear-gradient(135deg, hsl(234 89% 54%), hsl(234 89% 64%));
  --gradient-hero: linear-gradient(135deg, hsl(234 89% 54%), hsl(262 83% 58%));

  /* Shadows */
  --shadow-sm: 0 1px 3px hsl(222 47% 11% / 0.1), 0 1px 2px hsl(222 47% 11% / 0.06);
  --shadow-md: 0 4px 6px -1px hsl(222 47% 11% / 0.1), 0 2px 4px -1px hsl(222 47% 11% / 0.06);
  --shadow-glow: 0 10px 30px -10px hsl(234 89% 54% / 0.3);

  /* Transitions */
  --transition-fast: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
```
