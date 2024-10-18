require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const PORT = 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

const uri =
  "mongodb+srv://howelldatabase:Steeldesk1216!@cluster0.gfzhw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  // Connect the client to the server	(optional starting in v4.7)
  await client.connect();
  // Send a ping to confirm a successful connection
  await client.db("admin").command({ ping: 1 });
  console.log("Pinged your deployment. You successfully connected to MongoDB!");
}

run().catch(console.dir);

//Route to index
app.get("/", async (req, res) => {
  const collection = client.db("cars").collection("cars");
  const cars = await collection.find().toArray();
  res.render("index", {
    cars,
  });
});

//Route to post cars to DB
app.post("/add-car", async (req, res) => {
  const collection = client.db("cars").collection("cars");
  const carInfo = req.body.carInfo; // Get the input
  const parts = carInfo.split(" "); // Split by spaces

  const carID = parts[0]; // First part is car make
  const carModel = parts.slice(1).join(" "); // Remaining parts are car model

  try {
    // Insert both fields into the database
    await collection.insertOne({ carID, carModel });
    res.redirect("/"); // Redirect after successful insert
  } catch (error) {
    console.error("Error adding car:", error);
    res.status(500).send("Internal Server Error");
  }
});

//Route to delete
app.post("/delete/:id", async (req, res) => {
  const collection = client.db("cars").collection("cars");
  await collection.findOneAndDelete({
    _id: new ObjectId(req.params.id),
  });
  res.redirect("/");
});

//Links to each car
app.get("/car/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const collection = client.db("cars").collection("cars");
    const car = await collection.findOne({ _id: new ObjectId(id) }); // Find the car by ID
    if (!car) {
      return res.status(404).send("Car not found");
    }
    res.render("car-details", { car }); // Render a new EJS template with car details
  } catch (error) {
    console.error("Error fetching car details:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
