const express = require('express');
const path = require('path');
const productosRoutes = require('./routes/productos');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/productos', productosRoutes);

app.get('/api', (req, res) => {
  res.json({
    mensaje: 'API REST - Gestión de Productos',
    version: '1.0.0',
    endpoints: {
      'GET /api/productos': 'Obtener todos los productos',
      'GET /api/productos/:id': 'Obtener producto por ID',
      'POST /api/productos': 'Crear producto',
      'PUT /api/productos/:id': 'Actualizar producto',
      'DELETE /api/productos/:id': 'Eliminar producto',
    },
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

module.exports = app;
