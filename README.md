# Circlash! - Circle Battle Arena Game

**Circlash!** is a modern, mobile-first circle battle arena game built with Next.js, TypeScript, and Tailwind CSS. Design custom arenas, choose from diverse characters with unique abilities, and engage in epic circular combat.

## 🎮 Repository Structure

```
circlash/
├── app/                     # Next.js App Router pages
│   ├── layout.tsx          # Global layout with header/footer
│   ├── page.tsx            # Homepage with game modes
│   ├── characters/         # Character roster page
│   ├── editor/             # Arena editor page
│   └── play/               # Game interface page
├── components/             # Reusable React components
│   ├── Header.tsx          # Navigation with mobile menu
│   ├── Footer.tsx          # Site footer
│   ├── Hero.tsx            # Homepage hero section
│   ├── ModeCard.tsx        # Game mode selection cards
│   ├── ArenaQuickEditor.tsx # Mini arena editor
│   ├── CharacterCard.tsx   # Character display cards
│   ├── CharacterModal.tsx  # Character details modal
│   ├── ArenaEditor.tsx     # Full arena editor
│   └── ArenaPreview.tsx    # Live arena preview
├── data/                   # TypeScript data models
│   ├── characters.ts       # Character definitions
│   └── arena.ts           # Arena settings types
├── styles/                 # Global styles
│   └── globals.css        # Tailwind imports & custom CSS
└── public/                # Static assets

```

This structure follows Next.js 14 best practices with TypeScript, mobile-first responsive design, and modular component architecture for scalable game development.

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to start playing!

## 🎯 Features Implemented

### ✅ Global Layout & Navigation
- Responsive header with mobile hamburger menu
- Clean footer with social links
- Mobile-first design (320px+)

### ✅ Character System
- **6 Unique Characters** with distinct stats and abilities
- **Character Cards** showing speed, damage, defense bars
- **Character Modal** with detailed abilities and battle preview
- **LocalStorage persistence** for active character selection
- **Rarity system** (Common, Rare, Epic, Legendary)

### ✅ Arena Editor
- **Full arena customization** with width/height controls (400×240 to 2048×2048)
- **5 Hazard types**: Spike, Fire, Ice, Electric, Void
- **Live preview** with zoom and grid controls
- **Save/Load presets** to localStorage
- **Export/Import** arena JSON files
- **Drag & drop** hazard placement
- **Background themes**: Grid, Dark, Neon, Space

### ✅ Game Modes
- **Roulette**: Quick 1v1 battles (2-3 min)
- **Battle Royale**: Last circle standing (5-8 min)
- **Story Mode**: Epic adventure campaign (15-30 min)
- **Custom**: User-defined scenarios (Variable)

## 🛠 Technical Stack

- **Next.js 14** - App Router, Server Components
- **TypeScript** - Full type safety
- **Tailwind CSS** - Utility-first styling
- **Canvas API** - Arena preview and character animations
- **LocalStorage** - Data persistence
- **Responsive Design** - Mobile-first approach

## 🎮 Game Features

### Character System
Each character has:
- **Unique stats** (Speed, Damage, Defense)
- **Two special abilities** with cooldowns
- **Weapon specialization**
- **Battle preview** with trajectory visualization

### Arena Editor
- **Real-time preview** with canvas rendering
- **Hazard placement** with drag & drop
- **Validation system** for arena constraints
- **Preset management** with save/load
- **JSON export/import** for sharing

### Navigation & UX
- **Toast notifications** for user feedback
- **Keyboard accessibility** support
- **Loading states** and error handling
- **Mobile-optimized** touch interactions

## 📱 Responsive Design

- **Mobile**: 320px - 768px (Touch-optimized)
- **Tablet**: 768px - 1024px (Hybrid interaction)
- **Desktop**: 1024px+ (Full feature set)

All components adapt seamlessly across screen sizes with Tailwind's responsive utilities.

---

*Ready to battle? Create your arena, choose your character, and dominate the circle!* ⚡
