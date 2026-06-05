import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  inMemoryPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD5tgCJHw05YCQKjRKlIeJeknzygmlchOM",
  authDomain: "cf-manager-8e266.firebaseapp.com",
  projectId: "cf-manager-8e266",
  storageBucket: "cf-manager-8e266.firebasestorage.app",
  messagingSenderId: "996357465758",
  appId: "1:996357465758:web:f17323d5ad96ce7c3f3d8f",
};

const ALLOWED_ADMIN_EMAILS = new Set([
  "noah@cityfuel.co.za",
]);

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
await setPersistence(auth, inMemoryPersistence);

const yearEl = document.getElementById("admin-year");
const adminShell = document.getElementById("admin-shell");
const loginForm = document.getElementById("admin-login-form");
const loginStatusEl = document.getElementById("admin-login-status");
const workspace = document.getElementById("admin-workspace");
const workspaceEyebrow = document.getElementById("workspace-eyebrow");
const workspaceTitle = document.getElementById("workspace-title");
const userPill = document.getElementById("admin-user-pill");
const signOutButton = document.getElementById("admin-signout");
const tabButtons = document.querySelectorAll("[data-admin-tab]");
const tabPanels = document.querySelectorAll("[data-admin-panel]");
const productSubtabButtons = document.querySelectorAll("[data-products-subtab]");
const productSubpanels = document.querySelectorAll("[data-products-subpanel]");
const openProductFormButton = document.getElementById("open-product-form");
const productFormModal = document.getElementById("product-form-modal");
const productForm = document.getElementById("product-form");
const productFormTitle = document.getElementById("product-form-title");
const productFormStatusEl = document.getElementById("product-form-status");
const productSubmitButton = document.getElementById("product-submit");
const productTagsInput = document.getElementById("product-tags");
const quickAddCategoryButton = document.getElementById("quick-add-category");
const productActiveInput = document.getElementById("product-active");
const productActiveLabel = document.getElementById("product-active-label");
const productImageInput = document.getElementById("product-image-file");
const productImageDropzone = document.getElementById("product-image-dropzone");
const productImagePreview = document.getElementById("product-image-preview");
const productList = document.getElementById("product-list");
const productCount = document.getElementById("product-count");
const productSearch = document.getElementById("product-search");
const selectAllProductsCheckbox = document.getElementById("select-all-products");
const selectedProductCount = document.getElementById("selected-product-count");
const exportSelectedProductsButton = document.getElementById("export-selected-products");
const requestDeleteSelectedProductsButton = document.getElementById("request-delete-selected-products");
const confirmDeleteSelectedProductsButton = document.getElementById("confirm-delete-selected-products");
const openProductImportButton = document.getElementById("open-product-import");
const productImportModal = document.getElementById("product-import-modal");
const downloadProductTemplateButton = document.getElementById("download-product-template");
const productCsvInput = document.getElementById("product-csv-input");
const productCsvDropzone = document.getElementById("product-csv-dropzone");
const productCsvStatusEl = document.getElementById("product-csv-status");
const categoryForm = document.getElementById("category-form");
const categoryIdInput = document.getElementById("category-id");
const categoryNameInput = document.getElementById("category-name");
const categorySubmitButton = document.getElementById("category-submit");
const categoryCancelEditButton = document.getElementById("category-cancel-edit");
const categoryStatusEl = document.getElementById("category-status");
const categoryList = document.getElementById("category-list");
const categoryCount = document.getElementById("category-count");
const quickCategoryModal = document.getElementById("quick-category-modal");
const quickCategoryForm = document.getElementById("quick-category-form");
const quickCategoryNameInput = document.getElementById("quick-category-name");
const quickCategoryStatusEl = document.getElementById("quick-category-status");
const carouselImageInput = document.getElementById("carousel-image-input");
const carouselImageDropzone = document.getElementById("carousel-image-dropzone");
const carouselStatusEl = document.getElementById("carousel-status");
const carouselImageList = document.getElementById("carousel-image-list");
const carouselCount = document.getElementById("carousel-count");

const productsRef = collection(db, "rushBeautyProducts");
const categoriesRef = collection(db, "rushBeautyCategories");
const carouselRef = collection(db, "rushBeautySocialCarousel");
let products = [];
let categories = [];
let carouselImages = [];
let unsubscribeProducts = null;
let unsubscribeCategories = null;
let unsubscribeCarousel = null;
let selectedProductIds = new Set();

const TAB_META = {
  products: {
    eyebrow: "Catalog",
    title: "Product Management",
  },
  marketing: {
    eyebrow: "Campaigns",
    title: "Marketing",
  },
  imports: {
    eyebrow: "Operations",
    title: "Imports",
  },
};

if (yearEl) yearEl.textContent = new Date().getFullYear();
switchAdminTab("products");
switchProductsSubtab("products");

function setStatus(el, message, type = "") {
  if (!el) return;
  el.textContent = message;
  el.classList.toggle("is-error", type === "error");
  el.classList.toggle("is-success", type === "success");
}

function lockWorkspace() {
  adminShell?.classList.add("is-login-mode");
  adminShell?.classList.remove("is-console-mode");
  workspace?.classList.add("is-hidden");
  workspace?.setAttribute("aria-hidden", "true");
  if (userPill) userPill.textContent = "Locked";
  stopProductWatcher();
  stopCategoryWatcher();
  stopCarouselWatcher();
  resetProductForm();
  resetCategoryForm();
}

function unlockWorkspace(user) {
  adminShell?.classList.remove("is-login-mode");
  adminShell?.classList.add("is-console-mode");
  workspace?.classList.remove("is-hidden");
  workspace?.setAttribute("aria-hidden", "false");
  if (userPill) userPill.textContent = user.email || "Admin";
  startCategoryWatcher();
  startProductWatcher();
  startCarouselWatcher();
}

function isAllowedAdmin(user) {
  return ALLOWED_ADMIN_EMAILS.has((user?.email || "").toLowerCase());
}

async function requireAdminUser(user) {
  if (!user) {
    lockWorkspace();
    return false;
  }

  if (!isAllowedAdmin(user)) {
    await signOut(auth);
    setStatus(loginStatusEl, "This account is not approved for Rush Hour Beauty admin access.", "error");
    return false;
  }

  unlockWorkspace(user);
  setStatus(loginStatusEl, "Signed in.", "success");
  return true;
}

onAuthStateChanged(auth, (user) => {
  if (!user) lockWorkspace();
});

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  lockWorkspace();
  setStatus(loginStatusEl, "Checking credentials...");

  const formData = new FormData(loginForm);
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  try {
    const credentials = await signInWithEmailAndPassword(auth, email, password);
    await requireAdminUser(credentials.user);
  } catch (error) {
    setStatus(loginStatusEl, friendlyAuthError(error), "error");
  }
});

signOutButton?.addEventListener("click", async () => {
  await signOut(auth);
  loginForm?.reset();
  lockWorkspace();
  setStatus(loginStatusEl, "Signed out.");
});

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    switchAdminTab(button.getAttribute("data-admin-tab") || "products");
  });
});

productSubtabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    switchProductsSubtab(button.getAttribute("data-products-subtab") || "products");
  });
});

productForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus(productFormStatusEl, "Saving product...");

  const id = document.getElementById("product-id")?.value || "";
  const payload = productPayloadFromForm();

  try {
    if (id) {
      await updateDoc(doc(db, "rushBeautyProducts", id), {
        ...payload,
        updatedAt: serverTimestamp(),
      });
      await saveTagsForProducts([payload]);
      setStatus(productFormStatusEl, "Product updated.", "success");
    } else {
      await setDoc(doc(db, "rushBeautyProducts", skuToDocId(payload.sku)), {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, {
        merge: true,
      });
      await saveTagsForProducts([payload]);
      setStatus(productFormStatusEl, "Product added.", "success");
    }

    resetProductForm();
    closeProductFormModal(false);
  } catch (error) {
    setStatus(productFormStatusEl, error?.message || "Unable to save product.", "error");
  }
});

categoryForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  await saveCategoryFromForm();
});

categoryCancelEditButton?.addEventListener("click", () => {
  resetCategoryForm();
  setStatus(categoryStatusEl, "Edit cancelled.");
});

categoryList?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-category-action]");
  if (!button) return;

  const id = button.getAttribute("data-category-id");
  const category = categories.find((item) => item.id === id);
  if (!id || !category) return;

  if (button.getAttribute("data-category-action") === "edit") {
    fillCategoryForm(category);
    return;
  }

  if (button.getAttribute("data-category-action") === "delete") {
    const usedByProducts = products.some((product) => productTags(product).includes(category.name));
    const message = usedByProducts
      ? `${category.name} is used by products. Delete it anyway? Existing products will keep the tag text.`
      : `Delete ${category.name}?`;

    if (!window.confirm(message)) return;

    try {
      await deleteDoc(doc(db, "rushBeautyCategories", id));
      setStatus(categoryStatusEl, "Tag deleted.", "success");
    } catch (error) {
      setStatus(categoryStatusEl, error?.message || "Unable to delete tag.", "error");
    }
  }
});

openProductFormButton?.addEventListener("click", () => {
  resetProductForm();
  openProductFormModal("new");
});

quickAddCategoryButton?.addEventListener("click", () => {
  openQuickCategoryModal();
});

quickCategoryForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  await saveQuickCategory();
});

document.addEventListener("click", (event) => {
  if (event.target.closest("[data-quick-category-close]")) {
    closeQuickCategoryModal();
  }
});

productSearch?.addEventListener("input", renderProducts);

productActiveInput?.addEventListener("change", () => {
  updateProductActiveLabel();
});

selectAllProductsCheckbox?.addEventListener("change", () => {
  const visibleIds = visibleProducts().map((product) => product.id);
  if (selectAllProductsCheckbox.checked) {
    visibleIds.forEach((id) => selectedProductIds.add(id));
  } else {
    visibleIds.forEach((id) => selectedProductIds.delete(id));
  }
  hideBulkDeleteConfirmation();
  renderProducts();
});

exportSelectedProductsButton?.addEventListener("click", () => {
  exportSelectedProductsCsv();
});

requestDeleteSelectedProductsButton?.addEventListener("click", () => {
  if (!selectedProductIds.size) return;
  confirmDeleteSelectedProductsButton?.classList.remove("is-hidden");
  setStatus(productFormStatusEl, `Confirm deletion of ${selectedProductIds.size} selected products.`, "error");
});

confirmDeleteSelectedProductsButton?.addEventListener("click", async () => {
  await deleteSelectedProducts();
});

document.addEventListener("click", (event) => {
  if (event.target.closest("[data-product-form-close]")) {
    closeProductFormModal();
  }
});

openProductImportButton?.addEventListener("click", () => {
  openProductImportModal();
});

document.addEventListener("click", (event) => {
  if (event.target.closest("[data-import-close]")) {
    closeProductImportModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeProductFormModal();
    closeProductImportModal();
    closeQuickCategoryModal();
  }
});

downloadProductTemplateButton?.addEventListener("click", () => {
  downloadProductCsvTemplate();
});

productCsvInput?.addEventListener("change", () => {
  handleProductCsvFile(productCsvInput.files?.[0]);
});

productCsvDropzone?.addEventListener("dragover", (event) => {
  event.preventDefault();
  productCsvDropzone.classList.add("is-dragging");
});

productCsvDropzone?.addEventListener("dragleave", () => {
  productCsvDropzone.classList.remove("is-dragging");
});

productCsvDropzone?.addEventListener("drop", (event) => {
  event.preventDefault();
  productCsvDropzone.classList.remove("is-dragging");
  handleProductCsvFile(event.dataTransfer?.files?.[0]);
});

productImageInput?.addEventListener("change", () => {
  handleProductImageFile(productImageInput.files?.[0]);
});

productImageDropzone?.addEventListener("dragover", (event) => {
  event.preventDefault();
  productImageDropzone.classList.add("is-dragging");
});

productImageDropzone?.addEventListener("dragleave", () => {
  productImageDropzone.classList.remove("is-dragging");
});

productImageDropzone?.addEventListener("drop", (event) => {
  event.preventDefault();
  productImageDropzone.classList.remove("is-dragging");
  handleProductImageFile(event.dataTransfer?.files?.[0]);
});

carouselImageInput?.addEventListener("change", () => {
  handleCarouselImageFiles(carouselImageInput.files);
});

carouselImageDropzone?.addEventListener("dragover", (event) => {
  event.preventDefault();
  carouselImageDropzone.classList.add("is-dragging");
});

carouselImageDropzone?.addEventListener("dragleave", () => {
  carouselImageDropzone.classList.remove("is-dragging");
});

carouselImageDropzone?.addEventListener("drop", (event) => {
  event.preventDefault();
  carouselImageDropzone.classList.remove("is-dragging");
  handleCarouselImageFiles(event.dataTransfer?.files);
});

carouselImageList?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-carousel-delete]");
  if (!button) return;

  const id = button.getAttribute("data-carousel-delete");
  const image = carouselImages.find((item) => item.id === id);
  if (!id || !image) return;

  if (!window.confirm("Delete this carousel image?")) return;

  try {
    await deleteDoc(doc(db, "rushBeautySocialCarousel", id));
    setStatus(carouselStatusEl, "Carousel image deleted.", "success");
  } catch (error) {
    setStatus(carouselStatusEl, error?.message || "Unable to delete carousel image.", "error");
  }
});

productList?.addEventListener("click", async (event) => {
  const checkbox = event.target.closest("[data-product-select]");
  if (checkbox) {
    const id = checkbox.getAttribute("data-product-id");
    if (id && checkbox.checked) selectedProductIds.add(id);
    if (id && !checkbox.checked) selectedProductIds.delete(id);
    hideBulkDeleteConfirmation();
    updateBulkActions();
    return;
  }

  const button = event.target.closest("[data-product-action]");
  if (!button) return;

  const id = button.getAttribute("data-product-id");
  const action = button.getAttribute("data-product-action");
  const product = products.find((item) => item.id === id);

  if (!id || !product) return;

  if (action === "edit") {
    fillProductForm(product);
    openProductFormModal("edit");
    return;
  }

  if (action === "delete") {
    const confirmed = window.confirm(`Delete ${product.name}?`);
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "rushBeautyProducts", id));
      selectedProductIds.delete(id);
      updateBulkActions();
      setStatus(productFormStatusEl, "Product deleted.", "success");
    } catch (error) {
      setStatus(productFormStatusEl, error?.message || "Unable to delete product.", "error");
    }
  }
});

function friendlyAuthError(error) {
  switch (error?.code) {
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Incorrect email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait and try again.";
    default:
      return error?.message || "Unable to sign in.";
  }
}

function switchAdminTab(tabName) {
  const target = TAB_META[tabName] ? tabName : "products";

  tabButtons.forEach((button) => {
    const isActive = button.getAttribute("data-admin-tab") === target;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
    button.setAttribute("tabindex", isActive ? "0" : "-1");
  });

  tabPanels.forEach((panel) => {
    panel.classList.toggle("is-hidden", panel.getAttribute("data-admin-panel") !== target);
  });

  if (workspaceEyebrow) workspaceEyebrow.textContent = TAB_META[target].eyebrow;
  if (workspaceTitle) workspaceTitle.textContent = TAB_META[target].title;
}

function switchProductsSubtab(tabName) {
  const target = tabName === "categories" ? "categories" : "products";

  productSubtabButtons.forEach((button) => {
    const isActive = button.getAttribute("data-products-subtab") === target;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
    button.setAttribute("tabindex", isActive ? "0" : "-1");
  });

  productSubpanels.forEach((panel) => {
    panel.classList.toggle("is-hidden", panel.getAttribute("data-products-subpanel") !== target);
  });
}

function openProductImportModal() {
  productImportModal?.classList.remove("is-hidden");
  downloadProductTemplateButton?.focus();
}

function openProductFormModal(mode = "new") {
  productFormModal?.classList.remove("is-hidden");
  if (productFormTitle) productFormTitle.textContent = mode === "edit" ? "Edit Product" : "New Product";
  if (productSubmitButton) productSubmitButton.textContent = mode === "edit" ? "Update product" : "Save product";
  document.getElementById("product-sku")?.focus();
}

function closeProductFormModal(restoreFocus = true) {
  if (productFormModal?.classList.contains("is-hidden")) return;
  productFormModal?.classList.add("is-hidden");
  if (restoreFocus) openProductFormButton?.focus();
}

function closeProductImportModal(restoreFocus = true) {
  if (productImportModal?.classList.contains("is-hidden")) return;
  productImportModal?.classList.add("is-hidden");
  if (restoreFocus) openProductImportButton?.focus();
}

function openQuickCategoryModal() {
  quickCategoryForm?.reset();
  setStatus(quickCategoryStatusEl, "");
  quickCategoryModal?.classList.remove("is-hidden");
  quickCategoryNameInput?.focus();
}

function closeQuickCategoryModal() {
  if (quickCategoryModal?.classList.contains("is-hidden")) return;
  quickCategoryModal?.classList.add("is-hidden");
  quickAddCategoryButton?.focus();
}

function downloadProductCsvTemplate() {
  const csv = "SKU,NAME,IMAGE URL,TAGS,BRAND,SEX,PRICE\r\n";
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "rush-hour-beauty-product-upload-template.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function handleProductCsvFile(file) {
  if (!file) return;

  const isCsv = file.name.toLowerCase().endsWith(".csv") || file.type === "text/csv";
  if (!isCsv) {
    setStatus(productCsvStatusEl, "Please upload a CSV file.", "error");
    if (productCsvInput) productCsvInput.value = "";
    return;
  }

  importProductCsv(file);
}

function handleProductImageFile(file) {
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    setStatus(productFormStatusEl, "Please upload an image file.", "error");
    if (productImageInput) productImageInput.value = "";
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    const imageUrl = String(reader.result || "");
    setValue("product-image-url", imageUrl);
    renderProductImagePreview(imageUrl);
    setStatus(productFormStatusEl, `${file.name} selected.`, "success");
  });
  reader.addEventListener("error", () => {
    setStatus(productFormStatusEl, "Unable to read this image.", "error");
  });
  reader.readAsDataURL(file);
}

async function handleCarouselImageFiles(fileList) {
  const files = [...(fileList || [])];
  if (!files.length) return;

  if (!auth.currentUser || !isAllowedAdmin(auth.currentUser)) {
    setStatus(carouselStatusEl, "Sign in as an approved admin before uploading carousel images.", "error");
    return;
  }

  const imageFiles = files.filter((file) => file.type.startsWith("image/"));
  if (!imageFiles.length) {
    setStatus(carouselStatusEl, "Please upload image files.", "error");
    if (carouselImageInput) carouselImageInput.value = "";
    return;
  }

  setStatus(carouselStatusEl, `Uploading ${imageFiles.length} carousel image${imageFiles.length === 1 ? "" : "s"}...`);

  try {
    for (const file of imageFiles) {
      await saveCarouselImageFile(file);
    }

    if (carouselImageInput) carouselImageInput.value = "";
    const skipped = files.length - imageFiles.length;
    const skippedText = skipped ? ` ${skipped} non-image file${skipped === 1 ? "" : "s"} skipped.` : "";
    setStatus(carouselStatusEl, `${imageFiles.length} carousel image${imageFiles.length === 1 ? "" : "s"} uploaded.${skippedText}`, "success");
  } catch (error) {
    setStatus(carouselStatusEl, error?.message || "Unable to upload carousel images.", "error");
  }
}

async function saveCarouselImageFile(file) {
  const imageUrl = await readFileAsDataUrl(file);
  const targetRef = doc(carouselRef);
  await setDoc(targetRef, {
    imageUrl,
    fileName: clean(file.name),
    isActive: true,
    sortOrder: Date.now(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      resolve(String(reader.result || ""));
    });
    reader.addEventListener("error", () => {
      reject(new Error(`Unable to read ${file.name}.`));
    });
    reader.readAsDataURL(file);
  });
}

function renderProductImagePreview(imageUrl) {
  if (!productImagePreview) return;

  if (!imageUrl) {
    productImagePreview.classList.add("is-hidden");
    productImagePreview.innerHTML = "";
    return;
  }

  productImagePreview.classList.remove("is-hidden");
  productImagePreview.innerHTML = `<img src="${escapeAttr(imageUrl)}" alt="Product image preview">`;
}

async function importProductCsv(file) {
  if (!auth.currentUser || !isAllowedAdmin(auth.currentUser)) {
    setStatus(productCsvStatusEl, "Sign in as an approved admin before importing products.", "error");
    return;
  }

  setStatus(productCsvStatusEl, `Reading ${file.name}...`);

  try {
    const csvText = await file.text();
    const rows = parseCsv(csvText);
    const importedProducts = productsFromCsvRows(rows);

    if (!importedProducts.length) {
      setStatus(productCsvStatusEl, "No product rows were found in this CSV.", "error");
      return;
    }

    await saveImportedProducts(importedProducts);
    setStatus(productCsvStatusEl, `${importedProducts.length} products imported.`, "success");
    if (productCsvInput) productCsvInput.value = "";
    switchAdminTab("products");
    setProductListMessage("Refreshing imported products...");
    restartProductWatcher();
    closeProductImportModal(false);
  } catch (error) {
    setStatus(productCsvStatusEl, error?.message || "Unable to import this CSV.", "error");
  }
}

function parseCsv(csvText) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i += 1) {
    const char = csvText[i];
    const next = csvText[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      if (row.some((value) => clean(value))) rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell);
  if (row.some((value) => clean(value))) rows.push(row);
  return rows;
}

function productsFromCsvRows(rows) {
  if (!rows.length) return [];

  const headers = rows[0].map((header) => clean(header).toUpperCase());
  const requiredHeaders = ["SKU", "NAME", "IMAGE URL", "TAGS", "PRICE"];
  const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));

  if (missingHeaders.length) {
    throw new Error(`Missing required CSV columns: ${missingHeaders.join(", ")}.`);
  }

  const columnIndex = Object.fromEntries(headers.map((header, index) => [header, index]));

  return rows.slice(1).map((row, index) => {
    const sku = clean(row[columnIndex.SKU]);
    const name = clean(row[columnIndex.NAME]);
    const tags = parseTags(row[columnIndex.TAGS]);
    const brand = columnIndex.BRAND === undefined ? "" : clean(row[columnIndex.BRAND]);
    const sex = columnIndex.SEX === undefined ? "" : normaliseSex(row[columnIndex.SEX], index + 2);
    const imageUrl = clean(row[columnIndex["IMAGE URL"]]);
    const price = moneyNumber(row[columnIndex.PRICE]);

    if (!sku || !name) {
      throw new Error(`Row ${index + 2} needs both SKU and NAME.`);
    }

    if (!Number.isFinite(price) || price <= 0) {
      throw new Error(`Row ${index + 2} needs a valid PRICE greater than 0.`);
    }

    return {
      sku,
      name,
      slug: slugify(name),
      tags,
      brand,
      sex,
      imageUrl,
      price,
      isActive: true,
      source: "csv-import",
      importedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
  });
}

async function saveImportedProducts(importedProducts) {
  const chunks = [];
  for (let i = 0; i < importedProducts.length; i += 450) {
    chunks.push(importedProducts.slice(i, i + 450));
  }

  for (const chunk of chunks) {
    const batch = writeBatch(db);
    const categoryNames = new Set(chunk.flatMap((product) => productTags(product)));

    chunk.forEach((product) => {
      const productRef = doc(db, "rushBeautyProducts", skuToDocId(product.sku));
      batch.set(productRef, product, { merge: true });
    });

    categoryNames.forEach((categoryName) => {
      const categoryRef = doc(db, "rushBeautyCategories", categoryDocId(categoryName));
      batch.set(categoryRef, {
        name: categoryName,
        slug: slugify(categoryName),
        updatedAt: serverTimestamp(),
      }, { merge: true });
    });

    await batch.commit();
  }
}

async function saveTagsForProducts(productItems) {
  const tagNames = new Set(productItems.flatMap((product) => productTags(product)));
  if (!tagNames.size) return;

  const batch = writeBatch(db);
  tagNames.forEach((tagName) => {
    batch.set(doc(db, "rushBeautyCategories", categoryDocId(tagName)), {
      name: tagName,
      slug: slugify(tagName),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  });
  await batch.commit();
}

function skuToDocId(sku) {
  return clean(sku)
    .replace(/[\/\\#?[\]]/g, "-")
    .replace(/\s+/g, "-")
    .slice(0, 140);
}

function categoryDocId(name) {
  return slugify(name).slice(0, 140) || "uncategorized";
}

function startProductWatcher() {
  if (unsubscribeProducts) return;

  setProductListMessage("Loading products...");
  unsubscribeProducts = onSnapshot(
    query(productsRef, orderBy("updatedAt", "desc")),
    (snapshot) => {
      products = snapshot.docs.map((productDoc) => ({
        id: productDoc.id,
        ...productDoc.data(),
      }));
      renderProducts();
    },
    (error) => {
      setProductListMessage(error?.message || "Unable to load products.");
    }
  );
}

function stopProductWatcher() {
  if (unsubscribeProducts) {
    unsubscribeProducts();
    unsubscribeProducts = null;
  }
  products = [];
  setProductListMessage("Sign in to manage products.");
}

function restartProductWatcher() {
  if (unsubscribeProducts) {
    unsubscribeProducts();
    unsubscribeProducts = null;
  }
  products = [];
  startProductWatcher();
}

function startCategoryWatcher() {
  if (unsubscribeCategories) return;

  setCategoryListMessage("Loading tags...");
  unsubscribeCategories = onSnapshot(
    query(categoriesRef, orderBy("name", "asc")),
    (snapshot) => {
      categories = snapshot.docs.map((categoryDoc) => ({
        id: categoryDoc.id,
        ...categoryDoc.data(),
      }));
      renderCategories();
    },
    (error) => {
      setCategoryListMessage(error?.message || "Unable to load tags.");
    }
  );
}

function stopCategoryWatcher() {
  if (unsubscribeCategories) {
    unsubscribeCategories();
    unsubscribeCategories = null;
  }
  categories = [];
  setCategoryListMessage("Sign in to manage tags.");
}

function startCarouselWatcher() {
  if (unsubscribeCarousel) return;

  setCarouselListMessage("Loading carousel images...");
  unsubscribeCarousel = onSnapshot(
    query(carouselRef, orderBy("sortOrder", "desc")),
    (snapshot) => {
      carouselImages = snapshot.docs.map((carouselDoc) => ({
        id: carouselDoc.id,
        ...carouselDoc.data(),
      }));
      renderCarouselImages();
    },
    (error) => {
      setCarouselListMessage(error?.message || "Unable to load carousel images.");
    }
  );
}

function stopCarouselWatcher() {
  if (unsubscribeCarousel) {
    unsubscribeCarousel();
    unsubscribeCarousel = null;
  }
  carouselImages = [];
  setCarouselListMessage("Sign in to manage carousel images.");
}

async function saveCategoryFromForm() {
  const id = categoryIdInput?.value || "";
  const name = clean(categoryNameInput?.value);

  if (!name) {
    setStatus(categoryStatusEl, "Enter a tag name.", "error");
    return;
  }

  try {
    const targetId = id || categoryDocId(name);
    await setDoc(doc(db, "rushBeautyCategories", targetId), {
      name,
      slug: slugify(name),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    setStatus(categoryStatusEl, id ? "Tag updated." : "Tag added.", "success");
    resetCategoryForm();
  } catch (error) {
    setStatus(categoryStatusEl, error?.message || "Unable to save tag.", "error");
  }
}

async function saveQuickCategory() {
  const name = clean(quickCategoryNameInput?.value);

  if (!name) {
    setStatus(quickCategoryStatusEl, "Enter a tag name.", "error");
    return;
  }

  try {
    await setDoc(doc(db, "rushBeautyCategories", categoryDocId(name)), {
      name,
      slug: slugify(name),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    appendProductTagValue(name);
    setStatus(productFormStatusEl, `${name} tag added.`, "success");
    closeQuickCategoryModal();
  } catch (error) {
    setStatus(quickCategoryStatusEl, error?.message || "Unable to create tag.", "error");
  }
}

function renderCategories() {
  if (!categoryList) return;

  if (categoryCount) {
    categoryCount.textContent = `${categories.length} tags`;
  }

  if (!categories.length) {
    setCategoryListMessage("No tags have been added yet.");
    return;
  }

  categoryList.innerHTML = categories.map((category) => `
    <article class="category-row">
      <strong>${escapeHtml(category.name || "Untitled tag")}</strong>
      <div class="category-actions">
        <button class="btn btn--ghost btn--small" type="button" data-category-action="edit" data-category-id="${escapeAttr(category.id)}">Edit</button>
        <button class="btn btn--ghost btn--small" type="button" data-category-action="delete" data-category-id="${escapeAttr(category.id)}">Delete</button>
      </div>
    </article>
  `).join("");
}

function renderCarouselImages() {
  if (!carouselImageList) return;

  if (carouselCount) {
    carouselCount.textContent = `${carouselImages.length} images`;
  }

  if (!carouselImages.length) {
    setCarouselListMessage("No carousel images have been uploaded yet.");
    return;
  }

  carouselImageList.innerHTML = carouselImages.map((image) => `
    <article class="carousel-admin-row">
      <img src="${escapeAttr(image.imageUrl)}" alt="${escapeAttr(image.fileName || "Carousel image")}">
      <div>
        <strong>${escapeHtml(image.fileName || "Carousel image")}</strong>
        <p>${image.isActive === false ? "Inactive" : "Active"}</p>
      </div>
      <button class="btn btn--ghost btn--small" type="button" data-carousel-delete="${escapeAttr(image.id)}">Delete</button>
    </article>
  `).join("");
}

function fillCategoryForm(category) {
  if (categoryIdInput) categoryIdInput.value = category.id;
  if (categoryNameInput) categoryNameInput.value = category.name || "";
  if (categorySubmitButton) categorySubmitButton.textContent = "Update tag";
  categoryCancelEditButton?.classList.remove("is-hidden");
  setStatus(categoryStatusEl, `Editing ${category.name}.`);
}

function resetCategoryForm() {
  categoryForm?.reset();
  if (categoryIdInput) categoryIdInput.value = "";
  if (categorySubmitButton) categorySubmitButton.textContent = "Save tag";
  categoryCancelEditButton?.classList.add("is-hidden");
}

function setCategoryListMessage(message) {
  if (categoryList) categoryList.innerHTML = `<p class="empty-state">${escapeHtml(message)}</p>`;
  if (categoryCount) categoryCount.textContent = `${categories.length} tags`;
}

function setCarouselListMessage(message) {
  if (carouselImageList) carouselImageList.innerHTML = `<p class="empty-state">${escapeHtml(message)}</p>`;
  if (carouselCount) carouselCount.textContent = `${carouselImages.length} images`;
}

function productPayloadFromForm() {
  const formData = new FormData(productForm);
  const name = clean(formData.get("name"));
  const price = moneyNumber(formData.get("price"));
  const sku = clean(formData.get("sku"));

  return {
    sku,
    name,
    slug: slugify(name),
    tags: parseTags(formData.get("tags")),
    brand: clean(formData.get("brand")),
    sex: normaliseSex(formData.get("sex")),
    price,
    imageUrl: clean(formData.get("imageUrl")),
    isActive: Boolean(formData.get("isActive")),
  };
}

function fillProductForm(product) {
  setValue("product-id", product.id);
  setValue("product-sku", product.sku);
  setValue("product-name", product.name);
  setValue("product-tags", productTags(product).join(", "));
  setValue("product-brand", product.brand);
  setValue("product-sex", product.sex);
  setValue("product-image-url", product.imageUrl);
  setValue("product-price", product.price ?? "");
  setChecked("product-active", product.isActive !== false);
  updateProductActiveLabel();
  renderProductImagePreview(product.imageUrl);

  if (productFormTitle) productFormTitle.textContent = "Edit Product";
  if (productSubmitButton) productSubmitButton.textContent = "Update product";
  setStatus(productFormStatusEl, `Editing ${product.name}.`);
}

function resetProductForm() {
  productForm?.reset();
  setValue("product-id", "");
  setValue("product-image-url", "");
  setValue("product-tags", "");
  setValue("product-brand", "");
  setValue("product-sex", "");
  if (productImageInput) productImageInput.value = "";
  setChecked("product-active", true);
  updateProductActiveLabel();
  renderProductImagePreview("");
  if (productFormTitle) productFormTitle.textContent = "New Product";
  if (productSubmitButton) productSubmitButton.textContent = "Save product";
  setStatus(productFormStatusEl, "");
}

function renderProducts() {
  if (!productList) return;

  const visibleProductItems = visibleProducts();

  if (productCount) {
    const total = products.length;
    const shown = visibleProductItems.length;
    const term = clean(productSearch?.value).toLowerCase();
    productCount.textContent = term ? `${shown} of ${total} products` : `${total} products`;
  }

  if (!visibleProductItems.length) {
    setProductListMessage(products.length ? "No products match that search." : "No products have been added yet.");
    return;
  }

  productList.innerHTML = visibleProductItems.map(productCardHtml).join("");
  updateBulkActions();
}

function productCardHtml(product) {
  const image = product.imageUrl
    ? `<img src="${escapeAttr(product.imageUrl)}" alt="${escapeAttr(product.name)}">`
    : `<span>${escapeHtml(initials(product.name))}</span>`;
  const badges = [
    product.isActive === false ? "Inactive" : "Active",
    product.sex ? product.sex : "",
    ...productTags(product).slice(0, 3),
  ].filter(Boolean);

  return `
    <article class="product-card">
      <input class="product-select" type="checkbox" aria-label="Select ${escapeAttr(product.name || "product")}" data-product-select data-product-id="${escapeAttr(product.id)}" ${selectedProductIds.has(product.id) ? "checked" : ""}>
      <div class="product-thumb">${image}</div>
      <div class="product-meta">
        <h4>${escapeHtml(product.name || "Untitled product")}</h4>
        <p>${escapeHtml([product.brand, product.sex, productTags(product).join(", "), product.sku].filter(Boolean).join(" | ") || "No product details")}</p>
        <div class="product-price-line">
          <strong>${formatMoney(product.price)}</strong>
          ${product.salePrice ? `<span>Sale ${formatMoney(product.salePrice)}</span>` : ""}
        </div>
        <div class="product-badges">
          ${badges.map((badge) => `<span class="badge">${escapeHtml(badge)}</span>`).join("")}
        </div>
      </div>
      <div class="product-actions">
        <button class="btn btn--ghost btn--small" type="button" data-product-action="edit" data-product-id="${escapeAttr(product.id)}">Edit</button>
        <button class="btn btn--ghost btn--small" type="button" data-product-action="delete" data-product-id="${escapeAttr(product.id)}">Delete</button>
      </div>
    </article>
  `;
}

function setProductListMessage(message) {
  if (productList) productList.innerHTML = `<p class="empty-state">${escapeHtml(message)}</p>`;
  if (productCount) productCount.textContent = `${products.length} products`;
  updateBulkActions();
}

function visibleProducts() {
  const term = clean(productSearch?.value).toLowerCase();
  return products.filter((product) => {
    const haystack = [
      product.name,
      product.brand,
      product.sex,
      productTags(product).join(" "),
      product.sku,
    ].join(" ").toLowerCase();
    return haystack.includes(term);
  });
}

function updateBulkActions() {
  selectedProductIds = new Set([...selectedProductIds].filter((id) => products.some((product) => product.id === id)));
  const count = selectedProductIds.size;
  const visibleIds = visibleProducts().map((product) => product.id);
  const visibleSelectedCount = visibleIds.filter((id) => selectedProductIds.has(id)).length;

  if (selectedProductCount) selectedProductCount.textContent = `${count} selected`;
  if (exportSelectedProductsButton) exportSelectedProductsButton.disabled = count === 0;
  if (requestDeleteSelectedProductsButton) requestDeleteSelectedProductsButton.disabled = count === 0;

  if (selectAllProductsCheckbox) {
    selectAllProductsCheckbox.checked = Boolean(visibleIds.length && visibleSelectedCount === visibleIds.length);
    selectAllProductsCheckbox.indeterminate = visibleSelectedCount > 0 && visibleSelectedCount < visibleIds.length;
  }

  if (!count) hideBulkDeleteConfirmation();
}

function hideBulkDeleteConfirmation() {
  confirmDeleteSelectedProductsButton?.classList.add("is-hidden");
}

function selectedProducts() {
  return products.filter((product) => selectedProductIds.has(product.id));
}

function exportSelectedProductsCsv() {
  const selected = selectedProducts();
  if (!selected.length) return;

  const rows = [
    ["SKU", "NAME", "IMAGE URL", "TAGS", "BRAND", "SEX", "PRICE"],
    ...selected.map((product) => [
      product.sku || product.id,
      product.name || "",
      product.imageUrl || "",
      productTags(product).join(","),
      product.brand || "",
      product.sex || "",
      moneyNumber(product.price).toFixed(2),
    ]),
  ];

  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "rush-hour-beauty-selected-products.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function deleteSelectedProducts() {
  const ids = [...selectedProductIds];
  if (!ids.length) return;

  try {
    for (let i = 0; i < ids.length; i += 450) {
      const batch = writeBatch(db);
      ids.slice(i, i + 450).forEach((id) => {
        batch.delete(doc(db, "rushBeautyProducts", id));
      });
      await batch.commit();
    }

    selectedProductIds.clear();
    hideBulkDeleteConfirmation();
    updateBulkActions();
    setStatus(productFormStatusEl, `${ids.length} products deleted.`, "success");
  } catch (error) {
    setStatus(productFormStatusEl, error?.message || "Unable to delete selected products.", "error");
  }
}

function csvCell(value) {
  const text = clean(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function parseTags(value) {
  if (Array.isArray(value)) {
    return [...new Set(value.map(clean).filter(Boolean))];
  }

  return [...new Set(clean(value)
    .split(",")
    .map(clean)
    .filter(Boolean))];
}

function productTags(product) {
  const tags = parseTags(product?.tags);
  return tags.length ? tags : parseTags(product?.category);
}

function normaliseSex(value, rowNumber = null) {
  const text = clean(value);
  if (!text) return "";
  const match = ["Male", "Female"].find((option) => option.toLowerCase() === text.toLowerCase());
  if (match) return match;
  if (rowNumber) throw new Error(`Row ${rowNumber} has an invalid SEX. Use Male, Female, or leave it blank.`);
  return "";
}

function appendProductTagValue(value) {
  if (!productTagsInput) return;
  productTagsInput.value = parseTags(`${productTagsInput.value},${value}`).join(", ");
}

function clean(value) {
  return String(value || "").trim();
}

function moneyNumber(value) {
  const parsed = Number.parseFloat(clean(value));
  return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : 0;
}

function slugify(value) {
  return clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value || "";
}

function updateProductActiveLabel() {
  if (productActiveLabel) productActiveLabel.textContent = productActiveInput?.checked ? "Active" : "Inactive";
}

function setChecked(id, value) {
  const el = document.getElementById(id);
  if (el) el.checked = Boolean(value);
}

function initials(value) {
  return clean(value)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "RHB";
}

function formatMoney(value) {
  return `R ${moneyNumber(value).toFixed(2)}`;
}

function escapeHtml(value) {
  return clean(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}
