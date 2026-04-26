#!/bin/bash
# Run database migration to update users table with authentication fields

echo "Running database migration..."
npm run db:push

echo ""
echo "Migration complete! Your users table now has:"
echo "  - email (required, unique)"
echo "  - password (required, bcrypt hashed)"
echo "  - name (required)"
echo ""
echo "You can now:"
echo "1. Start the dev server: npm run dev"
echo "2. Open the app and sign up with a new account"
echo "3. Test login with your credentials"
