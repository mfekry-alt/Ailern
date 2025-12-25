# Ailern API Endpoints

This document lists all API endpoints expected by the Ailern frontend.

## Authentication Endpoints

### POST /auth/login

Login with email and password.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "1",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "roles": ["Student"]
    },
    "accessToken": "jwt_token",
    "csrfToken": "csrf_token"
  }
}
```

### GET /auth/me

Get current authenticated user.

### POST /auth/logout

Logout current user.

### POST /auth/register

Register new user account.

### POST /auth/forgot-password

Request password reset link.

### POST /auth/verify-email

Verify email address with token.

## Course Endpoints

### GET /courses

List all courses (paginated).

### GET /courses/:id

Get course details by ID.

### POST /courses

Create a new course (Instructor/Admin only).

### PUT /courses/:id

Update course (Instructor/Admin only).

### DELETE /courses/:id

Delete course (Admin only).

## Enrollment Endpoints

### GET /enrollments

Get user's enrollments.

### POST /enrollments

Enroll in a course.

### GET /enrollments/:id

Get enrollment details.

## User Roles

- **Admin**: Full system access
- **Instructor**: Create/manage courses, view analytics, grade assignments
- **Student**: Enroll in courses, view lessons, submit assignments

For complete API documentation, see PROJECT_STRUCTURE.md
