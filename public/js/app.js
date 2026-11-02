/**
 * Product Management System - Client Application
 * Handles API communication, DOM updates, form validation, and notifications.
 */

// Application State
const state = {
  products: [],
  filteredProducts: [],
  selectedProductId: null,
};

// DOM Elements Cache
const DOM = {
  // Navigation / Health
  apiStatusBadge: document.getElementById('apiStatusBadge'),

  // KPIs
  kpiTotalProducts: document.getElementById('kpiTotalProducts'),
  kpiLowStock: document.getElementById('kpiLowStock'),
  kpiTotalValue: document.getElementById('kpiTotalValue'),

  // Search & Filter
  searchInput: document.getElementById('searchInput'),
  categoryFilter: document.getElementById('categoryFilter'),
  btnResetFilters: document.getElementById('btnResetFilters'),

  // Table & States
  productTable: document.getElementById('productTable'),
  productTableBody: document.getElementById('productTableBody'),
  loadingState: document.getElementById('loadingState'),
  emptyState: document.getElementById('emptyState'),
  productCountBadge: document.getElementById('productCountBadge'),

  // Modal & Form Elements
  btnOpenAddModal: document.getElementById('btnOpenAddModal'),
  btnEmptyStateAdd: document.getElementById('btnEmptyStateAdd'),
  productModalEl: document.getElementById('productModal'),
  productModalLabel: document.getElementById('productModalLabel'),
  productForm: document.getElementById('productForm'),
  productId: document.getElementById('productId'),
  productName: document.getElementById('productName'),
  category: document.getElementById('category'),
  price: document.getElementById('price'),
  quantity: document.getElementById('quantity'),
  description: document.getElementById('description'),
  btnSaveProduct: document.getElementById('btnSaveProduct'),
  saveSpinner: document.getElementById('saveSpinner'),
  saveBtnText: document.getElementById('saveBtnText'),

  // Delete Modal
  deleteConfirmModalEl: document.getElementById('deleteConfirmModal'),
  deleteProductName: document.getElementById('deleteProductName'),
  btnConfirmDelete: document.getElementById('btnConfirmDelete'),
  deleteSpinner: document.getElementById('deleteSpinner'),

  // Toast
  toastEl: document.getElementById('liveToast'),
  toastMessage: document.getElementById('toastMessage'),
};

// Bootstrap Modal & Toast Instances
let productModal;
let deleteConfirmModal;
let liveToast;

// ============================================================================
// Initialization
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Bootstrap component instances
  productModal = new bootstrap.Modal(DOM.productModalEl);
  deleteConfirmModal = new bootstrap.Modal(DOM.deleteConfirmModalEl);
  liveToast = new bootstrap.Toast(DOM.toastEl, { delay: 4000 });

  // Attach Event Listeners
  attachEventListeners();

  // Run initial checks and load data
  checkApiHealth();
  loadProducts();
});

/**
 * Registers all UI and user interaction events
 */
function attachEventListeners() {
  // Open Add Product Modal
  DOM.btnOpenAddModal.addEventListener('click', openAddModal);
  DOM.btnEmptyStateAdd.addEventListener('click', openAddModal);

  // Form submission (Create or Update)
  DOM.productForm.addEventListener('submit', handleFormSubmit);

  // Confirm Delete
  DOM.btnConfirmDelete.addEventListener('click', handleConfirmDelete);

  // Event delegation for table action buttons (Edit & Delete)
  DOM.productTableBody.addEventListener('click', handleTableActionClick);

  // Search and Filter input changes
  DOM.searchInput.addEventListener('input', applyFilters);
  DOM.categoryFilter.addEventListener('change', applyFilters);
  DOM.btnResetFilters.addEventListener('click', resetFilters);
}

// ============================================================================
// API Calls (Fetch API)
// ============================================================================

/**
 * 1. Health Check (GET /api/health)
 * Checks whether the Express backend and database are reachable
 */
async function checkApiHealth() {
  try {
    const res = await fetch('/api/health');
    const data = await res.json();

    if (res.ok && data.success) {
      DOM.apiStatusBadge.className = 'badge bg-success px-3 py-2 d-flex align-items-center gap-1';
      DOM.apiStatusBadge.innerHTML = '<i class="bi bi-check-circle-fill"></i><span>API Online</span>';
    } else {
      throw new Error(data.message || 'API responded with error');
    }
  } catch (err) {
    DOM.apiStatusBadge.className = 'badge bg-danger px-3 py-2 d-flex align-items-center gap-1';
    DOM.apiStatusBadge.innerHTML = '<i class="bi bi-x-circle-fill"></i><span>API Offline</span>';
  }
}

/**
 * 2. Fetch All Products (GET /api/products)
 * Retrieves products list from MongoDB and updates dashboard
 */
async function loadProducts() {
  showLoading(true);

  try {
    const res = await fetch('/api/products');
    const data = await res.json();

    if (res.ok && data.success) {
      state.products = data.data || [];
      populateCategoryDropdown();
      applyFilters();
      updateSummaryCards();
    } else {
      throw new Error(data.message || 'Failed to load products');
    }
  } catch (err) {
    showToast(`Error fetching products: ${err.message}`, 'danger');
    renderTable([]);
  } finally {
    showLoading(false);
  }
}

/**
 * 3. Handle Product Form Submit (POST /api/products or PUT /api/products/:id)
 */
async function handleFormSubmit(e) {
  e.preventDefault();

  // Client-side validation check
  if (!validateForm()) {
    return;
  }

  const id = DOM.productId.value.trim();
  const isEditing = Boolean(id);

  // Construct payload
  const payload = {
    productName: DOM.productName.value.trim(),
    category: DOM.category.value.trim(),
    price: parseFloat(DOM.price.value),
    quantity: parseInt(DOM.quantity.value, 10),
    description: DOM.description.value.trim(),
  };

  // Toggle button saving spinner
  toggleSaveLoading(true);

  try {
    const url = isEditing ? `/api/products/${id}` : '/api/products';
    const method = isEditing ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to save product');
    }

    // Success feedback
    productModal.hide();
    showToast(data.message || 'Product saved successfully!', 'success');

    // Reload products to refresh list and statistics
    await loadProducts();
  } catch (err) {
    showToast(err.message, 'danger');
  } finally {
    toggleSaveLoading(false);
  }
}

/**
 * 4. Handle Delete Confirmation (DELETE /api/products/:id)
 */
async function handleConfirmDelete() {
  if (!state.selectedProductId) return;

  toggleDeleteLoading(true);

  try {
    const res = await fetch(`/api/products/${state.selectedProductId}`, {
      method: 'DELETE',
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to delete product');
    }

    deleteConfirmModal.hide();
    showToast(data.message || 'Product deleted successfully', 'success');

    // Reload products to refresh list and statistics
    await loadProducts();
  } catch (err) {
    showToast(err.message, 'danger');
  } finally {
    toggleDeleteLoading(false);
    state.selectedProductId = null;
  }
}

// ============================================================================
// UI Renderers & Helpers
// ============================================================================

/**
 * Updates Summary KPI cards based on live products array
 */
function updateSummaryCards() {
  const total = state.products.length;

  // Low stock condition: quantity <= 5 and quantity > 0
  const lowStock = state.products.filter(
    (p) => p.quantity <= 5 && p.quantity > 0
  ).length;

  // Total Inventory Value: sum of (price * quantity)
  const totalValue = state.products.reduce((acc, p) => {
    return acc + (Number(p.price) || 0) * (Number(p.quantity) || 0);
  }, 0);

  DOM.kpiTotalProducts.textContent = total;
  DOM.kpiLowStock.textContent = lowStock;
  DOM.kpiTotalValue.textContent = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(totalValue);
}

/**
 * Filters the product list based on search text and category dropdown
 */
function applyFilters() {
  const query = DOM.searchInput.value.trim().toLowerCase();
  const selectedCategory = DOM.categoryFilter.value.trim();

  state.filteredProducts = state.products.filter((product) => {
    const matchesQuery =
      product.productName.toLowerCase().includes(query) ||
      (product.description && product.description.toLowerCase().includes(query));

    const matchesCategory =
      !selectedCategory || product.category === selectedCategory;

    return matchesQuery && matchesCategory;
  });

  renderTable(state.filteredProducts);
}

/**
 * Resets search query and category filters
 */
function resetFilters() {
  DOM.searchInput.value = '';
  DOM.categoryFilter.value = '';
  applyFilters();
}

/**
 * Populates unique categories into category filter dropdown
 */
function populateCategoryDropdown() {
  const currentSelection = DOM.categoryFilter.value;
  const categories = [...new Set(state.products.map((p) => p.category).filter(Boolean))].sort();

  DOM.categoryFilter.innerHTML = '<option value="">All Categories</option>';
  categories.forEach((cat) => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    if (cat === currentSelection) opt.selected = true;
    DOM.categoryFilter.appendChild(opt);
  });
}

/**
 * Renders products into the table body
 */
function renderTable(products) {
  DOM.productCountBadge.textContent = `${products.length} item${products.length === 1 ? '' : 's'}`;

  if (products.length === 0) {
    DOM.productTable.classList.add('d-none');
    DOM.emptyState.classList.remove('d-none');
    DOM.productTableBody.innerHTML = '';
    return;
  }

  DOM.emptyState.classList.add('d-none');
  DOM.productTable.classList.remove('d-none');

  DOM.productTableBody.innerHTML = products
    .map((product) => {
      const priceFormatted = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
      }).format(product.price);

      // Stock status badge calculation
      let stockBadge = '';
      if (product.quantity === 0) {
        stockBadge = '<span class="badge bg-danger badge-stock"><i class="bi bi-x-circle me-1"></i>Out of Stock</span>';
      } else if (product.quantity <= 5) {
        stockBadge = '<span class="badge bg-warning text-dark badge-stock"><i class="bi bi-exclamation-circle me-1"></i>Low Stock</span>';
      } else {
        stockBadge = '<span class="badge bg-success badge-stock"><i class="bi bi-check-circle me-1"></i>In Stock</span>';
      }

      return `
        <tr>
          <td class="ps-3">
            <div class="fw-semibold text-dark">${escapeHtml(product.productName)}</div>
            ${
              product.description
                ? `<small class="text-muted d-block text-truncate" style="max-width: 280px;" title="${escapeHtml(product.description)}">${escapeHtml(product.description)}</small>`
                : ''
            }
          </td>
          <td>
            <span class="badge bg-light text-secondary border">${escapeHtml(product.category)}</span>
          </td>
          <td class="fw-medium text-dark">${priceFormatted}</td>
          <td>
            <span class="fw-semibold">${product.quantity}</span>
          </td>
          <td>${stockBadge}</td>
          <td class="text-end pe-3">
            <button class="btn btn-sm btn-outline-primary btn-action me-1" data-action="edit" data-id="${product._id}" title="Edit Product">
              <i class="bi bi-pencil-square pointer-events-none"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger btn-action" data-action="delete" data-id="${product._id}" data-name="${escapeHtml(product.productName)}" title="Delete Product">
              <i class="bi bi-trash pointer-events-none"></i>
            </button>
          </td>
        </tr>
      `;
    })
    .join('');
}

// ============================================================================
// Modal Actions
// ============================================================================

/**
 * Opens Modal in "Add New Product" mode
 */
function openAddModal() {
  DOM.productForm.reset();
  DOM.productId.value = '';
  DOM.productModalLabel.innerHTML = '<i class="bi bi-plus-circle me-2"></i>Add New Product';
  DOM.saveBtnText.textContent = 'Save Product';
  clearFormValidation();
  productModal.show();
}

/**
 * Event delegation handler for table action buttons (Edit and Delete)
 */
function handleTableActionClick(e) {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;

  const action = btn.dataset.action;
  const id = btn.dataset.id;

  if (action === 'edit') {
    openEditModal(id);
  } else if (action === 'delete') {
    const name = btn.dataset.name || 'this product';
    openDeleteModal(id, name);
  }
}

/**
 * Opens Modal in "Edit Product" mode and populates existing data
 */
function openEditModal(id) {
  const product = state.products.find((p) => p._id === id);
  if (!product) return;

  DOM.productForm.reset();
  clearFormValidation();

  DOM.productId.value = product._id;
  DOM.productName.value = product.productName;
  DOM.category.value = product.category;
  DOM.price.value = product.price;
  DOM.quantity.value = product.quantity;
  DOM.description.value = product.description || '';

  DOM.productModalLabel.innerHTML = '<i class="bi bi-pencil-square me-2"></i>Edit Product';
  DOM.saveBtnText.textContent = 'Update Product';

  productModal.show();
}

/**
 * Opens Delete Confirmation Modal
 */
function openDeleteModal(id, name) {
  state.selectedProductId = id;
  DOM.deleteProductName.textContent = name;
  deleteConfirmModal.show();
}

// ============================================================================
// Validation & State Helpers
// ============================================================================

/**
 * Client-side validation ensuring inputs comply with business rules
 */
function validateForm() {
  let isValid = true;

  const nameVal = DOM.productName.value.trim();
  const catVal = DOM.category.value.trim();
  const priceVal = parseFloat(DOM.price.value);
  const qtyVal = Number(DOM.quantity.value);

  // Validate Name
  if (!nameVal) {
    markInvalid(DOM.productName);
    isValid = false;
  } else {
    markValid(DOM.productName);
  }

  // Validate Category
  if (!catVal) {
    markInvalid(DOM.category);
    isValid = false;
  } else {
    markValid(DOM.category);
  }

  // Validate Price (must be > 0)
  if (isNaN(priceVal) || priceVal < 0.01) {
    markInvalid(DOM.price);
    isValid = false;
  } else {
    markValid(DOM.price);
  }

  // Validate Quantity (must be integer >= 0)
  if (isNaN(qtyVal) || qtyVal < 0 || !Number.isInteger(qtyVal)) {
    markInvalid(DOM.quantity);
    isValid = false;
  } else {
    markValid(DOM.quantity);
  }

  return isValid;
}

function markInvalid(element) {
  element.classList.add('is-invalid');
  element.classList.remove('is-valid');
}

function markValid(element) {
  element.classList.remove('is-invalid');
  element.classList.add('is-valid');
}

function clearFormValidation() {
  [DOM.productName, DOM.category, DOM.price, DOM.quantity, DOM.description].forEach((el) => {
    el.classList.remove('is-invalid', 'is-valid');
  });
}

function showLoading(isLoading) {
  if (isLoading) {
    DOM.loadingState.classList.remove('d-none');
    DOM.productTable.classList.add('d-none');
    DOM.emptyState.classList.add('d-none');
  } else {
    DOM.loadingState.classList.add('d-none');
  }
}

function toggleSaveLoading(isLoading) {
  DOM.btnSaveProduct.disabled = isLoading;
  if (isLoading) {
    DOM.saveSpinner.classList.remove('d-none');
    DOM.saveBtnText.textContent = 'Saving...';
  } else {
    DOM.saveSpinner.classList.add('d-none');
    DOM.saveBtnText.textContent = DOM.productId.value ? 'Update Product' : 'Save Product';
  }
}

function toggleDeleteLoading(isLoading) {
  DOM.btnConfirmDelete.disabled = isLoading;
  if (isLoading) {
    DOM.deleteSpinner.classList.remove('d-none');
  } else {
    DOM.deleteSpinner.classList.add('d-none');
  }
}

/**
 * Displays Bootstrap Toast notification
 * @param {string} message - Notification text
 * @param {'success'|'danger'|'warning'|'info'} type - Toast type
 */
function showToast(message, type = 'success') {
  DOM.toastEl.className = `toast align-items-center text-white border-0 shadow-lg bg-${type}`;

  let icon = 'bi-check-circle-fill';
  if (type === 'danger') icon = 'bi-x-octagon-fill';
  if (type === 'warning') icon = 'bi-exclamation-triangle-fill';

  DOM.toastMessage.innerHTML = `<i class="bi ${icon} fs-5"></i><span>${escapeHtml(message)}</span>`;
  liveToast.show();
}

/**
 * Escapes unsafe characters for HTML rendering
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Escapes strings passed into inline JavaScript handlers
 */
function escapeJsString(str) {
  if (!str) return '';
  return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

