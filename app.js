require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const nano = require("nano");

const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

const couchdbUrl = 'http://admin:steeldesk6@localhost:5984'; // Use your CouchDB URL and credentials
const dbName = "cars_db"; // Main database name
const couch = nano(couchdbUrl);
const db = couch.db.use(dbName);

// Create the main database if it doesn't exist
couch.db.create(dbName).catch(err => {
  if (err.statusCode !== 412) console.error("Database creation error:", err);
});

// Route to index
app.get("/", async (req, res) => {
  const cars = await db.list({ include_docs: true });
  res.render("index", { cars: cars.rows.map(row => row.doc) });
});

// Route to add a car
app.post("/add-car", async (req, res) => {
  const carInfo = req.body.carInfo.split(" ");
  const carID = carInfo[0];
  const carModel = carInfo.slice(1).join(" ");
  await db.insert({ carID, carModel });
  res.redirect("/");
});

// Route to delete a car
app.post("/delete/:id", async (req, res) => {
  const car = await db.get(req.params.id);
  await db.destroy(req.params.id, car._rev);
  res.redirect("/");
});

// Route to view car details
app.get("/car/:id", async (req, res) => {
  const car = await db.get(req.params.id);

  // Create a parts database name based on the carID
  const partsDbName = `${car.carID.toLowerCase()}_parts`;

  try {
    // Check if the parts database exists
    await couch.db.use(partsDbName).info(); // Using `.info()` to check for existence
  } catch (error) {
    // If the database doesn't exist, create it
    if (error.statusCode === 404) {
      try {
        await couch.db.create(partsDbName);
        console.log(`Created parts database: ${partsDbName}`);
      } catch (creationError) {
        console.error("Error creating parts database:", creationError);
      }
    } else {
      console.error("Error checking parts database:", error);
    }
  }

  res.render("car-details", { car });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
