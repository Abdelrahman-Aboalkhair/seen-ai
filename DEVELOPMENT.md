# Development Guide

This document provides comprehensive guidelines for developing the SEEN AI HR platform.

## Table of Contents

- [Getting Started](#getting-started)
- [Code Standards](#code-standards)
- [Architecture](#architecture)
- [Testing](#testing)
- [Performance](#performance)
- [Security](#security)
- [Deployment](#deployment)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Docker & Docker Compose
- Git
- VS Code (recommended)

### Development Environment Setup

1. **Clone and setup**

   ```bash
   git clone <repository-url>
   cd smart-recruiter-client-final
   make setup
   ```

2. **Environment Configuration**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

3. **Start Development**
   ```bash
   make dev
   # or with Docker
   make docker-dev
   ```

## Code Standards

### TypeScript Guidelines

- **Strict Mode**: Always use TypeScript strict mode
- **Type Definitions**: Define interfaces for all data structures
- **Avoid `any`**: Use proper typing, avoid `any` type
- **Generic Types**: Use generics for reusable components

```typescript
// ✅ Good
interface User {
  id: string;
  email: string;
  profile: UserProfile;
}

const [users, setUsers] = useState<User[]>([]);

// ❌ Bad
const [users, setUsers] = useState<any[]>([]);
```

### React Guidelines

- **Functional Components**: Use functional components with hooks
- **Custom Hooks**: Extract reusable logic into custom hooks
- **Component Structure**: Follow consistent component structure

```typescript
// ✅ Good component structure
interface ComponentProps {
  title: string;
  onAction: () => void;
}

export function MyComponent({ title, onAction }: ComponentProps) {
  // 1. Hooks
  const [state, setState] = useState();

  // 2. Effects
  useEffect(() => {
    // effect logic
  }, []);

  // 3. Event handlers
  const handleClick = () => {
    onAction();
  };

  // 4. Render
  return (
    <div>
      <h1>{title}</h1>
      <button onClick={handleClick}>Action</button>
    </div>
  );
}
```

### Styling Guidelines

- **Tailwind CSS**: Use Tailwind classes for styling
- **Custom CSS**: Avoid custom CSS unless necessary
- **Responsive Design**: Use Tailwind responsive prefixes
- **Dark Mode**: Support dark mode with `dark:` prefix

```tsx
// ✅ Good styling
<div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
    Title
  </h2>
</div>

// ❌ Bad - avoid custom CSS
<div style={{ backgroundColor: 'white', padding: '16px' }}>
  <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Title</h2>
</div>
```

### File Organization

```
src/
├── components/
│   ├── ui/              # Reusable UI components
│   ├── layout/          # Layout components
│   ├── dashboard/       # Dashboard-specific components
│   └── auth/           # Authentication components
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
├── services/           # API services
└── utils/              # Utility functions
```

### Naming Conventions

- **Components**: PascalCase (`UserProfile.tsx`)
- **Files**: kebab-case for non-components (`api-client.ts`)
- **Variables**: camelCase (`userProfile`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Interfaces**: PascalCase with `I` prefix (`IUser`)

## Architecture

### State Management

- **Server State**: Use React Query for API data
- **Local State**: Use React useState/useReducer
- **Global State**: Use Zustand for app-wide state

```typescript
// React Query for server state
const { data: users, isLoading } = useQuery({
  queryKey: ["users"],
  queryFn: fetchUsers,
});

// Zustand for global state
const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
```

### Component Architecture

- **Atomic Design**: Follow atomic design principles
- **Composition**: Use composition over inheritance
- **Props Interface**: Always define prop interfaces

```typescript
// ✅ Good - Composition
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Content</p>
  </CardContent>
</Card>
```

### Error Handling

- **Error Boundaries**: Use error boundaries for component errors
- **API Errors**: Handle API errors gracefully
- **User Feedback**: Show appropriate error messages

```typescript
// Error boundary
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

## Testing

### Testing Strategy

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test component interactions
- **E2E Tests**: Test complete user workflows

### Writing Tests

```typescript
// Component test example
import { render, screen } from "@testing-library/react";
import { UserProfile } from "./UserProfile";

describe("UserProfile", () => {
  it("renders user information correctly", () => {
    const user = { name: "John Doe", email: "john@example.com" };

    render(<UserProfile user={user} />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
  });
});
```

### Test Commands

```bash
npm run test              # Run all tests
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Generate coverage report
npm run test:e2e          # Run E2E tests
```

## Performance

### Optimization Techniques

- **Code Splitting**: Use React.lazy for route-based splitting
- **Memoization**: Use React.memo for expensive components
- **Virtualization**: Use virtual scrolling for large lists
- **Image Optimization**: Optimize images and use lazy loading

```typescript
// Code splitting
const Dashboard = React.lazy(() => import("./Dashboard"));

// Memoization
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* expensive rendering */}</div>;
});
```

### Performance Monitoring

- **Bundle Analysis**: Use webpack-bundle-analyzer
- **Performance Metrics**: Monitor Core Web Vitals
- **Memory Leaks**: Check for memory leaks in development

```bash
# Bundle analysis
npm run build:analyze

# Performance audit
npm run audit:performance
```

## Security

### Security Best Practices

- **Input Validation**: Validate all user inputs
- **XSS Prevention**: Use React's built-in XSS protection
- **CSRF Protection**: Implement CSRF tokens
- **Environment Variables**: Never commit sensitive data

```typescript
// Input validation
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Sanitize user input
const sanitizeInput = (input: string): string => {
  return input.replace(/[<>]/g, "");
};
```

### Authentication & Authorization

- **JWT Tokens**: Use secure JWT tokens
- **Role-based Access**: Implement RBAC
- **Session Management**: Proper session handling

```typescript
// Role-based component rendering
const ProtectedComponent = ({ requiredRole }: { requiredRole: string }) => {
  const { user } = useAuth();

  if (!user || user.role !== requiredRole) {
    return <AccessDenied />;
  }

  return <Component />;
};
```

## Deployment

### Environment Configuration

- **Environment Variables**: Use proper environment configuration
- **Build Optimization**: Optimize for production builds
- **CDN Integration**: Use CDN for static assets

### Deployment Checklist

- [ ] All tests passing
- [ ] Linting errors resolved
- [ ] Build successful
- [ ] Environment variables configured
- [ ] Security scan completed
- [ ] Performance audit passed

### Monitoring & Logging

- **Error Tracking**: Implement error tracking (Sentry)
- **Performance Monitoring**: Monitor application performance
- **User Analytics**: Track user behavior (respecting privacy)

## Contributing

### Pull Request Process

1. **Create Feature Branch**

   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Make Changes**

   - Follow coding standards
   - Write tests for new features
   - Update documentation

3. **Commit Changes**

   ```bash
   git commit -m 'feat: add amazing feature'
   ```

4. **Push and Create PR**
   ```bash
   git push origin feature/amazing-feature
   ```

### Commit Message Convention

Use conventional commits:

```
feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting changes
refactor: code refactoring
test: adding tests
chore: maintenance tasks
```

### Code Review Guidelines

- **Review Checklist**: Use provided review checklist
- **Constructive Feedback**: Provide constructive feedback
- **Approval Process**: Require at least one approval
- **Automated Checks**: Ensure all CI checks pass

## Troubleshooting

### Common Issues

#### Build Issues

```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npx tsc --noEmit
```

#### Docker Issues

```bash
# Rebuild containers
docker-compose build --no-cache
docker-compose up
```

#### Performance Issues

```bash
# Analyze bundle
npm run build:analyze

# Check for memory leaks
npm run audit:performance
```

### Getting Help

- **Documentation**: Check this guide and README
- **Issues**: Create GitHub issue with detailed description
- **Discussions**: Use GitHub Discussions for questions
- **Team Chat**: Reach out to the development team

---

For more information, see the [README.md](README.md) file.
