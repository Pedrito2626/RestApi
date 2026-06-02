const { Router } = require('express');
const {
  obtenerTodos,
  obtenerPorId,
  crear,
  actualizar,
  eliminar,
} = require('../controllers/productos');

const router = Router();

router.get('/', obtenerTodos);
router.get('/:id', obtenerPorId);
router.post('/', crear);
router.put('/:id', actualizar);
router.delete('/:id', eliminar);

module.exports = router;
