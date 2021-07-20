//Dependencies
const express = require('express');
const morgan = require('morgan');

//Server setup
var app = express();
const PORT = process.env.PORT || 5000;

//Middleware
app.use(express.json({extended: false}));   // ExpressJS's JSON Body Parser
app.use(morgan('dev')); // Set to track :method :url :status :response-time ms - :res[content-length]
app.use('/uploads', express.static("uploads")); // Static folder accessible to public that holds images

app.listen(PORT, () =>  console.log(`Server started on port ${PORT}`));

//routes
app.get('/', (req,res) => {res.send('API Running')});   // General Route - make sure API is Running
app.use('/api/users', require('./routes/api/users'));   // Users Route
app.use('/api/auth', require('./routes/api/auth'));     // Authentication + Token generation route
app.use('/api/hunts', require('./routes/api/hunts'));   // Hunts Route



