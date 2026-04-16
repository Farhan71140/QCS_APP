require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

app.use('/api/auth',       require('./routes/auth'));
app.use('/api/users',      require('./routes/users'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/production', require('./routes/production'));
app.use('/api/qc',         require('./routes/qc'));
app.use('/api/payments',   require('./routes/payments'));
app.use('/api/dashboard',  require('./routes/dashboard'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'QM API running', version: '2.0', db: 'Supabase' });
});

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log('QM API running on port ' + PORT));
