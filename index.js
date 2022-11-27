const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
  const productsCollection = client.db("shBiker").collection("products");
  const paymentsCollection = client.db("shBiker").collection("payments");
  const categoriesCollection = client.db("shBiker").collection("categories");

  //verify admin middleware
  const verifyAdmin = async (req, res, next) => {
    const decodedEmail = req.decoded.email;
    const query = { email: decodedEmail };
    const user = await usersCollection.findOne(query);
    if (user?.role !== "admin") {
      return res.status(403).send({ message: "forbidden access" });
    }
    next();
  };

  app.get("/jwt", async (req, res) => {
    const email = req.query.email;
    const query = { email: email };
    const user = await usersCollection.findOne(query);
    if (user) {
      var token = jwt.sign({ email }, process.env.ACCESS_TOKEN);
      console.log("token", token);
      return res.send({ accessToken: token });
    }

    res.status(403).send({ accessToken: "" });
  });

  app.post("/user", async (req, res) => {
    const user = req.body;
    const query = { email: user.email };
    const userResult = await usersCollection.findOne(query);
    if (!userResult) {
      const result = await usersCollection.insertOne(user);
      res.send(result);
    } else {
      res.send({ status: 300, message: "already have an account" });
    }
  });

  // Get user using specific email

  app.get("/user", async (req, res) => {
    const email = req.query.email;
    const query = { email: email };
    const selerResult = await usersCollection.findOne(query);
    res.send(selerResult);
  });

  app.get("/user/role/:email", async (req, res) => {
    const email = req.params.email;
    const query = { email: email };
    const user = await usersCollection.findOne(query);
    res.send({ role: user?.role });
  });

  // get all category
  app.get("/categories", async (req, res) => {
    const query = {};
    const result = await categoriesCollection.find(query).toArray();
    res.send(result);
  });

  // Add Products
  app.post("/addProduct", verifyToken, async (req, res) => {
    const product = req.body;
    product.dateAdded = new Date();
    console.log(product);

    const decodedEmail = req.decoded.email;
    const query = { email: decodedEmail, role: "seller" };
    const userResult = await usersCollection.findOne(query);
    console.log("product", userResult);
    if (userResult) {
      const result = await productsCollection.insertOne(product);
      res.send(result);
    } else {
      return res.status(403).send({ message: "forbidden access" });
    }
  });

  app.get("/myproducts", verifyToken, async (req, res) => {
    const decodedEmail = req.decoded.email;
    const query = { email: decodedEmail, role: "seller" };
    const userResult = await usersCollection.findOne(query);
    //console.log("product", userResult);
    if (userResult) {
      const result = await productsCollection
        .find({ email: decodedEmail })
        .toArray();
      res.send(result);
    } else {
      return res.status(403).send({ message: "forbidden access" });
    }
  });

  //Delete Product
  app.delete("/myproducts", verifyToken, async (req, res) => {
    const decodedEmail = req.decoded.email;
    const product_id = req.query.id;
    const query = { email: decodedEmail, role: "seller" };
    const userResult = await usersCollection.findOne(query);
    //console.log("product", userResult);
    if (userResult) {
      const result = await productsCollection.deleteOne({
        _id: ObjectId(product_id),
      });
      res.send(result);
    } else {
      return res.status(403).send({ message: "forbidden access" });
    }
  });

  //Patch Product
  app.patch("/myproducts", verifyToken, async (req, res) => {
    const decodedEmail = req.decoded.email;
    const product_id = req.query.id;
    const query = { email: decodedEmail, role: "seller" };
    const userResult = await usersCollection.findOne(query);
    if (userResult) {
      const filter = { _id: ObjectId(product_id) };
      const updatedDoc = {
        $set: {
          advertise: true,
        },
      };

      const result = await productsCollection.updateOne(filter, updatedDoc);
      res.send(result);
    } else {
      return res.status(403).send({ message: "forbidden access" });
    }
  });

  //Get all seller
  app.get("/allsellers", verifyToken, async (req, res) => {
    const query = { role: "seller" };
    const allSeller = await usersCollection.find(query).toArray();
    res.send(allSeller);
  });

  // Verify seller
  app.patch("/user", verifyToken, async (req, res) => {
    const user_id = req.query.id;
    const filter = { _id: ObjectId(user_id) };
    const updatedDoc = {
      $set: {
        verified: true,
      },
    };

    const result = await usersCollection.updateOne(filter, updatedDoc);
    res.send(result);
  });

  //Get all buyer
  app.get("/allbuyers", verifyToken, async (req, res) => {
    const query = { role: "buyer" };
    const allBuyer = await usersCollection.find(query).toArray();
    res.send(allBuyer);
  });

  // Delete any user
  app.delete("/user", verifyToken, async (req, res) => {
    const user_id = req.query.id;
    const result = await usersCollection.deleteOne({
      _id: ObjectId(user_id),
    });
    res.send(result);
  });

  //Get all categories
  app.get("/allcategories", async (req, res) => {
    const query = {};
    const allcategories = await categoriesCollection.find(query).toArray();
    res.send(allcategories);
  });

  //Get specific category product
  app.get("/allcategories/:category", async (req, res) => {
    const category = req.params.category;
    const query = { category: category };
    const categoryPorduct = await productsCollection.find(query).toArray();
    //console.log(categoryPorduct);
    res.send(categoryPorduct);
  });

  //get all advertise items
  app.get("/advertise", async (req, res) => {
    const query = { advertise: true, saleStatus: "available" };
    const products = await productsCollection.find(query).toArray();
    //console.log(categoryPorduct);
    res.send(products);
  });
} finally {
}

app.listen(port, (req, res) => {
  console.log(`Server running on ${port}`);
});
