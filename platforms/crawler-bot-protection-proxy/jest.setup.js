const dotenv = require('dotenv');

// Load environment variables for testing
dotenv.config({ path: '.env.test' });

// Global test timeout
jest.setTimeout(30000); 