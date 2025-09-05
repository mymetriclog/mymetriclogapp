# Authentication Pages

This directory contains all authentication-related pages for the MyMetricLog application.

## Pages

### 1. Login (`/login`)

- Email/password authentication
- Google OAuth integration
- Email verification handling
- Password reset link

### 2. Signup (`/signup`)

- User registration with email/password
- Google OAuth registration
- Email verification flow
- User metadata collection

### 3. Email Verification (`/verify`)

- Email confirmation page
- Resend verification email
- Redirect to dashboard after verification

### 4. Forgot Password (`/forgot-password`)

- Password reset request form
- Email validation
- Success confirmation
- Link to login page

### 5. Reset Password (`/reset-password`)

- New password creation form
- Password strength validation
- Session validation
- Automatic redirect after success

## Features

- **Consistent Design**: All pages follow the same design system with gradient backgrounds and card layouts
- **Responsive**: Mobile-first design that works on all screen sizes
- **Loading States**: Proper loading indicators and user feedback
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Security**: Password strength validation and secure session management
- **Accessibility**: Proper form labels and keyboard navigation

## Security Considerations

- Password reset links expire after 1 hour
- Strong password requirements enforced
- Session validation on password reset
- Automatic sign-out after password change
- CSRF protection through Supabase

## Usage

The authentication flow works as follows:

1. **Registration**: User signs up → Email verification → Dashboard access
2. **Login**: User logs in → Dashboard access (or email verification if needed)
3. **Password Reset**: User requests reset → Email sent → Reset page → New password → Login

All pages are protected by middleware and redirect appropriately based on authentication state.
