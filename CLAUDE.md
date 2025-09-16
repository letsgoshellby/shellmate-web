# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev         # Start development server with Turbopack at http://localhost:3000

# Production
npm run build       # Build for production with Turbopack
npm run start       # Start production server

# Code quality
npm run lint        # Run ESLint
```

## Architecture

This is a Next.js 15.5.3 application using the App Router architecture with Turbopack enabled for faster builds.

### Technology Stack
- **Framework**: Next.js 15.5.3 with App Router
- **UI**: React 19.1.0
- **Styling**: Tailwind CSS v4 with PostCSS
- **Font**: Geist font family (sans and mono)
- **Linting**: ESLint 9 with Next.js configuration

### Project Structure
- `src/app/` - App Router pages and layouts
  - `layout.js` - Root layout with Geist fonts and global metadata
  - `page.js` - Home page component
  - `globals.css` - Global styles with Tailwind CSS and CSS variables for theming
- `public/` - Static assets (SVG icons)

### Key Configuration
- **Turbopack**: Enabled in both dev and build scripts for improved performance
- **Dark Mode**: Supported via CSS custom properties and `prefers-color-scheme`
- **ESLint**: Configured with Next.js Core Web Vitals rules