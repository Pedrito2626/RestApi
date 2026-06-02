'use strict';

// Estado local sincronizado con el servidor
let productos = [];

// ── Utilidades ───────────────────────────────────────────────

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatearPrecio(precio) {
  return Number(precio).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

// ── Render ───────────────────────────────────────────────────

function renderProducto(p) {
  const tr = document.createElement('tr');
  tr.dataset.id = p.id;

  const badgeClass = p.disponible ? 'badge-si' : 'badge-no';
  const badgeText  = p.disponible ? 'Disponible' : 'Agotado';

  tr.innerHTML = `
    <td class="td-id">${p.id}</td>
    <td class="td-nombre">${escapeHtml(p.nombre)}</td>
    <td class="td-precio">${formatearPrecio(p.precio)}</td>
    <td class="td-estado">
      <span class="badge ${badgeClass}">
        <span class="badge-dot"></span>${badgeText}
      </span>
    </td>
    <td class="td-acciones">
      <div class="td-acciones-inner">
        <button class="btn btn-toggle" data-action="toggle" data-id="${p.id}" title="Cambiar disponibilidad">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3m13 0h3a2 2 0 0 0 2-2v-3"/>
          </svg>
          Disponibilidad
        </button>
        <button class="btn btn-delete" data-action="delete" data-id="${p.id}" title="Eliminar producto">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
          </svg>
          Eliminar
        </button>
      </div>
    </td>
  `;
  return tr;
}

function renderTabla(lista) {
  const tbody = document.getElementById('tbody-productos');
  tbody.innerHTML = '';

  if (lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state">No hay productos registrados.</div></td></tr>`;
    return;
  }

  lista.forEach(p => tbody.appendChild(renderProducto(p)));
}

function actualizarStats(lista) {
  const disponibles = lista.filter(p => p.disponible).length;
  document.getElementById('stat-total').textContent      = lista.length;
  document.getElementById('stat-disponibles').textContent = disponibles;
  document.getElementById('stat-agotados').textContent   = lista.length - disponibles;
}

// ── Mensajes ─────────────────────────────────────────────────

let msgTimer = null;

function mostrarMensaje(texto, tipo = 'success') {
  const container = document.getElementById('global-message');
  clearTimeout(msgTimer);
  container.className = `global-message is-${tipo}`;
  container.innerHTML = `<div class="msg-inner">${texto}</div>`;

  if (tipo === 'success') {
    msgTimer = setTimeout(() => {
      const inner = container.querySelector('.msg-inner');
      if (inner) inner.classList.add('msg-fade-out');
      setTimeout(() => {
        container.className = 'global-message hidden';
        container.innerHTML = '';
      }, 400);
    }, 3000);
  }
}

// ── Fetch: leer todos ────────────────────────────────────────

async function fetchProductos() {
  const tbody = document.getElementById('tbody-productos');
  tbody.innerHTML = `<tr><td colspan="5"><div class="table-state"><div class="spinner"></div><span>Cargando...</span></div></td></tr>`;

  try {
    const res = await fetch('/api/productos');
    if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
    productos = await res.json();
    renderTabla(productos);
    actualizarStats(productos);
  } catch (err) {
    mostrarMensaje(`Error al cargar productos: ${err.message}`, 'error');
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state">No se pudieron cargar los productos.</div></td></tr>`;
  }
}

// ── Fetch: crear ─────────────────────────────────────────────

async function crearProducto(nombre, precio) {
  const btn = document.getElementById('btn-crear');
  btn.disabled = true;

  try {
    const res = await fetch('/api/productos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, precio }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Error ${res.status}`);
    }

    const nuevo = await res.json();
    productos.push(nuevo);

    const tbody = document.getElementById('tbody-productos');
    if (tbody.querySelector('.empty-state')) tbody.innerHTML = '';

    const tr = renderProducto(nuevo);
    tbody.appendChild(tr);
    tr.classList.add('row-flash');
    actualizarStats(productos);

    document.getElementById('form-producto').reset();
    mostrarMensaje(`Producto <strong>"${escapeHtml(nuevo.nombre)}"</strong> agregado correctamente.`, 'success');
  } catch (err) {
    mostrarMensaje(`Error al crear producto: ${err.message}`, 'error');
  } finally {
    btn.disabled = false;
  }
}

// ── Fetch: cambiar disponibilidad ────────────────────────────

async function cambiarDisponibilidad(id) {
  const producto = productos.find(p => p.id === id);
  if (!producto) return;

  try {
    const res = await fetch(`/api/productos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...producto, disponible: !producto.disponible }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Error ${res.status}`);
    }

    const actualizado = await res.json();
    const idx = productos.findIndex(p => p.id === id);
    productos[idx] = actualizado;

    const tbody = document.getElementById('tbody-productos');
    const trViejo = tbody.querySelector(`tr[data-id="${id}"]`);
    const trNuevo = renderProducto(actualizado);
    trNuevo.classList.add('row-flash');
    tbody.replaceChild(trNuevo, trViejo);
    actualizarStats(productos);
  } catch (err) {
    mostrarMensaje(`Error al cambiar disponibilidad: ${err.message}`, 'error');
  }
}

// ── Fetch: eliminar ──────────────────────────────────────────

async function eliminarProducto(id) {
  if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) return;

  try {
    const res = await fetch(`/api/productos/${id}`, { method: 'DELETE' });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Error ${res.status}`);
    }

    productos = productos.filter(p => p.id !== id);

    const tbody = document.getElementById('tbody-productos');
    tbody.querySelector(`tr[data-id="${id}"]`)?.remove();

    if (productos.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state">No hay productos registrados.</div></td></tr>`;
    }

    actualizarStats(productos);
    mostrarMensaje('Producto eliminado correctamente.', 'success');
  } catch (err) {
    mostrarMensaje(`Error al eliminar producto: ${err.message}`, 'error');
  }
}

// ── Validación del formulario ────────────────────────────────

function validarFormulario() {
  const inputNombre = document.getElementById('input-nombre');
  const inputPrecio = document.getElementById('input-precio');
  const errNombre   = document.getElementById('error-nombre');
  const errPrecio   = document.getElementById('error-precio');

  const nombre = inputNombre.value.trim();
  const precio = inputPrecio.value;
  let valido = true;

  if (!nombre) {
    errNombre.textContent = 'El nombre es obligatorio.';
    inputNombre.classList.add('is-invalid');
    valido = false;
  } else {
    errNombre.textContent = '';
    inputNombre.classList.remove('is-invalid');
  }

  if (precio === '' || isNaN(Number(precio)) || Number(precio) < 0) {
    errPrecio.textContent = 'Ingresa un precio válido (mayor o igual a 0).';
    inputPrecio.classList.add('is-invalid');
    valido = false;
  } else {
    errPrecio.textContent = '';
    inputPrecio.classList.remove('is-invalid');
  }

  return valido ? { nombre, precio: Number(precio) } : null;
}

// ── Event Listeners ──────────────────────────────────────────

document.getElementById('form-producto').addEventListener('submit', (e) => {
  e.preventDefault();
  const datos = validarFormulario();
  if (datos) crearProducto(datos.nombre, datos.precio);
});

document.getElementById('tbody-productos').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const id = parseInt(btn.dataset.id, 10);
  if (btn.dataset.action === 'toggle') cambiarDisponibilidad(id);
  if (btn.dataset.action === 'delete') eliminarProducto(id);
});

document.getElementById('btn-reload').addEventListener('click', fetchProductos);

// ── Inicio ───────────────────────────────────────────────────
fetchProductos();
