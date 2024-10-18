require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const nano = require("nano");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

// Serve static files (CSS)
app.use(express.static(path.join(__dirname, 'public')));

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

// Route to view car details and parts
app.get("/car/:id", async (req, res) => {
  const car = await db.get(req.params.id);
  const partsDbName = `${car.carID.toLowerCase()}_parts`;
  let parts = [];

  try {
    await couch.db.use(partsDbName).info(); // Check if the parts database exists
    const partsDb = couch.db.use(partsDbName);
    const partsList = await partsDb.list({ include_docs: true });
    parts = partsList.rows.map(row => row.doc);
  } catch (error) {
    if (error.statusCode === 404) {
      await couch.db.create(partsDbName);
      console.log(`Created parts database: ${partsDbName}`);
    } else {
      console.error("Error checking parts database:", error);
    }
  }

  res.render("car-details", { car, parts });
});

// Route to add a part
app.post("/add-part/:carId", async (req, res) => {
  const carId = req.params.carId;
  const partName = req.body.partName;
  const partDescription = req.body.partDescription;
  const partsDbName = `${(await db.get(carId)).carID.toLowerCase()}_parts`;

  const partsDb = couch.db.use(partsDbName);
  await partsDb.insert({ partName, partDescription });
  res.redirect(`/car/${carId}`);
});

// Route to delete a part
app.post("/delete-part/:carId/:partId", async (req, res) => {
  const carId = req.params.carId;
  const partId = req.params.partId;
  const partsDbName = `${(await db.get(carId)).carID.toLowerCase()}_parts`;
  const partsDb = couch.db.use(partsDbName);
  
  const part = await partsDb.get(partId);
  await partsDb.destroy(partId, part._rev);
  res.redirect(`/car/${carId}`);
});

// Route to edit a part
app.post("/edit-part/:carId/:partId", async (req, res) => {
  const carId = req.params.carId;
  const partId = req.params.partId;
  const { partName, partDescription } = req.body;
  const partsDbName = `${(await db.get(carId)).carID.toLowerCase()}_parts`;
  const partsDb = couch.db.use(partsDbName);

  const part = await partsDb.get(partId);
  await partsDb.insert({ _id: partId, _rev: part._rev, partName, partDescription });
  res.redirect(`/car/${carId}`);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
