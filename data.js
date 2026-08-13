// =============================================================
// ETAPA 6 — meKit + AJAX (MockAPI)
// CRUD de productos del kit, pero ahora los datos se guardan
// en el servidor y se mantienen al recargar la página.
// =============================================================

document.addEventListener("DOMContentLoaded", () => {

  // CAPTURA DE ELEMENTOS DEL DOM
  const form = document.getElementById("item-form");

  const scoreInput = document.getElementById("item-score");
  const nameInput  = document.getElementById("item-name");
  const typeInput  = document.getElementById("item-type");
  const brandInput = document.getElementById("item-brand");

  const btnAdd    = document.getElementById("btn-add");
  const btnSave   = document.getElementById("btn-save");
  const btnCancel = document.getElementById("btn-cancel");

  const loadingIndicator = document.getElementById("loading-indicator");
  const statusBox        = document.getElementById("status-message");

  const tbody = document.getElementById("table-body");

  const modal            = document.getElementById("confirmation-modal");
  const confirmDeleteBtn = document.getElementById("confirm-delete");
  const cancelDeleteBtn  = document.getElementById("cancel-delete");

  // =============================================================
  // ESTADO Y CONFIGURACIÓN DE LA API
  // =============================================================

  const API_BASE_URL = "https://6928d4249d311cddf3476b25.mockapi.io/api/v1/mekit";

  let items = [];           // productos actuales del meKit
  let editingItemId = null; // id del producto que se está editando
  let itemToDeleteId = null;// id del producto que se va a eliminar

  // =============================================================
  // FUNCIONES UTILITARIAS
  // =============================================================

  function showMessage(msg) {
    statusBox.textContent = msg;
    statusBox.classList.remove("hidden");

    setTimeout(() => {
      statusBox.classList.add("hidden");
    }, 2500);
  }

  function enableEditMode() {
    btnAdd.classList.add("hidden");
    btnSave.classList.remove("hidden");
  }

  function disableEditMode() {
    editingItemId = null;
    btnSave.classList.add("hidden");
    btnAdd.classList.remove("hidden");
  }

  // fetch con reintentos
  async function fetchWithRetry(url, options = {}, retries = 3, delayMs = 500) {
    for (let intento = 0; intento <= retries; intento++) {
      try {
        const response = await fetch(url, options);

        if (!response.ok) {
          throw new Error("Error HTTP: " + response.status);
        }

        return response;
      } catch (error) {
        console.error(`Error en fetch (intento ${intento + 1}):`, error);

        if (intento === retries) {
          throw error;
        }

        await new Promise(res => setTimeout(res, delayMs));
      }
    }
  }

  // =============================================================
  // RENDERIZADO DE TABLA
  // =============================================================

  function renderTable() {
    tbody.innerHTML = "";

    if (items.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 5;
      td.textContent = "No hay productos cargados.";
      td.style.textAlign = "center";
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    items.forEach((item) => {
      const tr = document.createElement("tr");

      ["score", "name", "type", "brand"].forEach((key) => {
        const td = document.createElement("td");
        td.textContent = item[key];
        tr.appendChild(td);
      });

      const tdActions = document.createElement("td");
      const wrap = document.createElement("div");
      wrap.className = "action-btns";

      const btnEdit = document.createElement("button");
      btnEdit.className = "action";
      btnEdit.textContent = "Editar";
      btnEdit.dataset.action = "edit";
      btnEdit.dataset.id = item.id;

      const btnDel = document.createElement("button");
      btnDel.className = "action";
      btnDel.textContent = "Eliminar";
      btnDel.dataset.action = "delete";
      btnDel.dataset.id = item.id;

      wrap.append(btnEdit, btnDel);
      tdActions.appendChild(wrap);
      tr.appendChild(tdActions);

      tbody.appendChild(tr);
    });
  }

  // =============================================================
  // CARGA INICIAL DESDE LA API
  // =============================================================

  async function loadData() {
    if (loadingIndicator) {
      loadingIndicator.classList.remove("hidden");
    }
    statusBox.classList.add("hidden");
    statusBox.textContent = "";

    try {
      const response = await fetchWithRetry(API_BASE_URL);
      const data = await response.json();

      items = data || [];
      renderTable();
    } catch (error) {
      console.error(error);
      showMessage("No se pudieron cargar los productos del meKit 😔");
    } finally {
      if (loadingIndicator) {
        loadingIndicator.classList.add("hidden");
      }
    }
  }

  // Muestro la tabla vacía mientras tanto y después cargo del servidor
  renderTable();
  loadData();

  // =============================================================
  // SUBMIT DEL FORMULARIO (AGREGAR / EDITAR)
  // =============================================================

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const score = (scoreInput.value || "").trim();
    const name  = (nameInput.value  || "").trim();
    const type  = (typeInput.value  || "").trim();
    const brand = (brandInput.value || "").trim();

    if (!score || !name || !type || !brand) {
      showMessage("Completá todos los campos ✍️");
      return;
    }

    const producto = { score, name, type, brand };

    if (loadingIndicator) {
      loadingIndicator.classList.remove("hidden");
    }
    statusBox.classList.add("hidden");
    statusBox.textContent = "";

    try {
      let response;
      let savedItem;

      if (editingItemId) {
        // EDITAR → PUT /:id
        response = await fetchWithRetry(`${API_BASE_URL}/${editingItemId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(producto)
        });

        savedItem = await response.json();

        items = items.map(item =>
          String(item.id) === String(editingItemId) ? savedItem : item
        );

        showMessage("Producto actualizado ✔️");
        disableEditMode();
      } else {
        // AGREGAR → POST /
        response = await fetchWithRetry(API_BASE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(producto)
        });

        savedItem = await response.json();
        items.push(savedItem);
        showMessage("Producto agregado ✔️");
      }

      form.reset();
      renderTable();

    } catch (error) {
      console.error(error);
      showMessage("Ocurrió un error al guardar el producto 😣");
    } finally {
      if (loadingIndicator) {
        loadingIndicator.classList.add("hidden");
      }
    }
  });

  // Cancelar edición
  form.addEventListener("reset", () => {
    disableEditMode();
    showMessage("Edición cancelada");
  });

  // =============================================================
  // BOTONES EDITAR / ELIMINAR EN LA TABLA
  // =============================================================

  tbody.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const action = btn.dataset.action;
    const id = btn.dataset.id;
    if (!id) return;

    const item = items.find(it => String(it.id) === String(id));
    if (!item) return;

    if (action === "edit") {
      editingItemId = id;

      scoreInput.value = item.score;
      nameInput.value  = item.name;
      typeInput.value  = item.type;
      brandInput.value = item.brand;

      enableEditMode();
      showMessage("Editando producto… ✏️");
      scoreInput.focus();
    }

    if (action === "delete") {
      itemToDeleteId = id;
      modal.classList.add("open");
    }
  });

  // =============================================================
  // MODAL DE ELIMINACIÓN
  // =============================================================

  confirmDeleteBtn.addEventListener("click", async () => {
    if (!itemToDeleteId) {
      modal.classList.remove("open");
      return;
    }

    if (loadingIndicator) {
      loadingIndicator.classList.remove("hidden");
    }
    statusBox.classList.add("hidden");
    statusBox.textContent = "";

    try {
      await fetchWithRetry(`${API_BASE_URL}/${itemToDeleteId}`, {
        method: "DELETE"
      });

      items = items.filter(item => String(item.id) !== String(itemToDeleteId));
      renderTable();
      showMessage("Producto eliminado 🗑️");
    } catch (error) {
      console.error(error);
      showMessage("Ocurrió un error al eliminar el producto 😣");
    } finally {
      if (loadingIndicator) {
        loadingIndicator.classList.add("hidden");
      }
      itemToDeleteId = null;
      modal.classList.remove("open");
    }
  });

  cancelDeleteBtn.addEventListener("click", () => {
    itemToDeleteId = null;
    modal.classList.remove("open");
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("open");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("open")) {
      modal.classList.remove("open");
    }
  });

});
