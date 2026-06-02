const { leer, guardar } = require('../services/productos');

function obtenerTodos(req, res) {
  const productos = leer();
  res.status(200).json(productos);
}

function obtenerPorId(req, res) {
  const productos = leer();
  const producto = productos.find(p => p.id === parseInt(req.params.id));
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
  res.status(200).json(producto);
}

function crear(req, res) {
  const { nombre, precio } = req.body;
  if (!nombre || precio === undefined || precio === null) {
    return res.status(400).json({ error: 'Los campos nombre y precio son obligatorios' });
  }
  const productos = leer();
  const ids = productos.map(p => p.id);
  const nuevoId = ids.length > 0 ? Math.max(...ids) + 1 : 1;
  const nuevo = { id: nuevoId, nombre, precio: Number(precio), disponible: true };
  productos.push(nuevo);
  guardar(productos);
  res.status(201).json(nuevo);
}

function actualizar(req, res) {
  const productos = leer();
  const index = productos.findIndex(p => p.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Producto no encontrado' });
  const { nombre, precio, disponible } = req.body;
  if (!nombre || precio === undefined || precio === null) {
    return res.status(400).json({ error: 'Los campos nombre y precio son obligatorios' });
  }
  productos[index] = {
    ...productos[index],
    nombre,
    precio: Number(precio),
    disponible: disponible !== undefined ? disponible : productos[index].disponible,
  };
  guardar(productos);
  res.status(200).json(productos[index]);
}

function eliminar(req, res) {
  const productos = leer();
  const index = productos.findIndex(p => p.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Producto no encontrado' });
  productos.splice(index, 1);
  guardar(productos);
  res.status(204).send();
}

module.exports = { obtenerTodos, obtenerPorId, crear, actualizar, eliminar };
