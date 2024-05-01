const request = require('supertest');
const app = require('../index'); // Adjust the path as per your project structure
const {Task} = require('../collections.js'); // Adjust the path as per your project structure

describe('POST /tasks', () => {
  beforeEach(async () => {
    // Clear any existing tasks in the database before each test
    await Task.deleteMany();
  });

  test('should return 200 and message if task is posted successfully', async () => {
    const taskData = {
      title: 'Test Task',
      description: 'This is a test task',
      status: 'pending',
      assignee_id: '5a9427648b0beebeb6957ba7', // Assuming a valid assignee ID
      created_at: new Date().toISOString() // Current date as created_at
    };

    const res = await request(app)
      .post('/tasks')
      .send(taskData);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: true, message: 'Task Posted Successfully' });

    // Verify if the task is saved in the database
    const task = await Task.findOne({ title: 'Test Task' });
    expect(task).toBeTruthy();
  });

  test('should return 400 if request body is missing required fields', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: 'Required Fields' });
  });

  // Add more test cases for different scenarios (e.g., invalid data, unauthorized access, etc.)
});
