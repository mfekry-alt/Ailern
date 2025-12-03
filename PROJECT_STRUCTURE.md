# Ailern LMS - Project Structure & Implementation Guide

## Overview
This document provides a comprehensive guide to the Ailern LMS frontend project structure, implementation details, and integration points with the .NET backend.

## Technology Stack

### Core
- **React 18.3** - UI library
- **TypeScript 5.9** - Type safety
- **Vite 7.1** - Build tool and dev server

### Styling
- **Tailwind CSS 4.x** - Utility-first CSS
- **@tailwindcss/forms** - Form styling
- **@tailwindcss/typography** - Typography utilities
- **Headless UI** - Accessible UI components
- **Lucide React** - Icon library

### State & Data
- **Zustand** - Lightweight state management (auth)
- **TanStack Query v5** - Server state management
- **Axios** - HTTP client with interceptors

### Forms & Validation
- **React Hook Form** - Form state management
- **Zod** - Schema validation
- **@hookform/resolvers** - RHF + Zod integration

### Routing
- **React Router v6.28** - Client-side routing

### Testing
- **Vitest** - Unit testing
- **React Testing Library** - Component testing
- **MSW (Mock Service Worker)** - API mocking
- **@testing-library/jest-dom** - Custom matchers

## Project Structure

```
ailern/
├── public/                 # Static assets
├── src/
│   ├── app/               # Application shell
│   │   ├── layouts/       # Layout components
│   │   │   ├── MainLayout.tsx      # Public pages layout
│   │   │   ├── AuthLayout.tsx      # Auth pages layout
│   │   │   └── DashboardLayout.tsx # Protected pages layout
│   │   ├── providers.tsx  # Global providers (Query, Router)
│   │   └── router.tsx     # Route configuration
│   │
│   ├── features/          # Feature modules (domain logic)
│   │   ├── auth/
│   │   │   ├── api.ts            # Auth API hooks
│   │   │   └── store.ts          # Auth state (Zustand)
│   │   ├── courses/
│   │   ├── lessons/
│   │   ├── quizzes/
│   │   ├── enrollments/
│   │   ├── users/
│   │   └── admin/
│   │
│   ├── routes/            # Page components
│   │   ├── HomePage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── ForgotPasswordPage.tsx
│   │   ├── NotFoundPage.tsx
│   │   ├── ForbiddenPage.tsx
│   │   ├── student/        # Student role pages
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── CoursesPage.tsx
│   │   │   ├── CourseDetailPage.tsx
│   │   │   ├── LessonPlayerPage.tsx
│   │   │   └── ProfilePage.tsx
│   │   ├── instructor/     # Instructor role pages
│   │   │   ├── InstructorDashboardPage.tsx
│   │   │   ├── InstructorCoursesPage.tsx
│   │   │   ├── InstructorCourseEditPage.tsx
│   │   │   └── InstructorGradebookPage.tsx
│   │   └── admin/          # Admin role pages
│   │       ├── AdminDashboardPage.tsx
│   │       ├── AdminUsersPage.tsx
│   │       ├── AdminCoursesPage.tsx
│   │       └── AdminReportsPage.tsx
│   │
│   ├── components/        # Reusable components
│   │   └── ui/            # Base UI components
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Card.tsx
│   │       └── index.ts
│   │
│   ├── api/               # API layer
│   │   ├── client.ts      # Axios instance + interceptors
│   │   └── endpoints.ts   # API endpoint constants
│   │
│   ├── lib/               # Utilities & helpers
│   │   ├── utils.ts       # General utilities (cn, dates)
│   │   ├── constants.ts   # App constants (routes, roles)
│   │   ├── storage.ts     # LocalStorage wrapper
│   │   └── guards.tsx     # Route guards (auth, roles)
│   │
│   ├── hooks/             # Custom hooks
│   │   └── useAuth.ts     # Auth hook
│   │
│   ├── types/             # TypeScript types
│   │   └── index.ts       # All type definitions
│   │
│   ├── mocks/             # MSW handlers
│   │   ├── handlers.ts    # API mock handlers
│   │   └── browser.ts     # MSW browser setup
│   │
│   ├── test/              # Test setup
│   │   └── setup.ts       # Vitest setup
│   │
│   ├── App.tsx            # Root component
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles
│
├── .env                   # Environment variables
├── .env.example           # Example env file
├── .gitignore
├── .prettierrc            # Prettier config
├── .prettierignore
├── eslint.config.js       # ESLint config
├── tailwind.config.js     # Tailwind config
├── postcss.config.js      # PostCSS config
├── tsconfig.json          # TypeScript config
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts         # Vite config
├── vitest.config.ts       # Vitest config
├── package.json
└── README.md
```

## Authentication Flow

### Token Management
The app uses JWT-based authentication with refresh token rotation:

1. **Access Token** (Short-lived, ~15 min)
   - Stored in memory (Zustand store)
   - Sent in `Authorization: Bearer <token>` header
   - Automatically attached by Axios interceptor

2. **Refresh Token** (Long-lived, ~7 days)
   - Stored as HttpOnly cookie (backend sets it)
   - Secure, SameSite=Strict/Lax
   - Used to get new access token

3. **CSRF Token**
   - Sent with refresh requests
   - Stored in localStorage
   - Prevents CSRF attacks

### Auth Flow Diagram

```
Login → POST /auth/login
  ↓
Backend returns:
  - accessToken (in body)
  - refreshToken (HttpOnly cookie)
  - csrfToken (in body)
  - user object
  ↓
Frontend stores:
  - accessToken → Zustand store
  - user → Zustand store + localStorage
  - csrfToken → localStorage

---

API Request → GET /api/courses
  ↓
Axios adds: Authorization: Bearer <accessToken>
  ↓
If 401 (expired token):
  ↓
  POST /auth/refresh (with cookie + CSRF header)
  ↓
  Get new accessToken
  ↓
  Retry original request
  ↓
  If refresh fails → Logout + Redirect to /login
```

### Axios Interceptor

```typescript
// Request interceptor - Add access token
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor - Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Attempt token refresh
      // If success, retry original request
      // If fail, logout and redirect
    }
    return Promise.reject(error);
  }
);
```

## Role-Based Access Control (RBAC)

### Roles
- **Admin** - Full system access
- **Instructor** - Create/manage courses
- **Student** - Enroll and learn

### Route Protection

```typescript
// Public routes - No auth required
<Route path="/" element={<MainLayout />}>
  <Route index element={<HomePage />} />
</Route>

// Guest only - Redirect if authenticated
<Route element={<GuestOnly><AuthLayout /></GuestOnly>}>
  <Route path="/login" element={<LoginPage />} />
</Route>

// Protected - Require authentication
<Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
  <Route path="/dashboard" element={<DashboardPage />} />
</Route>

// Role-specific - Require specific roles
<Route element={<RequireRole roles={['Admin']}><DashboardLayout /></RequireRole>}>
  <Route path="/admin" element={<AdminDashboardPage />} />
</Route>
```

## Backend Integration

### API Base URL
Set in `.env`:
```
VITE_API_URL=http://localhost:5000/api
```

### Expected Backend Endpoints

#### Authentication
```
POST   /auth/login          - User login
POST   /auth/register       - User registration  
POST   /auth/refresh        - Refresh access token
POST   /auth/logout         - User logout
POST   /auth/forgot-password - Request password reset
POST   /auth/reset-password - Reset password with token
POST   /auth/verify-email   - Verify email
GET    /auth/me             - Get current user
```

#### Users
```
GET    /users               - List users (paginated)
GET    /users/:id           - Get user by ID
POST   /users               - Create user
PUT    /users/:id           - Update user
DELETE /users/:id           - Delete user
```

#### Courses
```
GET    /courses             - List courses (paginated, filterable)
GET    /courses/:id         - Get course details
POST   /courses             - Create course
PUT    /courses/:id         - Update course
DELETE /courses/:id         - Delete course
GET    /courses/:id/modules - Get course modules
```

#### Modules
```
GET    /modules/:id         - Get module
POST   /modules             - Create module
PUT    /modules/:id         - Update module
DELETE /modules/:id         - Delete module
GET    /modules/:id/lessons - Get module lessons
```

#### Lessons
```
GET    /lessons/:id         - Get lesson
POST   /lessons             - Create lesson
PUT    /lessons/:id         - Update lesson
DELETE /lessons/:id         - Delete lesson
POST   /lessons/:id/progress - Update lesson progress
```

#### Enrollments
```
GET    /enrollments         - List enrollments
GET    /enrollments/:id     - Get enrollment
POST   /enrollments         - Enroll in course
DELETE /enrollments/:id     - Unenroll from course
GET    /enrollments/my-courses - Get user's enrolled courses
```

#### Quizzes
```
GET    /quizzes             - List quizzes
GET    /quizzes/:id         - Get quiz
POST   /quizzes             - Create quiz
PUT    /quizzes/:id         - Update quiz
DELETE /quizzes/:id         - Delete quiz
POST   /quizzes/:id/submit  - Submit quiz answers
GET    /quizzes/:id/submissions - Get quiz submissions
```

### API Response Format

#### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

#### Paginated Response
```json
{
  "success": true,
  "data": {
    "data": [...],
    "page": 1,
    "pageSize": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

#### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE",
  "fieldErrors": {
    "email": ["Invalid email format"],
    "password": ["Password too short"]
  }
}
```

### CORS Configuration (Backend)

```csharp
// Program.cs or Startup.cs
services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", builder =>
    {
        builder.WithOrigins("http://localhost:5173") // Vite dev server
               .AllowCredentials()                    // Allow cookies
               .AllowAnyMethod()
               .AllowAnyHeader()
               .WithExposedHeaders("Authorization");  // Expose headers if needed
    });
});

// Cookie configuration
services.ConfigureApplicationCookie(options =>
{
    options.Cookie.SameSite = SameSiteMode.Lax; // Or Strict
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    options.Cookie.HttpOnly = true;
});
```

## State Management Strategy

### Zustand (Auth State Only)
```typescript
// src/features/auth/store.ts
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => set({ user: null, isAuthenticated: false }),
  hasRole: (role) => user?.roles?.includes(role) ?? false,
}));
```

### TanStack Query (Server State)
```typescript
// src/features/courses/api.ts
export const useCourses = (filter: CourseFilter) => {
  return useQuery({
    queryKey: ['courses', filter],
    queryFn: () => api.get('/courses', { params: filter }),
  });
};

export const useCreateCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CourseForm) => api.post('/courses', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};
```

## Form Handling

### React Hook Form + Zod

```typescript
// Define schema
const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password too short'),
});

type LoginFormData = z.infer<typeof loginSchema>;

// Use in component
const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
  resolver: zodResolver(loginSchema),
});

const onSubmit = async (data: LoginFormData) => {
  await login.mutateAsync(data);
};
```

## UI Components

### Base Components
All in `src/components/ui/`:
- `Button` - Multiple variants and sizes
- `Input` - With label, error, helper text
- `Card` - Container with header, content, footer
- More to be added per Figma designs

### Design System (Tailwind Config)

```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      primary: { 50-950 }, // Blue
      secondary: { 50-950 }, // Gray
      success: { 50-700 },
      warning: { 50-700 },
      danger: { 50-700 },
    },
  },
}
```

## Development Workflow

### Running the Project

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Check types
npm run build  # TypeScript will check during build

# Lint code
npm run lint

# Format code
npm run format
```

### Environment Variables

Create `.env` in project root:

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Ailern
VITE_ENABLE_DEVTOOLS=true
```

## Next Steps for Team

### For Backend Team
1. Implement all endpoints listed in "Backend Integration" section
2. Configure CORS to allow `http://localhost:5173`
3. Set up HttpOnly cookies for refresh tokens
4. Implement JWT token generation and refresh logic
5. Add CSRF token generation on login/refresh
6. Test with Postman and share collection

### For Frontend Team  
1. Connect to actual backend APIs (replace mock data)
2. Implement course/lesson API integrations in `features/` folders
3. Add quiz builder and quiz-taking flows
4. Implement enrollment actions with optimistic updates
5. Add progress tracking UI
6. Create video player component
7. Add file upload for course thumbnails/videos
8. Implement admin user management
9. Add error boundaries and toast notifications
10. Write tests for critical flows
11. Optimize performance (code splitting, lazy loading)
12. Accessibility audit and improvements

## Testing Strategy

### Unit Tests
```typescript
// Example: src/components/ui/Button.test.tsx
describe('Button', () => {
  it('renders with primary variant', () => {
    render(<Button variant="primary">Click me</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-primary-600');
  });
});
```

### Integration Tests
```typescript
// Example: src/features/auth/Login.test.tsx
describe('Login Flow', () => {
  it('logs in user successfully', async () => {
    render(<LoginPage />);
    await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(window.location.pathname).toBe('/dashboard');
    });
  });
});
```

## Performance Optimization

### Code Splitting
```typescript
// Lazy load routes
const AdminDashboard = lazy(() => import('./routes/admin/AdminDashboardPage'));

<Route
  path="/admin"
  element={
    <Suspense fallback={<LoadingSpinner />}>
      <AdminDashboard />
    </Suspense>
  }
/>
```

### Memoization
```typescript
// Expensive calculations
const filteredCourses = useMemo(() => {
  return courses.filter(c => c.title.includes(searchQuery));
}, [courses, searchQuery]);

// Callbacks
const handleClick = useCallback(() => {
  // ...
}, [dependencies]);
```

## Deployment

### Build
```bash
npm run build
# Output: dist/ folder
```

### Environment Variables (Production)
```env
VITE_API_URL=https://api.yourdomain.com/api
VITE_APP_NAME=Ailern
VITE_ENABLE_DEVTOOLS=false
```

### Hosting Options
- Vercel
- Netlify
- Azure Static Web Apps
- AWS S3 + CloudFront

## Common Issues & Solutions

### CORS Errors
- Ensure backend CORS is configured correctly
- Check `withCredentials: true` in Axios

### 401 Errors
- Verify token refresh logic
- Check cookie settings (HttpOnly, Secure, SameSite)

### Build Errors
- Run `npm run build` to catch TypeScript errors
- Fix linting issues: `npm run lint:fix`

### Styling Issues
- Ensure Tailwind is configured correctly
- Check PostCSS config
- Verify Tailwind content paths

## Support

For questions or issues:
1. Check this documentation
2. Review the plan file: `.cursor/plans/*.plan.md`
3. Consult with backend team for API issues
4. Review React/Tailwind/TanStack Query docs

---

**Last Updated**: October 2025
**Version**: 1.0.0

