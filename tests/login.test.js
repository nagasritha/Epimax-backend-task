// Import necessary modules and setup
const request = require('supertest'); // For making HTTP requests to your app
const app = require('../index'); // Assuming your Express app is defined in app.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {User} = require('../collections.js'); // Assuming User model is defined in User.js

describe('POST /login', () => {
  beforeEach(async () => {
    // Clear any existing users in the database before each test
    await User.deleteMany();
  });

  test('should return 400 if username or password is missing', async () => {
    const res = await request(app)
      .post('/login')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: 'Username and password are required' });
  });

  test('should return 400 if user is not found', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'nonexistentuser', password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: 'Please register and Login' });
  });

  test('should return 401 if password is incorrect', async () => {
    // Create a user in the database
    await User.create({ username: 'testuser', password_hash: 'correctpassword' });

    const res = await request(app)
      .post('/login')
      .send({ username: 'testuser', password: 'incorrectpassword' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: 'Invalid Password' });
  });

  test('should return 200 and token if login is successful', async () => {
    // Create a user in the database
    const hashedPassword = await bcrypt.hash('correctpassword', 10);
    await User.create({ username: 'testuser', password_hash: hashedPassword });

    // Mock jwt sign method
    jwt.sign = jest.fn().mockResolvedValue('mockedJWTToken');

    const res = await request(app)
      .post('/login')
      .send({ username: 'testuser', password: 'correctpassword' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('jwtToken', 'mockedJWTToken');
  });
});
