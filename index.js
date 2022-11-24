const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const jwt = require("jsonwebtoken");
const app = express();
require("dotenv").config();

// Middleware
app.use(express());
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 8000;

// json web token related function
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res
      .status(401)
      .send({ status: 401, message: "unauthorization access" });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(401).send({ status: 401, message: "Access Forbidden" });
    }
    req.decoded = decoded;
    next();
  });
}

app.get("/jwt", (req, res) => {
  const email = req.query.email;

  const token = jwt.sign(
    {
      email,
    },
    process.env.ACCESS_TOKEN,
    { expiresIn: 60 * 60 }
  );

  res.send(token);
});

// End json webtoken related function

// MongoDB Connection Related code
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@hero-one.z3ku6ig.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// Ened MongoDB

app.get("/", (req, res) => {
  res.send("Hello World");
});

try {
  const appointmentOptionCollection = client
    .db("doctors")
    .collection("appointmentOptions");

  const bookingCollection = client.db("shBiker").collection("bookings");
  const usersCollection = client.db("shBiker").collection("users");
  //const doctorsCollection = client.db("shBiker").collection("doctors");
  const paymentsCollection = client.db("shBiker").collection("payments");

  const verifyAdmin = async (req, res, next) => {
    const decodedEmail = req.decoded.email;
    const query = { email: decodedEmail };
    const user = await usersCollection.findOne(query);
    if (user?.role !== "admin") {
      return res.status(403).send({ message: "forbidden access" });
    }
    next();
  };
} finally {
}

app.listen(port, (req, res) => {
  console.log(`Server running on ${port}`);
});
