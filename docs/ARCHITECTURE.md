# Architecture

## Folder Structure
```text
src/
├── assets/          # Static assets (images, fonts, global svgs)
├── components/      # Reusable UI components
│   ├── auth/        # Authentication related layouts and components
│   ├── charts/      # Recharts visualizations
│   ├── common/      # Highly reusable atoms (Button, Card, Input, Logo, Table)
│   ├── dashboard/   # Dashboard specific widgets
│   ├── landing/     # Landing page sections
│   └── layout/      # Core structural layouts (Sidebar, DashboardHeader)
├── constants/       # Global constants (e.g., routes.js)
├── context/         # React Context providers (AuthContext, ThemeContext, ToastContext)
├── data/            # Mock data and static content
├── hooks/           # Custom React hooks
├── pages/           # Page-level components
│   └── features/    # The six individual feature modules
├── services/        # API service layers (future use)
└── utils/           # Utility functions and formatters
```

## Page / Component Relationship
Pages act as orchestration layers. They compose multiple smaller, focused components. For example, `Dashboard.jsx` does not contain complex markup; it imports `StatCard`, `WeeklyThreatsChart`, etc., passing them data from context or mock files.

## Routing Structure
Routing is handled centrally in `App.jsx` using `react-router-dom`.
- **Public Routes**: `/` (Landing), `/login`, `/signup`, `/forgot-password`
- **Protected Routes**: Routed under `/app/*`, wrapped in `ProtectedRoute` (auth check) and `DashboardLayout` (sidebar/topbar shell).

## Shared Component Approach
To maintain visual consistency and reduce technical debt across T1, T2, and T3, developers **must** use the foundational components in `src/components/common/`.
- Do not build custom buttons; use `<Button>`.
- Do not build custom containers; use `<Card>`.
- UI variations should be handled by expanding the component's `variant` or `size` props, rather than duplicating the component entirely.
