    const API_BASE_URL = "https://oracleapex.com/ords/tbdandres/alquiler/";
    const DEPLOYED_PROXY_URL = "https://alquiler-front-alpha.vercel.app/api/autos";

    const state = {
      autos: [],
      alquileres: [],
      selectedAuto: null,
      activeView: "usuario"
    };

    const elements = {
      refreshButton: document.getElementById("refreshButton"),
      statusBox: document.getElementById("status"),
      totalAutos: document.getElementById("totalAutos"),
      autosDisponibles: document.getElementById("autosDisponibles"),
      alquileresActivos: document.getElementById("alquileresActivos"),
      precioPromedio: document.getElementById("precioPromedio"),
      autosGrid: document.getElementById("autosGrid"),
      selectedCar: document.getElementById("selectedCar"),
      alquilerForm: document.getElementById("alquilerForm"),
      alquilerIdAuto: document.getElementById("alquilerIdAuto"),
      submitAlquiler: document.getElementById("submitAlquiler"),
      autoForm: document.getElementById("autoForm"),
      clienteForm: document.getElementById("clienteForm"),
      adminAlquilerForm: document.getElementById("adminAlquilerForm"),
      autosTableBody: document.getElementById("autosTableBody"),
      alquileresTableBody: document.getElementById("alquileresTableBody")
    };

    const moneyFormatter = new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0
    });

    async function cargarDatos() {
      setLoading(true);
      setStatus("Consultando datos...", "loading");

      try {
        const autos = await obtenerAutos();
        state.autos = autos;

        try {
          state.alquileres = await apiGet("alquileres");
        } catch (error) {
          state.alquileres = [];
          console.warn("No se pudo cargar alquileres:", error);
        }

        render();
        setStatus(`Se cargaron ${autos.length} autos desde Oracle APEX.`, "success");
      } catch (error) {
        console.error("ERROR:", error);
        state.autos = [];
        state.alquileres = [];
        render();
        setStatus(error.message || "Error al cargar datos.", "error");
      } finally {
        setLoading(false);
      }
    }

    async function obtenerAutos() {
      const errores = [];
      const endpoints = [
        { name: "Oracle APEX directo", url: resourceUrl("autos") },
        { name: "proxy Vercel autos", url: DEPLOYED_PROXY_URL }
      ];

      for (const endpoint of endpoints) {
        try {
          const data = await fetchJson(endpoint.url);
          return Array.isArray(data.items) ? data.items : [];
        } catch (error) {
          errores.push(`${endpoint.name}: ${formatearErrorFetch(error)}`);
        }
      }

      throw new Error(`No se pudo leer autos. ${errores.join(" | ")}`);
    }

    async function apiGet(resource) {
      const data = await fetchJson(resourceUrl(resource));
      return Array.isArray(data.items) ? data.items : [];
    }

    async function apiPost(resource, payload) {
      return fetchJson(resourceUrl(resource), {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
    }

    async function fetchJson(url, options = {}) {
      const response = await fetchConTimeout(url, 10000, options);
      const contentType = response.headers.get("content-type") || "";
      const text = await response.text();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}${text ? ` - ${text.slice(0, 140)}` : ""}`);
      }

      if (!contentType.includes("application/json")) {
        throw new Error("La API no devolvió JSON.");
      }

      return text ? JSON.parse(text) : {};
    }

    async function fetchConTimeout(url, timeoutMs, options = {}) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        return await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            "Accept": "application/json",
            ...(options.headers || {})
          }
        });
      } finally {
        clearTimeout(timeout);
      }
    }

    function resourceUrl(resource) {
      return `${API_BASE_URL}${resource}/`;
    }

    function render() {
      pintarResumen();
      pintarAutosUsuario();
      pintarAutosTabla();
      pintarAlquileresTabla();
      pintarSeleccion();
    }

    function pintarResumen() {
      const disponibles = state.autos.filter(auto => auto.estado === "disponible").length;
      const activos = state.alquileres.filter(alquiler => alquiler.estado === "activo").length;
      const promedio = state.autos.length
        ? state.autos.reduce((total, auto) => total + Number(auto.precio_dia || 0), 0) / state.autos.length
        : 0;

      elements.totalAutos.textContent = state.autos.length;
      elements.autosDisponibles.textContent = disponibles;
      elements.alquileresActivos.textContent = activos;
      elements.precioPromedio.textContent = moneyFormatter.format(promedio);
    }

    function pintarAutosUsuario() {
      const autosOrdenados = [...state.autos].sort((a, b) => {
        if (a.estado === "disponible" && b.estado !== "disponible") return -1;
        if (a.estado !== "disponible" && b.estado === "disponible") return 1;
        return String(a.marca).localeCompare(String(b.marca));
      });

      if (!autosOrdenados.length) {
        elements.autosGrid.innerHTML = '<div class="empty">No hay autos para mostrar.</div>';
        return;
      }

      elements.autosGrid.innerHTML = autosOrdenados.map(auto => {
        const disponible = auto.estado === "disponible";
        return `
          <article class="car-card">
            <div class="car-head">
              <div>
                <h3 class="brand">${escapeHTML(auto.marca || "Sin marca")}</h3>
                <p class="model">${escapeHTML(auto.modelo || "Sin modelo")}</p>
              </div>
              <span class="badge ${escapeHTML(auto.estado || "")}">${formatearEstado(auto.estado)}</span>
            </div>

            <dl class="details">
              <div class="detail-row">
                <dt>Patente</dt>
                <dd>${escapeHTML(auto.patente || "-")}</dd>
              </div>
              <div class="detail-row">
                <dt>ID auto</dt>
                <dd>#${escapeHTML(auto.id_auto ?? "-")}</dd>
              </div>
            </dl>

            <div class="price">
              <span>Por día</span>
              <strong>${moneyFormatter.format(Number(auto.precio_dia || 0))}</strong>
            </div>

            <button type="button" ${disponible ? "" : "disabled"} data-select-auto="${escapeHTML(auto.id_auto)}">
              ${disponible ? "Alquilar este auto" : "No disponible"}
            </button>
          </article>
        `;
      }).join("");
    }

    function pintarAutosTabla() {
      if (!state.autos.length) {
        elements.autosTableBody.innerHTML = '<tr><td colspan="6">Sin autos para mostrar.</td></tr>';
        return;
      }

      elements.autosTableBody.innerHTML = state.autos.map(auto => `
        <tr>
          <td>#${escapeHTML(auto.id_auto ?? "-")}</td>
          <td>${escapeHTML(auto.marca || "-")}</td>
          <td>${escapeHTML(auto.modelo || "-")}</td>
          <td>${escapeHTML(auto.patente || "-")}</td>
          <td>${formatearEstado(auto.estado)}</td>
          <td>${moneyFormatter.format(Number(auto.precio_dia || 0))}</td>
        </tr>
      `).join("");
    }

    function pintarAlquileresTabla() {
      if (!state.alquileres.length) {
        elements.alquileresTableBody.innerHTML = '<tr><td colspan="7">Sin alquileres publicados o endpoint pendiente.</td></tr>';
        return;
      }

      elements.alquileresTableBody.innerHTML = state.alquileres.map(alquiler => `
        <tr>
          <td>#${escapeHTML(alquiler.id_alquiler ?? "-")}</td>
          <td>${escapeHTML(alquiler.id_cliente ?? "-")}</td>
          <td>${escapeHTML(alquiler.id_auto ?? "-")}</td>
          <td>${formatearFecha(alquiler.fecha_inicio)}</td>
          <td>${formatearFecha(alquiler.fecha_devolucion_prevista)}</td>
          <td>${formatearFecha(alquiler.fecha_devolucion_real)}</td>
          <td>${formatearEstado(alquiler.estado)}</td>
        </tr>
      `).join("");
    }

    function pintarSeleccion() {
      const auto = state.selectedAuto;

      if (!auto) {
        elements.selectedCar.innerHTML = "Seleccioná un auto disponible para empezar.";
        elements.alquilerIdAuto.value = "";
        elements.submitAlquiler.disabled = true;
        return;
      }

      elements.selectedCar.innerHTML = `
        <strong>${escapeHTML(auto.marca)} ${escapeHTML(auto.modelo)}</strong>
        Patente ${escapeHTML(auto.patente)} · ${moneyFormatter.format(Number(auto.precio_dia || 0))} por día
      `;
      elements.alquilerIdAuto.value = auto.id_auto;
      elements.submitAlquiler.disabled = false;
    }

    function seleccionarAuto(idAuto) {
      state.selectedAuto = state.autos.find(auto => String(auto.id_auto) === String(idAuto)) || null;
      pintarSeleccion();
      elements.alquilerForm.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    async function handleAlquilerSubmit(event) {
      event.preventDefault();

      if (!state.selectedAuto) {
        setStatus("Seleccioná un auto antes de confirmar.", "error");
        return;
      }

      const payload = formDataToObject(event.currentTarget);
      payload.id_auto = Number(payload.id_auto);
      payload.id_cliente = Number(payload.id_cliente);
      payload.estado = "activo";

      await guardarRecurso("alquileres", payload, event.currentTarget, "Alquiler registrado.");
      state.selectedAuto = null;
    }

    async function handleAutoSubmit(event) {
      event.preventDefault();
      const payload = formDataToObject(event.currentTarget);
      payload.precio_dia = Number(payload.precio_dia);
      await guardarRecurso("autos", payload, event.currentTarget, "Auto guardado.");
    }

    async function handleClienteSubmit(event) {
      event.preventDefault();
      const payload = formDataToObject(event.currentTarget);
      await guardarRecurso("clientes", payload, event.currentTarget, "Cliente guardado.");
    }

    async function handleAdminAlquilerSubmit(event) {
      event.preventDefault();
      const payload = formDataToObject(event.currentTarget);
      payload.id_auto = Number(payload.id_auto);
      payload.id_cliente = Number(payload.id_cliente);
      await guardarRecurso("alquileres", payload, event.currentTarget, "Alquiler guardado.");
    }

    async function guardarRecurso(resource, payload, form, successMessage) {
      setLoading(true);
      setStatus(`Guardando en ${resource}...`, "loading");

      try {
        await apiPost(resource, payload);
        form.reset();
        await cargarDatos();
        setStatus(successMessage, "success");
      } catch (error) {
        console.error(error);
        setStatus(`No se pudo guardar en ${resource}. ${formatearErrorFetch(error)}`, "error");
      } finally {
        setLoading(false);
      }
    }

    function formDataToObject(form) {
      return Object.fromEntries(new FormData(form).entries());
    }

    function cambiarVista(viewName) {
      state.activeView = viewName;

      document.querySelectorAll(".tab-button").forEach(button => {
        button.classList.toggle("active", button.dataset.view === viewName);
      });

      document.getElementById("usuarioView").classList.toggle("active", viewName === "usuario");
      document.getElementById("adminView").classList.toggle("active", viewName === "admin");
    }

    function setStatus(message, type) {
      const visibleType = ["success", "error", "info"].includes(type) ? type : "";
      elements.statusBox.className = `status ${visibleType}`;
      elements.statusBox.innerHTML = `<span class="dot"></span><span>${escapeHTML(message)}</span>`;
    }

    function setLoading(isLoading) {
      elements.refreshButton.disabled = isLoading;
      elements.refreshButton.textContent = isLoading ? "Cargando..." : "Actualizar datos";
    }

    function formatearEstado(estado) {
      return String(estado || "sin estado").replaceAll("_", " ");
    }

    function formatearFecha(value) {
      if (!value) return "-";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return escapeHTML(value);
      return date.toLocaleDateString("es-AR");
    }

    function formatearErrorFetch(error) {
      if (error.name === "AbortError") {
        return "agotó el tiempo de espera";
      }

      if (error.message === "Failed to fetch") {
        return "bloqueado por CORS, endpoint inexistente o sin conexión";
      }

      return error.message;
    }

    function escapeHTML(value) {
      return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    document.querySelectorAll(".tab-button").forEach(button => {
      button.addEventListener("click", () => cambiarVista(button.dataset.view));
    });

    elements.autosGrid.addEventListener("click", event => {
      const button = event.target.closest("[data-select-auto]");
      if (button) {
        seleccionarAuto(button.dataset.selectAuto);
      }
    });

    elements.refreshButton.addEventListener("click", cargarDatos);
    elements.alquilerForm.addEventListener("submit", handleAlquilerSubmit);
    elements.autoForm.addEventListener("submit", handleAutoSubmit);
    elements.clienteForm.addEventListener("submit", handleClienteSubmit);
    elements.adminAlquilerForm.addEventListener("submit", handleAdminAlquilerSubmit);

    cargarDatos();
