const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const app = express();
require("dotenv").config();

app.use(express());
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 8000;

app.get("/", (req, res) => {
  res.send("Hello World sdf");
});

app.listen(port, (req, res) => {
  console.log(`Server running on ${port}`);
});
