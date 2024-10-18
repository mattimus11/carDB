require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const nano = require("nano");

const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

const couchdbUrl = process.env.couch_uri; // Use your CouchDB URL and credentials
const dbName = "cars_db"; // Database name
const couch = nano(couchdbUrl); // Make sure to use 'couchdbUrl' here
const db = couch.db.use(dbName);

// Create the database if it doesn't exist
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
  res.render("car-details", { car });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
