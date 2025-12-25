# Getting Started with Ailern LMS Frontend

This guide will help you get the Ailern LMS frontend up and running quickly.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- A code editor (VS Code recommended)
- Basic knowledge of React and TypeScript

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- React, TypeScript, Vite
- Tailwind CSS
- TanStack Query, Zustand
- React Router, React Hook Form, Zod
- And more...

### 2. Configure Environment

The project comes with an `.env` file pre-configured for local development:

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Ailern
VITE_ENABLE_DEVTOOLS=true
```

**Update `VITE_API_URL`** to point to your .NET backend API.

### 3. Start Development Server

```bash
npm run dev
```

The application will open at `http://localhost:5173`

## Project Overview

### User Roles

The application supports three user roles:

1. **Student**
   - Browse and enroll in courses
   - Watch lessons
   - Take quizzes
   - Track progress

2. **Instructor**
   - Create and manage courses
   - Add modules and lessons
   - Create quizzes
   - Grade assignments

3. **Admin**
   - Manage users and roles
   - Approve courses
   - View analytics
   - Configure system

### Key Features

- ✅ **Authentication** - Login, register, password reset
- ✅ **Role-Based Access** - Different dashboards per role
- ✅ **Course Management** - CRUD operations for courses
- ✅ **Responsive Design** - Works on mobile, tablet, desktop
- ✅ **Form Validation** - Client-side validation with Zod
- ✅ **API Integration** - Ready to connect to .NET backend

## Available Routes

### Public Routes
- `/` - Home page
- `/login` - User login
- `/register` - User registration
- `/forgot-password` - Password reset request

### Student Routes (Authenticated)
- `/dashboard` - Student dashboard
- `/courses` - Browse all courses
- `/courses/:id` - Course details
- `/learn/:courseId/:lessonId` - Lesson player
- `/profile` - User profile

### Instructor Routes (Instructor or Admin role)
- `/instructor` - Instructor dashboard
- `/instructor/courses` - Manage courses
- `/instructor/courses/new` - Create course
- `/instructor/courses/:id/edit` - Edit course
- `/instructor/gradebook` - Grade submissions

### Admin Routes (Admin role only)
- `/admin` - Admin dashboard
- `/admin/users` - User management
- `/admin/courses` - Course management
- `/admin/reports` - Analytics and reports

## Connecting to Backend

### Required Backend Endpoints

Your .NET backend must implement these endpoints:

```
Authentication:
- POST /auth/login
- POST /auth/register
- POST /auth/refresh
- POST /auth/logout
- GET /auth/me

Courses:
- GET /courses
- GET /courses/:id
- POST /courses
- PUT /courses/:id
- DELETE /courses/:id

... and more (see PROJECT_STRUCTURE.md)
```

### CORS Configuration

Your .NET backend must allow requests from `http://localhost:5173`:

```csharp
services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", builder =>
    {
        builder.WithOrigins("http://localhost:5173")
               .AllowCredentials()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});
```

### Authentication Flow

1. User logs in via `/login` page
2. Backend returns:
   - `accessToken` (in response body)
   - `refreshToken` (as HttpOnly cookie)
   - `csrfToken` (in response body)
   - `user` object with roles
3. Frontend stores:
   - `accessToken` in memory (Zustand)
   - `user` in localStorage and Zustand
   - `csrfToken` in localStorage
4. All subsequent requests include `Authorization: Bearer <accessToken>` header
5. If token expires (401), frontend automatically refreshes it

## Development Workflow

### Making Changes

1. **Add a new page:**
   - Create component in `src/routes/`
   - Add route in `src/app/router.tsx`

2. **Add API integration:**
   - Define types in `src/types/index.ts`
   - Create API hooks in `src/features/[feature]/api.ts`
   - Use hooks in components

3. **Add UI component:**
   - Create component in `src/components/ui/`
   - Export from `src/components/ui/index.ts`
   - Use Tailwind for styling

### Code Quality

```bash
# Lint code
npm run lint

# Fix lint errors
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

### Building for Production

```bash
npm run build
```

Output will be in `dist/` folder, ready to deploy.

## Testing the App

### Without Backend

The app includes MSW (Mock Service Worker) handlers for testing without a backend. Mock data will be returned for API calls.

### With Backend

1. Start your .NET backend
2. Update `VITE_API_URL` in `.env`
3. Test authentication flow
4. Verify API responses match expected format

## Common Issues

### Port Already in Use

If port 5173 is already in use:

```bash
# Kill the process using the port, or
# Change port in vite.config.ts
```

### CORS Errors

- Ensure backend CORS is configured
- Check backend is running
- Verify `VITE_API_URL` is correct

### Build Errors

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run build
```

### Styling Not Working

```bash
# Ensure Tailwind is processing
# Check postcss.config.js exists
# Verify tailwind.config.js content paths
```

## Next Steps

1. **Review the code structure** - See `PROJECT_STRUCTURE.md`
2. **Connect to your backend** - Update API URL and test endpoints
3. **Customize the UI** - Match your Figma designs
4. **Add features** - Implement remaining todos
5. **Write tests** - Add test coverage for critical flows
6. **Deploy** - Build and deploy to production

## Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Code Quality
npm run lint             # Check for errors
npm run lint:fix         # Fix errors automatically
npm run format           # Format all files
npm run format:check     # Check formatting

# Testing
npm test                 # Run tests
npm run test:ui          # Run tests with UI
npm run test:coverage    # Generate coverage report
```

## Resources

- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TanStack Query Documentation](https://tanstack.com/query)
- [React Router Documentation](https://reactrouter.com)
- [React Hook Form Documentation](https://react-hook-form.com)
- [Zod Documentation](https://zod.dev)

## Support

If you encounter issues:

1. Check this guide
2. Review `PROJECT_STRUCTURE.md`
3. Check the browser console for errors
4. Review network tab for API errors
5. Consult with your backend team

---

Happy coding! 🚀

