//Dependencies
var express = require('express');

//Server setup
var app = express();
const PORT = process.env.PORT || 5000;

//Middleware
app.use(express.json({extended: false}));

app.listen(PORT, () =>  console.log(`Server started on port ${PORT}`));

//routes
app.get('/', (req,res) => {res.send('API Running')});
app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/hunts', require('./routes/api/hunts'));



