# @libs/frontend/ui

Shared UI component library for the Orbbit SMB Invoice Financing application.

## Overview

This library contains reusable UI components built with **shadcn/ui** and **Tailwind CSS v4**. Components are designed to work with React 19 and Next.js 15.

## Structure

```
libs/frontend/ui/
├── src/
│   ├── components/
│   │   └── shadcn/        # Shadcn UI components
│   │       ├── button.tsx
│   │       └── card.tsx
│   ├── lib/
│   │   └── utils.ts       # Utility functions (cn helper)
│   ├── styles.css         # Tailwind base styles with CSS variables
│   └── index.ts           # Main export file
├── components.json        # Shadcn configuration
├── tailwind.config.js     # Tailwind configuration
├── tsconfig.json
├── tsconfig.lib.json
├── project.json           # Nx project configuration
└── package.json
```

## Usage

Import components in your Next.js apps:

\`\`\`tsx
import { Button, Card, CardHeader, CardTitle, CardContent } from '@libs/frontend/ui';

export default function MyPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Click me</Button>
      </CardContent>
    </Card>
  );
}
\`\`\`

## Adding New Components

To add more shadcn components, use the shadcn CLI from the library root:

\`\`\`bash
cd libs/frontend/ui
pnpm dlx shadcn@latest add [component-name]
\`\`\`

Then export the component in \`src/index.ts\`.

## Available Components

- **Button**: Versatile button component with multiple variants (default, outline, ghost, etc.)
- **Card**: Card container with Header, Title, Description, Content, and Footer subcomponents
- **cn**: Utility function for merging Tailwind classes

## Configuration

- **Registry**: @shadcn (configured in components.json)
- **Style**: new-york
- **Base Color**: slate
- **CSS Variables**: Enabled
