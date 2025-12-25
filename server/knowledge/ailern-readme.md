# Ailern LMS - Learning Management System

A modern Learning Management System built with React, TypeScript, and Tailwind CSS.

## Features

- **Three User Roles**: Admin, Instructor, and Student with role-based access control
- **Course Management**: Create, edit, and manage courses with modules and lessons
- **Interactive Learning**: Video lessons, quizzes, assignments, and progress tracking
- **User Management**: Admin dashboard for managing users and platform settings
- **Responsive Design**: Mobile-first approach with beautiful UI components
- **Secure Authentication**: JWT-based auth with refresh token rotation

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Headless UI
- **State Management**: Zustand, TanStack Query
- **Forms**: React Hook Form, Zod
- **HTTP Client**: Axios with interceptors
- **Icons**: Lucide React
- **Testing**: Vitest, React Testing Library

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- .NET backend API (developed by your team)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ailern
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Ailern
VITE_ENABLE_DEVTOOLS=true
```

4. Start the development server:
```bash
npm run dev
```

The application will open at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm test` - Run tests
- `npm run test:coverage` - Run tests with coverage

## Project Structure

```
src/
├── app/              # App shell, providers, router
│   ├── layouts/      # Layout components
│   ├── providers.tsx # Global providers
│   └── router.tsx    # Route configuration
├── features/         # Feature modules
│   ├── auth/         # Authentication
│   ├── courses/      # Course management
│   ├── lessons/      # Lesson management
│   ├── quizzes/      # Quiz functionality
│   └── ...
├── components/       # Reusable UI components
│   └── ui/           # Base UI components
├── routes/           # Route/page components
│   ├── student/      # Student pages
│   ├── instructor/   # Instructor pages
│   └── admin/        # Admin pages
├── api/              # API client and endpoints
├── lib/              # Utilities and helpers
├── hooks/            # Custom React hooks
├── types/            # TypeScript types
└── mocks/            # MSW mock handlers
```

## Authentication

The app uses JWT-based authentication with refresh token rotation:

- Access tokens are short-lived and stored in memory
- Refresh tokens are HttpOnly cookies
- Automatic token refresh on 401 responses
- CSRF protection via custom headers

## Backend Integration

This frontend expects a .NET backend with the following endpoints:

### Auth Endpoints
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - User logout
- `POST /auth/forgot-password` - Request password reset
- `GET /auth/me` - Get current user

### Other Endpoints
- Users, Courses, Modules, Lessons, Enrollments, Quizzes, etc.

See `src/api/endpoints.ts` for the complete list.

## User Roles

### Student
- Browse and enroll in courses
- Watch video lessons
- Take quizzes and submit assignments
- Track learning progress

### Instructor
- Create and manage courses
- Add modules and lessons
- Create quizzes and assignments
- Grade student submissions

### Admin
- Manage all users and roles
- Review and approve courses
- View platform analytics
- Configure system settings

## Customization

### Tailwind Theme

Customize colors, fonts, and other design tokens in `tailwind.config.js`:

```js
theme: {
  extend: {
    colors: {
      primary: { ... },
      secondary: { ... },
    },
  },
}
```

### Environment Variables

- `VITE_API_URL` - Backend API base URL
- `VITE_APP_NAME` - Application name
- `VITE_ENABLE_DEVTOOLS` - Enable React Query devtools

## Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Submit a pull request

## License

MIT License - feel free to use this project for learning and development.
