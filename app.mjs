const express = require('express');
const bodyParser = require('body-parser');
const { nanoid } = require('nanoid');
const Nano = require('nano');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// CouchDB setup
const couchdb = Nano(process.env.COUCHDB_URL);
const db = couchdb.db.use(process.env.COUCHDB_DB);

// Middleware
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Routes

// List cars
app.get('/', async (req, res) => {
    const cars = await db.list({ include_docs: true });
    res.render('cars', { cars: cars.rows });
});

// Add a new car
app.post('/add-car', async (req, res) => {
    const newCar = {
        _id: nanoid(),
        name: req.body.name,
        parts: []
    };
    await db.insert(newCar);
    res.redirect('/');
});

// Car details with parts
app.get('/car/:id', async (req, res) => {
    const car = await db.get(req.params.id);
    res.render('carDetails', { car });
});

// Add a new part
app.post('/car/:id/add-part', async (req, res) => {
    const car = await db.get(req.params.id);
    car.parts.push(req.body.part);
    await db.insert(car);
    res.redirect(`/car/${req.params.id}`);
});

// Update a part (for simplicity, just renames it)
app.post('/car/:carId/update-part', async (req, res) => {
    const car = await db.get(req.params.carId);
    car.parts[req.body.partIndex] = req.body.updatedPart;
    await db.insert(car);
    res.redirect(`/car/${req.params.carId}`);
});

// Delete a part
app.post('/car/:id/delete-part', async (req, res) => {
    const car = await db.get(req.params.id);
    car.parts.splice(req.body.partIndex, 1);
    await db.insert(car);
    res.redirect(`/car/${req.params.id}`);
});

// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
