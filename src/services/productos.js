const fs = require('fs');
const path = require('path');

const rutaArchivo = path.join(__dirname, '../data/productos.json');

function leer() {
  const contenido = fs.readFileSync(rutaArchivo, 'utf-8');
  return JSON.parse(contenido);
}

function guardar(productos) {
  fs.writeFileSync(rutaArchivo, JSON.stringify(productos, null, 2), 'utf-8');
}

module.exports = { leer, guardar };
