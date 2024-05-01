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
      return response.status(400).send({message:"password must contain more than 4 characters"});
    }
    const encryptedPassword = await bcrypt.hash(password, 10);
    const query1 = await User.findOne({username});
    console.log(query1);
    if (query1) {
      return response.status(200).send({ message: "User already registered", status: 200 });
    } else {
      const query2 = new User({username,password_hash:encryptedPassword});
      await query2.save();
      return response.status(200).send({ message: "user added successfully", status: 200 });
    }
  });
  //to get login
  app.post("/login", async (request, response) => {
    const { username, password } = request.body;
    console.log(username,password);
    if(username== undefined || password == undefined){
      return response.status(400).send({message:"Username and password are required"})
    }
    const query1 = await User.findOne({username});
    if (query1 === null) {
      return response.status(400).send({ message: "Please register and Login" });
    }
    decryptPassword = await bcrypt.compare(password, query1.password_hash);
    if (decryptPassword) {
      const payload = { username: username };
      console.log(payload);
      const jwtToken = await jwt.sign(payload, "secret_token");
      console.log(jwtToken);
      return response.status(200).send({ jwtToken });
    } else {
      return response.status(401).send({"message":"Invalid Password"});
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
      return response.status(400).send({ error: "Unauthorized user" });
    } else {
      const valid = jwt.verify(
        jwtToken,
        "secret_token",
        async (error, payload) => {
          if (error) {
            return response.status(400).send({ error: "Authentication failed" });
          } else {
            request.username = payload.username;
            console.log(payload);
            next();
          }
        }
      );
    }
  };

//To get The role of users

const getUserRoles = (username) => {
  if (username === "nagasritha") {
      return ["admin"];
  } else {
      return ["user"]; // Default role for non-admin users
  }
};

const isAdmin = (request, response, next) => {
  const { username } = request;
  const userRoles = getUserRoles(username);
  if (userRoles.includes("admin")) {
      next(); // User is authorized
  } else {
      response.status(403).json({ status: false, message: "Forbidden. Only admin can perform this operation." });
  }
};


//task management
app.post("/tasks",middleware, isAdmin, async (request,response)=>{
    try{
    const { title, description, status, assignee_id, created_at } = request.body;
    if(title == undefined || description == undefined || status == undefined || assignee_id == undefined || created_at == undefined ){
      return response.status(400).send({message:"Required Fields"});
    }
    let createdAt = new Date(created_at);
    const newTask = new Task({ title, description, status, assignee_id, created_at:createdAt });
    await newTask.save();
    return response.status(200).send({"status":true,"message":"Task Posted Successfully"});
}catch(error){
    console.log(error);
    return response.status(400).send({"status":false,"message":error});
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
app.put("/tasks/:id",middleware,isAdmin, async (request, response) => {
  try {
      const { id } = request.params;
      console.log("Task ID:", id);
      
      // Retrieve the task by ID
      let query1 = await Task.findOne({_id: id});
      console.log("Query Result:", query1);
      
      // Check if the task exists
      if (!query1) {
          return response.status(404).send({ status: false, message: 'Task not found' });
      }
      
      // Extract task properties from request body
      const { title, description, status, assignee_id, created_at } = request.body;
      let createdAt = new Date(created_at);
      
      // Update the task
      const task = await Task.findOneAndUpdate({ _id: id }, { title, description, status, assignee_id, created_at: createdAt });

      // Check if the task was updated
      if (!task) {
          return response.status(404).send({ status: false, message: 'Task not updated' });
      }

      // Respond with success message
      return response.status(200).send({ status: true, message: "Task updated successfully" });
  } catch (error) {
      // If an error occurs, respond with a 400 status code and error message
      return response.status(400).send({ status: false, message: error.message });
  }
});


app.delete("/tasks/:id", middleware, isAdmin, async (request, response) => {
    try {
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

module.exports = app;