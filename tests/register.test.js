// Import necessary modules and setup
const request = require('supertest'); // For making HTTP requests to your app
const app = require('../index'); // Assuming your Express app is defined in app.js
const {User} = require('../collections.js'); // Assuming User model is defined in User.js

// Mock the bcrypt module
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('$2a$10$mockedPasswordHash'),
}));

describe('POST /register', () => {
  beforeEach(async () => {
    // Clear any existing users in the database before each test
    await User.deleteMany();
  });

  test('should return 400 if password is too short', async () => {
    const res = await request(app)
      .post('/register')
      .send({ username: 'testuser', password: '1234' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: 'password must contain more than 4 characters' });
  });

  test('should return 200 and message if user is already registered', async () => {
    // Create a user in the database
    await User.create({ username: 'testuser', password_hash: 'hashedPassword' });

    const res = await request(app)
      .post('/register')
      .send({ username: 'testuser', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'User already registered', status: 200 });
  });

  test('should return 200 and message if user is successfully registered', async () => {
    const res = await request(app)
      .post('/register')
      .send({ username: 'testuser', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'user added successfully', status: 200 });

    // Check if user is saved in the database
    const user = await User.findOne({ username: 'testuser' });
    expect(user).toBeTruthy();
  });
});
