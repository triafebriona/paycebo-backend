require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api', require('./routes/payment.routes'));
app.use('/payment', require('./routes/hosted.routes'));
app.use('/api/testcards', require('./routes/testcard.routes'));
app.use('/api/branding', require('./routes/branding.routes'));
app.use('/api/analytics', require('./routes/analytics.routes'));

app.get('/', (req, res) => {
  res.send('PayCebo API is running');
});

sequelize.sync().then(() => {
  console.log('Database connected');
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to connect to database:', err);
});