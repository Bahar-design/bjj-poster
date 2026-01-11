// Test setup - runs before any test files are loaded
// Sets environment variables required by handlers

process.env.STRIPE_SECRET_KEY = 'sk_test_123';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_123';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
