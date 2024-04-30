const express = require('express');
const mongoose = require('mongoose');
const morgan = require("morgan");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const {Task, User} = require("./collections.js");
require('dotenv').config();

const app=express();
app.use(morgan("dev"))
app.use(cors())
app.use(express.json())

const port = 3000


mongoose
  .connect(
    process.env.MONGODB_URI)
  .then(() => {
    app.listen(port, () => {
      console.log(`MongoDB connected`)
      console.log(`Server is running on port ${port}`)
    })
  })
  .catch((err) => console.log(err));

//user registration and login

app.post("/register", async (request, response) => {
    const { username, password } = request.body;
    if (password.length <= 4) {
      response.status(400);
      response.send({message:"password must contain more than 4 characters"});
      process.exit(1);
    }
    const encryptedPassword = await bcrypt.hash(password, 10);
    const query1 = await User.findOne({username});
    console.log(query1);
    if (query1) {
      response.send({ message: "User already registered", status: 200 });
      response.status(200);
    } else {
      const query2 = new User({username,password_hash:encryptedPassword});
      await query2.save();
      response.status(200).send({ message: "user added successfully", status: 200 });
    }
  });
  //to get login
  app.post("/login", async (request, response) => {
    const { username, password } = request.body;
    const query1 = await User.findOne({username});
    console.log(query1);
    if (query1 === null) {
      response.status(400);
      response.send({ message: "Please register and Login" });
    }
    decryptPassword = await bcrypt.compare(password, query1.password_hash);
    if (decryptPassword) {
      const payload = { username: username };
      console.log(payload);
      const jwtToken = await jwt.sign(payload, "secret_token");
      console.log(jwtToken);
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid Password");
    }
  });
  //middleware function to authenticate the user
  const middleware = async (request, response, next) => {
    let jwtToken;
    const authToken = request.headers["authorization"];
    if (authToken !== undefined) {
      jwtToken = authToken.split(" ")[1];
    }
    if (jwtToken === undefined) {
      response.send({ error: "Unauthorized user" });
      response.status(400);
    } else {
      const valid = jwt.verify(
        jwtToken,
        "secret_token",
        async (error, payload) => {
          if (error) {
            response.status(400);
            response.send({ error: "Authentication failed" });
          } else {
            request.username = payload.username;
            console.log(payload);
            next();
          }
        }
      );
    }
  };

//task management
app.post("/tasks",middleware,async (request,response)=>{
    try{
    if(request.username !== "nagasritha"){
        response.status(400).send({"message":"Only admin can add new tasks"});
    }
    const { title, description, status, assignee_id, created_at } = request.body;
    let createdAt = new Date(created_at);
    const newTask = new Task({ title, description, status, assignee_id, created_at:createdAt });
    await newTask.save();
    response.status(200).send({"status":true,"message":"Task Posted Successfully"});
}catch(error){
    console.log(error);
    response.status(400).send({"status":false,"message":error});
}

})

app.get("/tasks",async(request,response)=>{
    try{
        const tasks = await Task.find();
        response.status(200).send({"status":true,"tasks":tasks});
    }catch(error){
        response.status(400).send({"status":false,"message":error});
    }
})

app.get("/tasks/:id", async (request, response) => {
    try {
        const { id } = request.params;
        const task = await Task.findOne({ _id: id });

        if (!task) {
            // If no task found with the given id, respond with a 404 status code
            return response.status(404).json({ status: false, message: 'Task not found' });
        }

        // Respond with the found task
        response.status(200).json({ status: true, task });
    } catch (error) {
        // If an error occurs, respond with a 400 status code and error message
        response.status(400).json({ status: false, message: error.message });
    }
});
app.put("/tasks/:id", middleware, async (request, response) => {
    try {
        if(request.username !== "nagasritha"){
            response.status(400).send({"message":"Only admin can edit tasks"});
        }
        const { id } = request.params;
        const { title, description, status, assignee_id, created_at } = request.body;
        let createdAt = new Date(created_at);
        const task = await Task.findOneAndUpdate({ _id: id },{title, description, status, assignee_id, created_at:createdAt});

        if (!task) {
            // If no task found with the given id, respond with a 404 status code
            return response.status(404).json({ status: false, message: 'Task not updated' });
        }

        // Respond with the found task
        response.status(200).json({ status: true, message : "Task updated successfully" });
    } catch (error) {
        // If an error occurs, respond with a 400 status code and error message
        response.status(400).json({ status: false, message: error.message });
    }
});

app.delete("/tasks/:id", middleware, async (request, response) => {
    try {
        if(request.username !== "nagasritha"){
            response.status(400).send({"message":"Only admin can delete tasks"});
        }
        const { id } = request.params;
        const task = await Task.findOneAndDelete({ _id: id });

        if (!task) {
            // If no task found with the given id, respond with a 404 status code
            return response.status(404).json({ status: false, message: 'Task not found' });
        }

        // Respond with the found task
        response.status(200).json({ status: true, "message":"Task Deleted" });
    } catch (error) {
        // If an error occurs, respond with a 400 status code and error message
        response.status(400).json({ status: false, message: error.message });
    }
});
