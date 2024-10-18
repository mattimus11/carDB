require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

const nano = require('nano');
const couchdbUrl = 'http://admin:password@localhost:5984'; // Use your CouchDB URL and credentials
const nanoClient = nano(couchdbUrl);
const dbName = 'cars'; // Replace with your database name
const db = nanoClient.db.use(dbName);

// Route to index
app.get('/', async (req, res) => {
  try {git 
    const cars = await db.list({ include_docs: true });
    res.render('index', {
      cars: cars.rows.map(row => row.doc),
    });
  } catch (err) {
    console.error('Error fetching cars:', err);
    res.status(500).send('Error fetching cars');
  }
});

// Route to add car
app.post('/add-car', async (req, res) => {
  const [carMake, carModel] = req.body.carInfo.split(' '); // Split input into make and model
  try {
    await db.insert({ make: carMake, model: carModel });
    res.redirect('/');
  } catch (err) {
    console.error('Error adding car:', err);
    res.status(500).send('Error adding car');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
