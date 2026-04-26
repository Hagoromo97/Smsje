# User Authentication System

## Overview
The SMS Gateway now has a complete user authentication system with signup and login functionality.

## Features
- ✅ User registration with email, password, and name
- ✅ Secure password hashing using bcryptjs
- ✅ Session-based authentication with PostgreSQL storage
- ✅ User login with credential validation
- ✅ User profile display in sidebar
- ✅ Auto-logout after 30 minutes of inactivity
- ✅ Protected routes - redirects to login if not authenticated

## Database Schema

### Users Table
```typescript
{
  id: uuid (primary key, default: gen_random_uuid())
  email: varchar(255) (unique, required)
  password: text (required, bcrypt hashed)
  name: varchar(255) (required)
  createdAt: timestamp (default: now())
}
```

## API Endpoints

### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe"
}
```

**Validation:**
- Email: Valid email format
- Password: Minimum 6 characters
- Name: Minimum 2 characters

**Response (Success):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe"
}
```

**Response (Error):**
```json
{
  "message": "Email already exists"
}
```

### POST /api/auth/login
Log in with existing credentials.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (Success):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe"
}
```

**Response (Error):**
```json
{
  "message": "Invalid email or password"
}
```

### GET /api/auth/status
Check authentication status and get user info.

**Response (Authenticated):**
```json
{
  "authenticated": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Response (Not Authenticated):**
```json
{
  "authenticated": false
}
```

### POST /api/logout
Log out the current user.

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

## Setup Instructions

### 1. Run Database Migration
The users table needs to be updated with the new authentication fields:

```bash
chmod +x migrate-db.sh
./migrate-db.sh
```

Or manually:
```bash
npm run db:push
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Access the Application
Navigate to http://localhost:5000 (or your configured port)

## User Flow

### New Users
1. App redirects to authentication page
2. Click "Sign up" tab
3. Enter email, password (min 6 chars), and full name
4. Click "Sign up" button
5. System creates account with hashed password
6. Automatically logs in and redirects to home page

### Returning Users
1. App redirects to authentication page
2. Enter email and password
3. Click "Log in" button
4. Validates credentials
5. Creates session and redirects to home page

### Authenticated Users
1. User info (name, email) displayed in sidebar footer
2. Can access all features (Compose, History, Contacts, Settings)
3. Auto-logout after 30 minutes of inactivity
4. Can manually log out from dropdown menu

## Security Features

### Password Hashing
- Uses bcryptjs with salt rounds = 10
- Passwords never stored in plain text
- One-way hashing - cannot be reversed

### Session Management
- Sessions stored in PostgreSQL (not memory)
- Persistent across server restarts
- 30-minute inactivity timeout
- Secure session cookies

### Validation
- Email format validation
- Password strength requirements
- Name length validation
- Duplicate email prevention

## Frontend Components

### /client/src/pages/auth.tsx
Main authentication page with:
- Toggle between login and signup modes
- Form validation
- Toast notifications
- Loading states
- Modern card-based design

### /client/src/hooks/useAuth.ts
React hook for authentication state:
- `isLoading`: Boolean - checking auth status
- `isAuthenticated`: Boolean - user is logged in
- `user`: Object - user data (id, email, name)

### /client/src/App.tsx
Routing logic:
- Shows auth page if not authenticated
- Shows home page if authenticated
- Automatically redirects based on status

### /client/src/components/layout/app-sidebar.tsx
Updated to show user info:
- Displays user name and email in footer
- Dropdown menu with Settings and Logout

## Backend Files

### /server/routes.ts
Authentication endpoints implementation:
- Register with email uniqueness check
- Login with bcrypt password comparison
- Status check with user data
- Logout functionality
- Middleware for route protection

### /server/storage.ts
Database operations:
- `getUserById(id)`: Fetch user by UUID
- `getUserByEmail(email)`: Fetch user for login
- `createUser({email, password, name})`: Create new user

### /shared/schema.ts
Database schema and validation:
- Users table definition with Drizzle ORM
- Zod schemas for register and login
- TypeScript types export

## Backward Compatibility

The system maintains backward compatibility with the old password-based authentication:
- Legacy `/api/access` endpoint still works
- Middleware checks both `session.authenticated` and `session.userId`
- Existing sessions continue to work

## Testing

### Test User Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

### Test User Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }' \
  -c cookies.txt
```

### Test Auth Status
```bash
curl http://localhost:5000/api/auth/status \
  -b cookies.txt
```

### Test Logout
```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -b cookies.txt
```

## Deployment Considerations

### Environment Variables
Ensure these are set in production:
```
DATABASE_URL=postgresql://...
SESSION_SECRET=your-secret-key-here
NODE_ENV=production
```

### Vercel Deployment
The authentication system works with Vercel deployment:
1. Database sessions persist in PostgreSQL
2. No file system dependencies
3. Serverless function compatible

### Security Checklist
- ✅ Strong SESSION_SECRET in production
- ✅ HTTPS enabled for secure cookies
- ✅ Environment variables not committed to git
- ✅ Password complexity requirements enforced
- ✅ SQL injection prevention (Drizzle ORM)
- ✅ Session timeout configured

## Troubleshooting

### "Email already exists" error
- User already registered with that email
- Try logging in instead of signing up
- Or use a different email address

### "Invalid email or password" error
- Check email spelling
- Check password (case-sensitive)
- Ensure account was created successfully

### Session not persisting
- Check DATABASE_URL is set correctly
- Verify PostgreSQL is accessible
- Check session table exists in database

### User not showing in sidebar
- Check /api/auth/status returns user data
- Verify useAuth hook is imported in component
- Check browser console for errors

## Future Enhancements

Potential additions:
- Password reset via email
- Email verification
- Two-factor authentication
- Social login (Google, GitHub)
- User profile page
- Password change functionality
- Remember me checkbox
- Account deletion

## Support

For issues or questions:
1. Check browser console for errors
2. Review server logs
3. Verify database schema is up to date
4. Ensure all dependencies are installed
5. Check environment variables are set correctly
