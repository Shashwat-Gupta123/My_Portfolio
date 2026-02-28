# ⚡ Shashwat Kr Gupta — Portfolio

> Agentic AI × Azure themed personal portfolio

## 🚀 Quick Start

**Zero dependencies required** — built with Node.js built-ins only.

```bash
node server.js
```

Then open: **http://localhost:3000**

## ✨ Features

- **Neural Network Background** — animated nodes + edges canvas
- **Live Codeforces Rating** — fetched from CF API on every page load
- **Live LeetCode Stats** — total solved, easy/medium/hard breakdown, global rank
- **Custom cursor** with electric blue glow
- **Scroll-reveal animations** on all sections
- **Midnight black + electric blue** Azure-inspired theme
- **Orbitron + Rajdhani + JetBrains Mono** font stack
- **Fully responsive** mobile layout

## 📁 Structure

```
portfolio/
└── server.js          # Single-file Node.js server (no npm needed)
└── package.json
└── README.md
```

## 🎨 Sections

1. Hero — Name, title, bio, CTAs + HUD elements
2. About — Bio + stats
3. Skills — Agentic AI, Azure, Backend, Frontend
4. Projects — Smart Store Assistant, Data Agent over Semantic Model
5. Experience — MAQ Software + Education
6. Competitive Coding — Live CF + LC stats
7. Blog — Placeholder cards
8. Contact — Social links + contact form

## 🔧 Customization

All content is in the `generateHTML()` function in `server.js`.
The live stats are fetched from Codeforces API and LeetCode GraphQL API.

To add email functionality to the contact form, integrate Nodemailer:
```bash
npm install nodemailer
```
