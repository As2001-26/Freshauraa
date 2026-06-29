
      // Check authentication
      if (!localStorage.getItem("token")) {
        window.location.href = "adminLogin.html";
      }

      const API = "http://localhost:3000/api";
      const BACKEND = "http://localhost:3000";

      // Resolve image path — prefix backend URL for uploaded images
      function imgSrc(path) {
        if (!path) return "";
        if (path.startsWith("/uploads/")) return BACKEND + path;
        return path;
      }

      // ─────────────────────────────────────────────
      // STATE
      // ─────────────────────────────────────────────
      const DEFAULT_CATEGORIES = [
        "Home Cleaning",
        "Household Supplies",
        "Personal Care",
        "Uncategorized",
      ];
      const DEFAULT_PRODUCTS = [
        {
          id: 1,
          name: "Freshauraa Phenyl",
          category: "Home Cleaning",
          price: 300,
          bogo: true,
          image: "assets/phenyl1.jpg",
          desc: "",
        },
        {
          id: 2,
          name: "Food Wrapping Paper",
          category: "Uncategorized",
          price: 325,
          bogo: true,
          image: "assets/food1.jpg",
          desc: "",
        },
        {
          id: 3,
          name: "Aluminium Foil Roll",
          category: "Household Supplies",
          price: 920,
          bogo: true,
          image: "assets/aluminium1.jpg",
          desc: "",
        },
        {
          id: 4,
          name: "Facial-Car Tissue Box 100",
          category: "Personal Care",
          price: 75,
          bogo: true,
          image: "assets/tissue1.jpg",
          desc: "",
        },
        {
          id: 5,
          name: "Toilet Roll Pack of 10",
          category: "Household Supplies",
          price: 390,
          bogo: true,
          image: "assets/toiletroll1.jpg",
          desc: "",
        },
        {
          id: 6,
          name: "Glass Cleaner 2X Shine 500ml",
          category: "Home Cleaning",
          price: 99,
          bogo: true,
          image: "assets/glass2.jpg",
          desc: "",
        },
        {
          id: 7,
          name: "Dishwash Gel 100 Lemons Power",
          category: "Home Cleaning",
          price: 160,
          bogo: true,
          image: "assets/dish1.jpg",
          desc: "",
        },
        {
          id: 8,
          name: "Floor Cleaner 10X Clean Lemon",
          category: "Home Cleaning",
          price: 125,
          bogo: true,
          image: "assets/floor1.jpg",
          desc: "",
        },
        {
          id: 9,
          name: "Toilet Cleaner",
          category: "Home Cleaning",
          price: 145,
          bogo: true,
          image: "assets/toiletCleaner.jpg",
          desc: "",
        },
        {
          id: 10,
          name: "Disinfectant",
          category: "Home Cleaning",
          price: 180,
          bogo: true,
          image: "assets/disinfectant.jpg",
          desc: "",
        },
      ];

      function loadState() {
        try {
          return {
            categories: JSON.parse(localStorage.getItem("fa_categories")) || [
              ...DEFAULT_CATEGORIES,
            ],
            products: JSON.parse(localStorage.getItem("fa_products")) || [
              ...DEFAULT_PRODUCTS,
            ],
            about: {
          title: "About Page",
          sub: "Edit content and video for the About Us page.",
        }
      };
        } catch (e) {
          return {
            categories: [...DEFAULT_CATEGORIES],
            products: [...DEFAULT_PRODUCTS],
          };
        }
      }
      function saveState() {
        localStorage.setItem("fa_categories", JSON.stringify(state.categories));
        localStorage.setItem("fa_products", JSON.stringify(state.products));
      }

      let state = loadState();
      let nextId = state.products.length
        ? Math.max(...state.products.map((p) => p.id)) + 1
        : 1;

      // Try to sync products from backend (if available) so admin panel matches DB/frontend
      async function refreshProductsState() {
        try {
          const res = await fetch(`${API}/products`);
          const data = await res.json();
          const backendProducts = Array.isArray(data)
            ? data
            : data.products || [];
          if (!Array.isArray(backendProducts)) {
            throw new Error("Invalid products response");
          }

          state.products = backendProducts.map((p, i) => ({
            // Keep a numeric admin-side id for local table actions.
            id: typeof p.id === "number" ? p.id : i + 1,
            _id: p._id || null,
            name: p.name || "",
            category: p.category || "Uncategorized",
            price: p.price || 0,
            image: p.image || p.imageUrl || "",
            bogo: typeof p.bogo === "boolean" ? p.bogo : true,
            desc: p.description || p.desc || "",
          }));

          const numericIds = state.products
            .map((p) => (typeof p.id === "number" ? p.id : NaN))
            .filter((n) => !Number.isNaN(n));
          nextId = numericIds.length ? Math.max(...numericIds) + 1 : 1;
          const backendCategories = state.products
            .map((p) => p.category || "Uncategorized")
            .filter(Boolean);
          state.categories = Array.from(
            new Set([
              ...state.categories,
              ...backendCategories,
              "Uncategorized",
            ]),
          );

          saveState();
          renderProductsTable();
          return true;
        } catch (error) {
          console.warn("Unable to refresh backend products:", error);
          return false;
        }
      }

      async function syncProductsFromBackend() {
        await refreshProductsState();
      }

      // live data from backend
      let allOrders = [];
      let allContacts = [];
      let currentOrderId = null;
      let currentContactId = null;

      // ─────────────────────────────────────────────
      // NAVIGATION
      // ─────────────────────────────────────────────
      const META = {
        dashboard: { title: "Dashboard", sub: "Welcome back, Admin" },
        products: { title: "Products", sub: "Manage your product listings" },
        orders: { title: "Orders", sub: "Track all customer orders" },
        contacts: { title: "Contacts", sub: "Customer messages & enquiries" },
      };

      function switchSection(name) {
        document
          .querySelectorAll(".nav-item[data-section]")
          .forEach((n) =>
            n.classList.toggle("active", n.dataset.section === name),
          );
        document
          .querySelectorAll(".section")
          .forEach((s) =>
            s.classList.toggle("active", s.id === "section-" + name),
          );
        document.getElementById("topbarTitle").textContent = META[name].title;
        document.getElementById("topbarSub").textContent = META[name].sub;
        document.querySelector(".main").scrollTop = 0;
        sessionStorage.setItem("fa_active_section", name); // remember active section across reloads
        if (name === "dashboard") {
          loadOrders(true);
          loadContacts(true);
        }
        if (name === "products") renderProductsTable();
        if (name === "orders") loadOrders();
        if (name === "contacts") loadContacts();
        if (name === "about") loadAbout();
      }
      document
        .querySelectorAll(".nav-item[data-section]")
        .forEach((btn) =>
          btn.addEventListener("click", () =>
            switchSection(btn.dataset.section),
          ),
        );

      // ─────────────────────────────────────────────
      // HELPERS
      // ─────────────────────────────────────────────
      function fmt(dateStr) {
        if (!dateStr) return "—";
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      }
      function statusPill(s) {
        const map = {
          pending: "pill-pending",
          processing: "pill-processing",
          delivered: "pill-delivered",
          cancelled: "pill-cancelled",
        };
        return `<span class="pill ${map[s] || "pill-pending"}">${s || "Pending"}</span>`;
      }
      function contactPill(s) {
        return s === "replied"
          ? `<span class="pill pill-replied">Replied</span>`
          : `<span class="pill pill-new">New</span>`;
      }

      // ─────────────────────────────────────────────
      // ORDERS — load from backend
      // ─────────────────────────────────────────────
      async function loadOrders(dashOnly = false) {
        try {
          const res = await fetch(`${API}/orders`);
          const data = await res.json();
          allOrders = Array.isArray(data) ? data : data.orders || [];
        } catch (e) {
          allOrders = [];
        }

        // update stats
        document.getElementById("dash-total-orders").textContent =
          allOrders.length;
        document.getElementById("dash-orders-sub").textContent =
          allOrders.length
            ? `${allOrders.filter((o) => o.status === "pending" || !o.status).length} pending`
            : "No orders yet";

        // badge
        const pending = allOrders.filter(
          (o) => !o.status || o.status === "pending",
        ).length;
        const badge = document.getElementById("orders-badge");
        badge.textContent = pending;
        badge.style.display = pending > 0 ? "inline-block" : "none";

        // dashboard preview (last 5)
        renderDashOrders();

        if (!dashOnly) renderOrdersTable();
      }

      function renderDashOrders() {
        const tbody = document.getElementById("dash-orders-body");
        if (!allOrders.length) {
          tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No orders yet.</td></tr>`;
          return;
        }
        tbody.innerHTML = allOrders
          .slice(0, 5)
          .map(
            (o) => `
          <tr>
            <td class="order-id-cell">${o._id ? o._id.slice(-6).toUpperCase() : "—"}</td>
            <td>
              <div style="font-weight:500;">${o.fullName || "—"}</div>
              <div style="font-size:11px;color:var(--muted);">${o.email || ""}</div>
            </td>
            <td style="font-size:12px;">${o.phone || "—"}</td>
            <td>
              <div class="products-mini">
                ${(o.products || [])
                  .map((p, i) =>
                    i < 2 ? `<span>${p.name} ×${p.quantity}</span>` : "",
                  )
                  .join("")}
                ${(o.products || []).length > 2 ? `<span>+${o.products.length - 2} more</span>` : ""}
              </div>
            </td>
            <td class="amount-cell">₹${o.totalAmount || 0}</td>
            <td>${statusPill(o.status)}</td>
          </tr>
        `,
          )
          .join("");
      }

      function renderOrdersTable() {
        const search = (
          document.getElementById("orders-search").value || ""
        ).toLowerCase();
        const status = document.getElementById("orders-status-filter").value;
        const payment = document.getElementById("orders-payment-filter").value;

        let filtered = allOrders.filter((o) => {
          if (status && (o.status || "pending") !== status) return false;
          if (payment && o.paymentMethod !== payment) return false;
          if (search) {
            const hay =
              `${o.fullName} ${o.email} ${o.phone} ${o.city} ${o.state}`.toLowerCase();
            if (!hay.includes(search)) return false;
          }
          return true;
        });

        document.getElementById("orders-count-label").textContent =
          `${filtered.length} of ${allOrders.length} orders`;

        const tbody = document.getElementById("all-orders-body");
        if (!filtered.length) {
          tbody.innerHTML = `<tr><td colspan="10" class="empty-state">No orders found.</td></tr>`;
          return;
        }
        tbody.innerHTML = filtered
          .map(
            (o) => `
          <tr>
            <td class="order-id-cell">${o._id ? o._id.slice(-6).toUpperCase() : "—"}</td>
            <td>
              <div style="font-weight:500;font-size:13px;">${o.fullName || "—"}</div>
              <div style="font-size:11px;color:var(--muted);">${o.email || ""}</div>
            </td>
            <td style="font-size:12px;">${o.phone || "—"}</td>
            <td style="font-size:12px;">${o.city || "—"}, ${o.state || "—"}</td>
            <td>
              <div class="products-mini">
                ${(o.products || [])
                  .map((p, i) =>
                    i < 2 ? `<span>${p.name} ×${p.quantity}</span>` : "",
                  )
                  .join("")}
                ${(o.products || []).length > 2 ? `<span style="color:var(--gold);">+${o.products.length - 2} more</span>` : ""}
              </div>
            </td>
            <td class="amount-cell">₹${o.totalAmount || 0}</td>
            <td style="font-size:12px;">${o.paymentMethod || "—"}</td>
            <td>${statusPill(o.status || "pending")}</td>
            <td style="font-size:11px;color:var(--muted);">${fmt(o.createdAt)}</td>
            <td>
              <div style="display:flex;gap:6px;">
                <button class="btn btn-outline btn-sm" onclick="openOrderDetail('${o._id}')">View</button>
                <button class="btn btn-danger btn-sm btn-icon" title="Delete order" onclick="deleteOrder('${o._id}')">
                  <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                </button>
              </div>
            </td>
          </tr>
        `,
          )
          .join("");
      }

      async function deleteOrder(id) {
        if (!confirm("Do you want to delete?")) return;
        try {
          await fetch(`${API}/orders/${id}`, { method: "DELETE" });
        } catch (e) {}
        allOrders = allOrders.filter((o) => o._id !== id);
        renderOrdersTable();
        renderDashOrders();
        // update stats
        document.getElementById("dash-total-orders").textContent =
          allOrders.length;
        document.getElementById("dash-orders-sub").textContent =
          allOrders.length
            ? `${allOrders.filter((o) => o.status === "pending" || !o.status).length} pending`
            : "No orders yet";
        const pending = allOrders.filter(
          (o) => !o.status || o.status === "pending",
        ).length;
        const badge = document.getElementById("orders-badge");
        badge.textContent = pending;
        badge.style.display = pending > 0 ? "inline-block" : "none";
        showToast("Order deleted", "success");
      }

      function openOrderDetail(id) {
        const o = allOrders.find((x) => x._id === id);
        if (!o) return;
        currentOrderId = id;
        document.getElementById("orderStatusSelect").value =
          o.status || "pending";

        document.getElementById("orderModalBody").innerHTML = `
          <div class="detail-grid">
            <div class="detail-section-title">Customer Information</div>
            <div class="detail-item"><label>Full Name</label><span>${o.fullName || "—"}</span></div>
            <div class="detail-item"><label>Email</label><span>${o.email || "—"}</span></div>
            <div class="detail-item"><label>Phone</label><span>${o.phone || "—"}</span></div>
            <div class="detail-item"><label>Payment Method</label><span>${o.paymentMethod || "—"}</span></div>
            <hr class="detail-divider" />
            <div class="detail-section-title">Delivery Address</div>
            <div class="detail-full detail-item"><label>Street Address</label><span>${o.streetAddress || "—"}</span></div>
            <div class="detail-item"><label>City</label><span>${o.city || "—"}</span></div>
            <div class="detail-item"><label>State</label><span>${o.state || "—"}</span></div>
            <div class="detail-item"><label>Pincode</label><span>${o.pincode || "—"}</span></div>
            <div class="detail-item"><label>Order Date</label><span>${fmt(o.createdAt)}</span></div>
            <hr class="detail-divider" />
            <div class="detail-section-title">Order Items</div>
            <div class="detail-full">
              <table class="order-products-table">
                <thead><tr><th>Product</th><th>Price</th><th>Qty</th><th>Subtotal</th></tr></thead>
                <tbody>
                  ${(o.products || [])
                    .map(
                      (p) => `
                    <tr>
                      <td>${p.name || "—"}</td>
                      <td>₹${p.price || 0}</td>
                      <td>${p.quantity || 1}</td>
                      <td>₹${(p.price || 0) * (p.quantity || 1)}</td>
                    </tr>
                  `,
                    )
                    .join("")}
                  <tr style="border-top:1px solid var(--border);">
                    <td colspan="3" style="font-weight:600;font-size:13px;">Total</td>
                    <td style="font-family:'Cormorant Garamond',serif;font-size:17px;color:var(--gold);">₹${o.totalAmount || 0}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        `;
        openModal("orderModal");
      }

      document
        .getElementById("updateOrderStatusBtn")
        .addEventListener("click", async () => {
          if (!currentOrderId) return;
          const newStatus = document.getElementById("orderStatusSelect").value;
          try {
            const res = await fetch(`${API}/orders/${currentOrderId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
              const idx = allOrders.findIndex((o) => o._id === currentOrderId);
              if (idx > -1) allOrders[idx].status = newStatus;
              renderOrdersTable();
              renderDashOrders();
              closeModal("orderModal");
              showToast("Order status updated", "success");
            } else {
              showToast("Failed to update status", "error");
            }
          } catch (e) {
            // If no backend patch route, update locally only
            const idx = allOrders.findIndex((o) => o._id === currentOrderId);
            if (idx > -1) allOrders[idx].status = newStatus;
            renderOrdersTable();
            renderDashOrders();
            closeModal("orderModal");
            showToast("Status updated locally", "success");
          }
        });

      // Filters
      document
        .getElementById("orders-search")
        .addEventListener("input", renderOrdersTable);
      document
        .getElementById("orders-status-filter")
        .addEventListener("change", renderOrdersTable);
      document
        .getElementById("orders-payment-filter")
        .addEventListener("change", renderOrdersTable);

      // ─────────────────────────────────────────────
      // CONTACTS — load from backend
      // ─────────────────────────────────────────────
      async function loadContacts(dashOnly = false) {
        try {
          const res = await fetch(`${API}/contact`);
          const data = await res.json();
          allContacts = Array.isArray(data) ? data : data.contacts || [];
        } catch (e) {
          allContacts = [];
        }

        // stats
        document.getElementById("dash-total-contacts").textContent =
          allContacts.length;
        document.getElementById("dash-contacts-sub").textContent =
          allContacts.length
            ? `${allContacts.filter((c) => !c.status || c.status === "new").length} new`
            : "No messages yet";

        // badge
        const newMsgs = allContacts.filter(
          (c) => !c.status || c.status === "new",
        ).length;
        const badge = document.getElementById("contacts-badge");
        badge.textContent = newMsgs;
        badge.style.display = newMsgs > 0 ? "inline-block" : "none";

        if (!dashOnly) renderContactsTable();
      }

      function renderContactsTable() {
        const search = (
          document.getElementById("contacts-search").value || ""
        ).toLowerCase();
        let filtered = allContacts.filter((c) => {
          if (!search) return true;
          return `${c.name} ${c.email} ${c.subject}`
            .toLowerCase()
            .includes(search);
        });

        document.getElementById("contacts-count-label").textContent =
          `${filtered.length} of ${allContacts.length} messages`;

        const tbody = document.getElementById("contacts-body");
        if (!filtered.length) {
          tbody.innerHTML = `<tr><td colspan="7" class="empty-state">No messages found.</td></tr>`;
          return;
        }
        tbody.innerHTML = filtered
          .map(
            (c) => `
          <tr>
            <td style="font-weight:500;">${c.name || "—"}</td>
            <td style="font-size:12px;color:var(--muted);">${c.email || "—"}</td>
            <td style="font-size:12px;">${c.subject || "—"}</td>
            <td><div class="msg-preview">${c.message || "—"}</div></td>
            <td style="font-size:11px;color:var(--muted);">${fmt(c.createdAt)}</td>
            <td>${contactPill(c.status)}</td>
            <td>
              <div style="display:flex;gap:6px;">
                <button class="btn btn-outline btn-sm" onclick="openContactDetail('${c._id}')">View</button>
                <button class="btn btn-danger btn-sm btn-icon" title="Delete message" onclick="deleteContactDirect('${c._id}')">
                  <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                </button>
              </div>
            </td>
          </tr>
        `,
          )
          .join("");
      }

      async function deleteContactDirect(id) {
        if (!confirm("Do you want to delete this message?")) return;
        try {
          await fetch(`${API}/contact/${id}`, { method: "DELETE" });
        } catch (e) {}
        allContacts = allContacts.filter((c) => c._id !== id);
        renderContactsTable();
        // update stats
        document.getElementById("dash-total-contacts").textContent =
          allContacts.length;
        document.getElementById("dash-contacts-sub").textContent =
          allContacts.length
            ? `${allContacts.filter((c) => !c.status || c.status === "new").length} new`
            : "No messages yet";
        const newMsgs = allContacts.filter(
          (c) => !c.status || c.status === "new",
        ).length;
        const badge = document.getElementById("contacts-badge");
        badge.textContent = newMsgs;
        badge.style.display = newMsgs > 0 ? "inline-block" : "none";
        showToast("Message deleted", "success");
      }

      function openContactDetail(id) {
        const c = allContacts.find((x) => x._id === id);
        if (!c) return;
        currentContactId = id;

        document.getElementById("contactModalBody").innerHTML = `
          <div class="detail-grid">
            <div class="detail-item"><label>Name</label><span>${c.name || "—"}</span></div>
            <div class="detail-item"><label>Email</label><a href="mailto:${c.email}" style="color:var(--gold);font-size:13px;">${c.email || "—"}</a></div>
            <div class="detail-full detail-item"><label>Subject</label><span>${c.subject || "—"}</span></div>
            <div class="detail-item"><label>Received</label><span>${fmt(c.createdAt)}</span></div>
            <div class="detail-item"><label>Status</label>${contactPill(c.status)}</div>
            <div class="detail-full detail-item">
              <label>Message</label>
              <div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:16px;font-size:13px;line-height:1.7;margin-top:4px;white-space:pre-wrap;">${c.message || "—"}</div>
            </div>
          </div>
        `;
        openModal("contactModal");
      }

      document
        .getElementById("markRepliedBtn")
        .addEventListener("click", async () => {
          if (!currentContactId) return;
          try {
            await fetch(`${API}/contact/${currentContactId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "replied" }),
            });
          } catch (e) {}
          const idx = allContacts.findIndex((c) => c._id === currentContactId);
          if (idx > -1) allContacts[idx].status = "replied";
          renderContactsTable();
          loadContacts(true);
          closeModal("contactModal");
          showToast("Marked as replied", "success");
        });

      document
        .getElementById("deleteContactBtn")
        .addEventListener("click", async () => {
          if (!confirm("Delete this message?")) return;
          try {
            await fetch(`${API}/contact/${currentContactId}`, {
              method: "DELETE",
            });
          } catch (e) {}
          allContacts = allContacts.filter((c) => c._id !== currentContactId);
          renderContactsTable();
          loadContacts(true);
          closeModal("contactModal");
          showToast("Message deleted", "success");
        });

      document
        .getElementById("contacts-search")
        .addEventListener("input", renderContactsTable);

      // ─────────────────────────────────────────────
      // PRODUCTS
      // ─────────────────────────────────────────────
      function renderProductsTable() {
        document.getElementById("prod-count-label").textContent =
          state.products.length + " products";
        document.getElementById("dash-total-products").textContent =
          state.products.length;
        const tbody = document.getElementById("products-table-body");
        if (!state.products.length) {
          tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No products yet.</td></tr>`;
          return;
        }
        tbody.innerHTML = state.products
          .map(
            (p) => `
          <tr>
            <td>
              ${
                p.image
                  ? `<img src="${imgSrc(p.image)}" class="prod-thumb" alt="${p.name}" onerror="this.style.display='none'" />`
                  : `<div class="prod-thumb-placeholder"><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" opacity=".4"><rect x="3" y="3" width="18" height="18" rx="2"/></svg></div>`
              }
            </td>
            <td>
              <div style="font-weight:500;font-size:13px;">${p.name}</div>
              ${p.desc ? `<div style="font-size:11px;color:var(--muted);margin-top:2px;">${p.desc}</div>` : ""}
            </td>
            <td><span class="cat-chip">${p.category}</span></td>
            <td style="font-family:'Cormorant Garamond',serif;font-size:16px;color:var(--gold);">₹${p.price}</td>
            <td>${p.bogo ? '<span class="bogo-tag">BOGO</span>' : '<span style="color:var(--dim);font-size:11px;">—</span>'}</td>
            <td>
              <div style="display:flex;gap:6px;">
                <button type="button" class="btn btn-outline btn-sm btn-icon" title="Edit" data-action="edit" data-product-id="${p.id}">
                  <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button type="button" class="btn btn-danger btn-sm btn-icon" title="Delete" data-action="delete" data-product-id="${p.id}">
                  <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                </button>
              </div>
            </td>
          </tr>
        `,
          )
          .join("");
        // bind action handlers after DOM insertion
        if (typeof attachProductButtons === "function") attachProductButtons();
      }

      function populateCategoryDropdown() {
        const sel = document.getElementById("prodCategory");
        const cur = sel.value;
        sel.innerHTML =
          '<option value="">Select category</option>' +
          state.categories
            .map(
              (c) =>
                `<option value="${c}"${c === cur ? " selected" : ""}>${c}</option>`,
            )
            .join("");
      }

      document.getElementById("addProductBtn").addEventListener("click", () => {
        document.getElementById("productModalTitle").textContent =
          "Add Product";
        document.getElementById("editProductId").value = "";
        document.getElementById("prodName").value = "";
        document.getElementById("prodPrice").value = "";
        document.getElementById("prodDesc").value = "";
        document.getElementById("prodImageUrl").value = "";
        document.getElementById("prodBogo").checked = true;
        document.getElementById("prodImageFile").value = "";
        selectedProductImageFile = null;
        document.getElementById("imgUploadContent").innerHTML = `
          <div style="color:var(--muted);margin-bottom:8px;"><svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M4 16l4-4 4 4 4-8 4 8"/><rect x="3" y="3" width="18" height="18" rx="2"/></svg></div>
          <p>Click to upload image</p><span>PNG, JPG up to 5MB</span>`;
        populateCategoryDropdown();
        document.getElementById("prodCategory").value = "";
        openModal("productModal");
      });

      // Attach click handlers to product action buttons. We create a small helper
      // to (re)bind listeners after rendering so clicks on SVGs or nested elements
      // reliably trigger the action.
      function attachProductButtons() {
        const tbody = document.getElementById("products-table-body");
        tbody.querySelectorAll("button[data-action]").forEach((orig) => {
          // replace node with a clone to remove previous listeners
          const clone = orig.cloneNode(true);
          orig.parentNode.replaceChild(clone, orig);
        });
        tbody.querySelectorAll("button[data-action]").forEach((btn) => {
          btn.addEventListener("click", (e) => {
            const action = btn.getAttribute("data-action");
            const productId = btn.getAttribute("data-product-id");
            console.log("product button clicked:", {
              action,
              productId,
              target: e.target,
            });
            if (!productId) return;
            if (action === "edit") openEditProduct(productId);
            if (action === "delete") deleteProduct(productId);
          });
        });
      }

      // Safety-net delegation: also listen on tbody for clicks (handles SVG/inner element clicks)
      (function addTableFallback() {
        const tbody = document.getElementById("products-table-body");
        if (!tbody) return;
        tbody.addEventListener("click", (event) => {
          const btn =
            event.target.closest && event.target.closest("button[data-action]");
          if (!btn) return;
          const action = btn.getAttribute("data-action");
          const productId = btn.getAttribute("data-product-id");
          console.log("tbody fallback click:", {
            action,
            productId,
            clicked: event.target,
          });
          if (!productId) return;
          if (action === "edit") openEditProduct(productId);
          if (action === "delete") deleteProduct(productId);
        });
      })();

      function openEditProduct(id) {
        const p = state.products.find((x) => x.id == id || x._id == id);
        if (!p) return;
        // Clear previously selected file so editing doesn't reuse old selection
        selectedProductImageFile = null;
        document.getElementById("productModalTitle").textContent =
          "Edit Product";
        document.getElementById("editProductId").value = id;
        document.getElementById("prodName").value = p.name;
        document.getElementById("prodPrice").value = p.price;
        document.getElementById("prodDesc").value = p.desc || "";
        document.getElementById("prodImageUrl").value = p.image || "";
        document.getElementById("prodBogo").checked = p.bogo;
        populateCategoryDropdown();
        document.getElementById("prodCategory").value = p.category;
        document.getElementById("imgUploadContent").innerHTML = p.image
          ? `<img src="${imgSrc(p.image)}" class="img-preview" alt="preview" onerror="this.src=''" /><p style="font-size:11px;color:var(--muted);">Current image</p>`
          : `<div style="color:var(--muted);margin-bottom:8px;"><svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M4 16l4-4 4 4 4-8 4 8"/><rect x="3" y="3" width="18" height="18" rx="2"/></svg></div><p>Click to upload image</p><span>PNG, JPG up to 5MB</span>`;
        openModal("productModal");
      }

      let selectedProductImageFile = null; // store the actual file for upload

      document
        .getElementById("prodImageFile")
        .addEventListener("change", function () {
          const file = this.files[0];
          if (!file) return;
          selectedProductImageFile = file;
          const previewUrl = URL.createObjectURL(file);
          document.getElementById("prodImageUrl").value = ""; // clear URL input since file is selected
          document.getElementById("imgUploadContent").innerHTML =
            `<img src="${previewUrl}" class="img-preview" alt="preview" /><p style="font-size:11px;color:var(--muted);">Image selected</p>`;
        });

      document
        .getElementById("prodImageUrl")
        .addEventListener("input", function () {
          if (this.value)
            document.getElementById("imgUploadContent").innerHTML =
              `<img src="${this.value}" class="img-preview" alt="preview" onerror="this.src=''" /><p style="font-size:11px;color:var(--muted);">Image URL set</p>`;
        });

      document
        .getElementById("saveProductBtn")
        .addEventListener("click", async () => {
          const name = document.getElementById("prodName").value.trim();
          const category = document.getElementById("prodCategory").value;
          const price = parseFloat(document.getElementById("prodPrice").value);
          const imageUrl = document.getElementById("prodImageUrl").value.trim();
          const bogo = document.getElementById("prodBogo").checked;
          const desc = document.getElementById("prodDesc").value.trim();
          const editId = document.getElementById("editProductId").value;
          if (!name) {
            showToast("Product name is required", "error");
            return;
          }
          if (!category) {
            showToast("Please select a category", "error");
            return;
          }
          if (isNaN(price) || price < 0) {
            showToast("Enter a valid price", "error");
            return;
          }

          const token = localStorage.getItem("token");
          const formData = new FormData();
          formData.append("name", name);
          formData.append("price", price);
          formData.append("description", desc);
          formData.append("category", category);
          formData.append("bogo", bogo);

          // Attach actual file if selected, otherwise send image URL/path as text
          if (selectedProductImageFile) {
            formData.append("image", selectedProductImageFile);
          } else if (imageUrl) {
            formData.append("image", imageUrl);
          }

          if (editId) {
            const idx = state.products.findIndex(
              (p) => p.id == editId || p._id == editId,
            );
            if (idx > -1) {
              const product = state.products[idx];
              // Update in backend if product has MongoDB _id
              if (product._id) {
                try {
                  const res = await fetch(`${API}/products/${product._id}`, {
                    method: "PUT",
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData,
                  });
                  const data = await res.json();
                  if (res.ok && data.product) {
                    const refreshed = await refreshProductsState();
                    if (refreshed) {
                      selectedProductImageFile = null;
                      closeModal("productModal");
                      switchSection("products");
                      showToast("Product updated", "success");
                      return;
                    }
                  }

                  state.products[idx] = {
                    ...product,
                    name,
                    category,
                    price,
                    image: data?.product?.image || imageUrl || product.image,
                    bogo,
                    desc,
                  };
                } catch (e) {
                  console.error(e);
                  state.products[idx] = {
                    ...product,
                    name,
                    category,
                    price,
                    image: imageUrl || product.image,
                    bogo,
                    desc,
                  };
                }
              } else {
                // local-only product: preserve existing image if no new image/url provided
                state.products[idx] = {
                  ...product,
                  name,
                  category,
                  price,
                  image: imageUrl || product.image,
                  bogo,
                  desc,
                };
              }
            }
            selectedProductImageFile = null;
            saveState();
            renderProductsTable();
            closeModal("productModal");
            switchSection("products");
            showToast("Product updated", "success");
          } else {
            try {
              const response = await fetch(`${API}/products`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
              });

              const data = await response.json();

              if (response.ok) {
                const refreshed = await refreshProductsState();
                if (refreshed) {
                  closeModal("productModal");
                  switchSection("products");
                  showToast("Product added successfully", "success");
                  selectedProductImageFile = null;
                  return;
                }

                const savedImage = data.product?.image || imageUrl;
                const newProduct = {
                  id: nextId++,
                  _id: data.product?._id || null,
                  name,
                  category,
                  price,
                  image: savedImage,
                  bogo,
                  desc,
                };
                state.products.push(newProduct);
                saveState();
                renderProductsTable();
                closeModal("productModal");
                switchSection("products");
                showToast("Product added successfully", "success");
              } else {
                showToast(data.message || "Failed to add product", "error");
              }
            } catch (error) {
              console.error(error);
              // Backend unreachable — save product locally so admin can continue.
              const newProduct = {
                id: nextId++,
                _id: null,
                name,
                category,
                price,
                image: imageUrl || "",
                bogo,
                desc,
              };
              state.products.push(newProduct);
              saveState();
              renderProductsTable();
              closeModal("productModal");
              switchSection("products");
              showToast("Product added locally", "success");
            }
            selectedProductImageFile = null;
          }
        });

      async function deleteProduct(id) {
        // Optimistic UI: remove from local state immediately so admin sees instant feedback
        const product = state.products.find((p) => p.id == id || p._id == id);
        if (!product) return;
        // remove locally for instant feedback
        state.products = state.products.filter(
          (p) => p.id != id && p._id != id,
        );
        saveState();
        renderProductsTable();
        showToast("Deleting product...", "info");

        // If product exists in backend, attempt server deletion. If it fails, restore locally.
        if (product._id) {
          try {
            const token = localStorage.getItem("token");
            if (!token) {
              showToast("Not authorized. Please login.", "error");
              // restore
              state.products.push(product);
              saveState();
              renderProductsTable();
              return;
            }
            const res = await fetch(`${API}/products/${product._id}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
              const data = await res.json().catch(() => ({}));
              showToast(
                data.message || "Failed to delete product from server",
                "error",
              );
              // restore
              state.products.push(product);
              saveState();
              renderProductsTable();
              return;
            }

            const refreshed = await refreshProductsState();
            if (!refreshed) {
              showToast(
                "Product deleted locally, but could not refresh from server",
                "warning",
              );
              return;
            }

            showToast("Product deleted", "success");
            return;
          } catch (e) {
            console.error(e);
            showToast("Failed to delete product from server", "error");
            state.products.push(product);
            saveState();
            renderProductsTable();
            return;
          }
        }

        // local-only product: already removed
        showToast("Product deleted", "success");
      }

      document.getElementById("addCatBtn").addEventListener("click", () => {
        const val = document.getElementById("newCatInput").value.trim();
        if (!val) {
          showToast("Enter a category name", "error");
          return;
        }
        if (state.categories.includes(val)) {
          showToast("Category already exists", "error");
          return;
        }
        state.categories.push(val);
        saveState();
        document.getElementById("newCatInput").value = "";
        renderCatList();
        showToast("Category added", "success");
      });

      function openEditCat(oldName) {
        document.getElementById("editCatOldName").value = oldName;
        document.getElementById("editCatNewName").value = oldName;
        openModal("editCatModal");
      }

      document
        .getElementById("saveCatEditBtn")
        .addEventListener("click", () => {
          const oldName = document.getElementById("editCatOldName").value;
          const newName = document
            .getElementById("editCatNewName")
            .value.trim();
          if (!newName) {
            showToast("Category name cannot be empty", "error");
            return;
          }
          if (newName !== oldName && state.categories.includes(newName)) {
            showToast("Category already exists", "error");
            return;
          }
          const idx = state.categories.indexOf(oldName);
          if (idx > -1) state.categories[idx] = newName;
          state.products.forEach((p) => {
            if (p.category === oldName) p.category = newName;
          });
          saveState();
          closeModal("editCatModal");
          renderCatList();
          showToast("Category updated", "success");
        });

      function deleteCat(name) {
        const count = state.products.filter((p) => p.category === name).length;
        if (
          !confirm(
            count > 0
              ? `Delete "${name}"? ${count} product(s) will move to "Uncategorized".`
              : `Delete "${name}"?`,
          )
        )
          return;
        state.products.forEach((p) => {
          if (p.category === name) p.category = "Uncategorized";
        });
        if (!state.categories.includes("Uncategorized"))
          state.categories.push("Uncategorized");
        state.categories = state.categories.filter((c) => c !== name);
        saveState();
        renderCatList();
        showToast("Category deleted", "success");
      }

      // ─────────────────────────────────────────────
      // MODALS & TOAST
      // ─────────────────────────────────────────────
      function openModal(id) {
        document.getElementById(id).classList.add("open");
      }
      function closeModal(id) {
        document.getElementById(id).classList.remove("open");
      }
      document.querySelectorAll(".modal-overlay").forEach((o) =>
        o.addEventListener("click", (e) => {
          if (e.target === o) closeModal(o.id);
        }),
      );

      let toastTimer;
      function showToast(msg, type = "success") {
        const t = document.getElementById("toast");
        t.className = `toast ${type}`;
        document.getElementById("toast-msg").textContent = msg;
        clearTimeout(toastTimer);
        requestAnimationFrame(() => t.classList.add("show"));
        toastTimer = setTimeout(() => t.classList.remove("show"), 3000);
      }

      // LOGOUT
      document.getElementById("logoutBtn").addEventListener("click", () => {
        if (confirm("Are you sure you want to logout?")) {
          localStorage.removeItem("token");
          window.location.href = "adminLogin.html";
        }
      });

      // ─────────────────────────────────────────────
      // ABOUT LOGIC
      async function loadAbout() {
        try {
          const res = await fetch(`${API}/about`);
          if (!res.ok) throw new Error("Failed to load about data");
          const data = await res.json();
          document.getElementById('aboutContentInput').value = data.content || '';
          document.getElementById('aboutVideoInput').value = data.videoUrl || '';
        } catch (err) {
          showToast(err.message, "error");
        }
      }

      async function saveAbout() {
        const content = document.getElementById('aboutContentInput').value;
        const videoUrl = document.getElementById('aboutVideoInput').value;
        try {
          const res = await fetch(`${API}/about`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ content, videoUrl })
          });
          if (!res.ok) throw new Error("Failed to save about data");
          showToast("About page updated successfully", "success");
        } catch (err) {
          showToast(err.message, "error");
        }
      }

      async function uploadAboutVideo() {
        const fileInput = document.getElementById('aboutVideoUpload');
        const file = fileInput.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('video', file);

        try {
          showToast("Uploading video...", "info");
          const res = await fetch(`${API}/about/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
          });
          
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || "Upload failed");
          
          document.getElementById('aboutVideoInput').value = data.fileUrl;
          showToast("Video uploaded successfully", "success");
        } catch (err) {
          showToast(err.message, "error");
        } finally {
          fileInput.value = '';
        }
      }

      // INIT
      // ─────────────────────────────────────────────
      const _lastSection =
        sessionStorage.getItem("fa_active_section") || "dashboard";
      // attempt backend sync (async) so admin view reflects DB/frontend
      syncProductsFromBackend();
      switchSection(_lastSection);
    