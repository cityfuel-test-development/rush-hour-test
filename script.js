import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  collection,
  getFirestore,
  onSnapshot,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyD5tgCJHw05YCQKjRKlIeJeknzygmlchOM",
  authDomain: "cf-manager-8e266.firebaseapp.com",
  projectId: "cf-manager-8e266",
  storageBucket: "cf-manager-8e266.firebasestorage.app",
  messagingSenderId: "996357465758",
  appId: "1:996357465758:web:f17323d5ad96ce7c3f3d8f",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const STORES = [
  {
    name: "Midrand",
    lat: -26.002467542981734,
    lng: 28.123643396024626,
    ubereats: "https://www.ubereats.com/za/store/rush-hour-beauty-midrand/VgYXxdOnXL-uFiGjVtjpRQ?diningMode=DELIVERY&surfaceName=",
    mrd: "https://www.mrd.com/delivery/store/rush-hour-beauty-midrand-halfway-house/34686",
  },
  {
    name: "JHB South",
    lat: -26.301748637723858,
    lng: 28.047441442889276,
    ubereats: "https://www.ubereats.com/store/rush-hour-beauty-johannesburg-south-cspa-wellness-thaba-eco-village/OL14_U9TWR6YxFV8RHO7WA?diningMode=DELIVERY&surfaceName=",
    mrd: "https://www.mrd.com/delivery/store/rush-hour-beauty-thaba-eco-village-lifestyle-centre-rietvlei/34578",
  },
  {
    name: "Boksburg",
    lat: -26.184978916014444,
    lng: 28.238620679124345,
    ubereats: "https://www.ubereats.com/store/rush-hour-beauty-boksburg-5-edgar-rd/S1YVqvNIWbW2Dz5pAbVOtA?diningMode=DELIVERY",
    mrd: "https://www.mrd.com/delivery/restaurant/rush-hour-beauty-boksburg-beyers-park/34685",
  },
  {
    name: "Benoni",
    lat: -26.150844679391245,
    lng: 28.338130109809786,
    ubereats: "https://www.ubereats.com/za/store/rush-hour-beauty-benoni/u_Ytmo_jU1WkzYASoO84Hw?diningMode=DELIVERY&surfaceName=",
    mrd: "https://www.mrd.com/delivery/store/rush-hour-beauty-benoni-rynfield/34683",
  },
  {
    name: "Ruimsig",
    lat: -26.093423453205546,
    lng: 27.868356465627294,
    ubereats: "",
    mrd: "",
  },
  {
    name: "Melrose",
    lat: -26.1273,
    lng: 28.0740,
    ubereats: "",
    mrd: "",
  },
  {
    name: "Centurion",
    lat: -25.867972691870225,
    lng: 28.197287712523764,
    ubereats: "",
    mrd: "",
  },
  {
    name: "Hatfield",
    lat: -25.749814848665704,
    lng: 28.234148549999418,
    ubereats: "",
    mrd: "",
  },
  {
    name: "Pretoria East",
    lat: -25.739828713380497,
    lng: 28.329979865609108,
    ubereats: "",
    mrd: "",
  },
  {
    name: "Menlyn",
    lat: -25.837958220704138,
    lng: 28.302197223285905,
    ubereats: "",
    mrd: "",
  },
  {
    name: "Constantia (Wynberg)",
    lat: -34.00654580964667,
    lng: 18.46945425259538,
    ubereats: "",
    mrd: "",
  },
  {
    name: "Milnerton",
    lat: -33.874399386202306,
    lng: 18.512549984712976,
    ubereats: "",
    mrd: "",
  },
  {
    name: "Cape Town Foreshore",
    lat: -33.9201236229562,
    lng: 18.43356355258985,
    ubereats: "https://www.ubereats.com/za/store/rush-hour-beauty-foreshore-5-martin-hammerschlag-way/W3bq8z_oXt6A2dgyAiI_sg?diningMode=DELIVERY&surfaceName=",
    mrd: "https://www.mrd.com/delivery/store/rush-hour-beauty-foreshore-foreshore/34566",
  },
  {
    name: "Stellenbosch",
    lat: -33.93112475690925,
    lng: 18.855205294918655,
    ubereats: "",
    mrd: "",
  },
  {
    name: "Somerset West",
    lat: -34.08303721290661,
    lng: 18.849255137256677,
    ubereats: "",
    mrd: "",
  },
  {
    name: "Durbanville (Pinehurst)",
    lat: -33.8362894444326,
    lng: 18.675304781420337,
    ubereats: "",
    mrd: "",
  },
  {
    name: "Durban North",
    lat: -29.784505,
    lng: 31.027045,
    ubereats: "https://www.ubereats.com/store/rush-hour-beauty-durban-north-506-chris-hani-rd/YaUVA-a7Vu6Sa8ei4NRQOQ?diningMode=DELIVERY&surfaceName=",
    mrd: "https://www.mrd.com/delivery/store/rush-hour-beauty-durban-north-briadene/34572",
  },
  {
    name: "Hillcrest",
    lat: null,
    lng: null,
    ubereats: "",
    mrd: "",
  },
];

const state = {
  products: [],
  activeBrand: "",
  activeSex: "",
  activeTag: "",
  search: "",
  cart: new Map(),
  customer: null,
};

const els = {
  year: document.getElementById("year"),
  productGrid: document.getElementById("product-grid"),
  productStatus: document.getElementById("product-status"),
  productSearch: document.getElementById("product-search"),
  brandFilters: document.getElementById("brand-filters"),
  sexFilters: document.getElementById("sex-filters"),
  tagFilters: document.getElementById("tag-filters"),
  cartCount: document.getElementById("cart-count"),
  cartDrawer: document.getElementById("cart-drawer"),
  cartItems: document.getElementById("cart-items"),
  cartTotal: document.getElementById("cart-total"),
  platformModal: document.getElementById("platform-modal"),
  platformStatus: document.getElementById("platform-status"),
  socialCarouselTrack: document.getElementById("social-carousel-track"),
  socialCarouselStatus: document.getElementById("social-carousel-status"),
  accountNavLink: document.getElementById("account-nav-link"),
  accountAuthPanel: document.getElementById("account-auth-panel"),
  accountProfilePanel: document.getElementById("account-profile-panel"),
  customerLoginForm: document.getElementById("customer-login-form"),
  customerRegisterForm: document.getElementById("customer-register-form"),
  customerResetForm: document.getElementById("customer-reset-form"),
  customerSignout: document.getElementById("customer-signout"),
  customerLoginStatus: document.getElementById("customer-login-status"),
  customerRegisterStatus: document.getElementById("customer-register-status"),
  customerResetStatus: document.getElementById("customer-reset-status"),
  customerName: document.getElementById("customer-name"),
  customerEmail: document.getElementById("customer-email"),
  customerEmailDetail: document.getElementById("customer-email-detail"),
  customerSince: document.getElementById("customer-since"),
};

if (els.year) els.year.textContent = new Date().getFullYear();

setupReveal();
if (els.productGrid) watchProducts();
if (els.socialCarouselTrack) watchSocialCarousel();
bindEvents();
watchCustomerAuth();

function setupReveal() {
  const revealEls = document.querySelectorAll(".reveal");
  const showAll = () => revealEls.forEach((el) => el.classList.add("is-visible"));

  if (!("IntersectionObserver" in window)) {
    showAll();
    return;
  }

  const io = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.1 });

  revealEls.forEach((el) => io.observe(el));
  setTimeout(showAll, 900);
}

function bindEvents() {
  els.productSearch?.addEventListener("input", () => {
    state.search = clean(els.productSearch.value).toLowerCase();
    renderProducts();
  });

  els.brandFilters?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-brand-filter]");
    if (!button) return;
    state.activeBrand = button.getAttribute("data-brand-filter") || "";
    state.activeTag = "";
    renderCatalogFilters();
    renderProducts();
    scrollToCatalogTop();
  });

  els.tagFilters?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-tag-filter]");
    if (!button) return;
    state.activeTag = button.getAttribute("data-tag-filter") || "";
    renderCatalogFilters();
    renderProducts();
    scrollToCatalogTop();
  });

  els.sexFilters?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-sex-filter]");
    if (!button) return;
    state.activeSex = button.getAttribute("data-sex-filter") || "";
    renderCatalogFilters();
    renderProducts();
    scrollToCatalogTop();
  });

  els.productGrid?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-add-product]");
    if (!button) return;
    addToCart(button.getAttribute("data-add-product"));
  });

  document.getElementById("open-cart")?.addEventListener("click", () => openCart());
  document.getElementById("find-store")?.addEventListener("click", () => openPlatformModal());
  document.getElementById("hero-find-store")?.addEventListener("click", () => openPlatformModal());
  els.customerLoginForm?.addEventListener("submit", handleCustomerLogin);
  els.customerRegisterForm?.addEventListener("submit", handleCustomerRegister);
  els.customerResetForm?.addEventListener("submit", handleCustomerPasswordReset);
  els.customerSignout?.addEventListener("click", handleCustomerSignout);

  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-cart-close]")) closeCart();
    if (event.target.closest("[data-platform-close]")) closePlatformModal();

    const qtyButton = event.target.closest("[data-cart-qty]");
    if (qtyButton) {
      updateCartQuantity(qtyButton.getAttribute("data-cart-qty"), Number(qtyButton.getAttribute("data-delta")));
    }

    const platformButton = event.target.closest("[data-platform]");
    if (platformButton) {
      redirectToNearestStore(platformButton.getAttribute("data-platform"));
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeCart();
      closePlatformModal();
    }
  });
}

function watchCustomerAuth() {
  onAuthStateChanged(auth, (user) => {
    state.customer = user;
    renderCustomerAccount();
  });
}

async function handleCustomerLogin(event) {
  event.preventDefault();
  setStatus(els.customerLoginStatus, "Signing you in...");

  const formData = new FormData(els.customerLoginForm);
  const email = clean(formData.get("email"));
  const password = String(formData.get("password") || "");

  try {
    await signInWithEmailAndPassword(auth, email, password);
    els.customerLoginForm.reset();
    setStatus(els.customerLoginStatus, "Signed in.", "success");
  } catch (error) {
    setStatus(els.customerLoginStatus, friendlyCustomerAuthError(error), "error");
  }
}

async function handleCustomerRegister(event) {
  event.preventDefault();
  setStatus(els.customerRegisterStatus, "Creating your account...");

  const formData = new FormData(els.customerRegisterForm);
  const name = clean(formData.get("name"));
  const email = clean(formData.get("email"));
  const password = String(formData.get("password") || "");

  try {
    const credentials = await createUserWithEmailAndPassword(auth, email, password);
    if (name) {
      await updateProfile(credentials.user, { displayName: name });
    }
    els.customerRegisterForm.reset();
    setStatus(els.customerRegisterStatus, "Account created. Welcome to Rush Hour Beauty.", "success");
    renderCustomerAccount(credentials.user);
  } catch (error) {
    setStatus(els.customerRegisterStatus, friendlyCustomerAuthError(error), "error");
  }
}

async function handleCustomerPasswordReset(event) {
  event.preventDefault();
  setStatus(els.customerResetStatus, "Sending reset email...");

  const formData = new FormData(els.customerResetForm);
  const email = clean(formData.get("email"));

  try {
    await sendPasswordResetEmail(auth, email);
    els.customerResetForm.reset();
    setStatus(els.customerResetStatus, "Password reset email sent.", "success");
  } catch (error) {
    setStatus(els.customerResetStatus, friendlyCustomerAuthError(error), "error");
  }
}

async function handleCustomerSignout() {
  await signOut(auth);
  setStatus(els.customerLoginStatus, "Signed out.");
}

function renderCustomerAccount(user = state.customer) {
  if (els.accountNavLink) {
    els.accountNavLink.textContent = user ? "Profile" : "Account";
  }

  if (!els.accountAuthPanel || !els.accountProfilePanel) return;

  if (!user) {
    els.accountAuthPanel.classList.remove("is-hidden");
    els.accountProfilePanel.classList.add("is-hidden");
    return;
  }

  els.accountAuthPanel.classList.add("is-hidden");
  els.accountProfilePanel.classList.remove("is-hidden");

  if (els.customerName) els.customerName.textContent = user.displayName || "Rush Hour Beauty customer";
  if (els.customerEmail) els.customerEmail.textContent = user.email || "";
  if (els.customerEmailDetail) els.customerEmailDetail.textContent = user.email || "Managed securely by Firebase Auth";
  if (els.customerSince) {
    const createdAt = user.metadata?.creationTime ? new Date(user.metadata.creationTime) : null;
    els.customerSince.textContent = createdAt && !Number.isNaN(createdAt.getTime())
      ? createdAt.toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" })
      : "Recently";
  }
}

function watchProducts() {
  const productsQuery = query(collection(db, "rushBeautyProducts"), where("isActive", "==", true));

  onSnapshot(productsQuery, (snapshot) => {
    state.products = snapshot.docs
      .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      .sort((a, b) => clean(a.name).localeCompare(clean(b.name)));

    renderCatalogFilters();
    renderProducts();
  }, (error) => {
    if (els.productStatus) els.productStatus.textContent = error?.message || "Unable to load products.";
    if (els.productGrid) els.productGrid.innerHTML = `<div class="empty-card">Products could not be loaded right now.</div>`;
  });
}

function watchSocialCarousel() {
  const carouselQuery = query(collection(db, "rushBeautySocialCarousel"), where("isActive", "==", true));

  onSnapshot(carouselQuery, (snapshot) => {
    const images = snapshot.docs
      .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      .filter((image) => clean(image.imageUrl))
      .sort((a, b) => Number(b.sortOrder || 0) - Number(a.sortOrder || 0));
    renderSocialCarousel(images);
  }, (error) => {
    if (els.socialCarouselStatus) {
      els.socialCarouselStatus.textContent = error?.message || "Carousel images could not be loaded right now.";
    }
  });
}

function renderSocialCarousel(images) {
  if (!els.socialCarouselTrack) return;

  if (!images.length) {
    if (els.socialCarouselStatus) {
      els.socialCarouselStatus.textContent = "Carousel images will appear here soon.";
      els.socialCarouselStatus.classList.remove("is-hidden");
    }
    els.socialCarouselTrack.innerHTML = "";
    return;
  }

  els.socialCarouselStatus?.classList.add("is-hidden");
  const loopImages = [...images, ...images];

  els.socialCarouselTrack.innerHTML = loopImages.map((image) => `
    <article class="social-carousel__slide">
      <img src="${escapeAttr(image.imageUrl)}" alt="${escapeAttr(image.fileName || "Rush Hour Beauty social image")}">
    </article>
  `).join("");
}

function renderCatalogFilters() {
  renderBrandFilters();
  renderSexFilters();
  renderTagFilters();
}

function renderBrandFilters() {
  if (!els.brandFilters) return;

  const brands = [...new Set(state.products.map((product) => clean(product.brand)).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));

  const buttons = [
    `<button class="chip ${state.activeBrand ? "" : "is-active"}" type="button" data-brand-filter="">All brands</button>`,
    ...brands.map((brand) => `
      <button class="chip ${state.activeBrand === brand ? "is-active" : ""}" type="button" data-brand-filter="${escapeAttr(brand)}">${escapeHtml(brand)}</button>
    `),
  ];

  els.brandFilters.innerHTML = buttons.join("");
}

function renderTagFilters() {
  if (!els.tagFilters) return;

  const filteredProducts = state.products.filter((product) => {
    const brandMatch = !state.activeBrand || clean(product.brand) === state.activeBrand;
    const sexMatch = !state.activeSex || clean(product.sex) === state.activeSex;
    return brandMatch && sexMatch;
  });
  const tags = [...new Set(filteredProducts.flatMap((product) => productTags(product)))]
    .sort((a, b) => a.localeCompare(b));

  const buttons = [
    `<button class="chip ${state.activeTag ? "" : "is-active"}" type="button" data-tag-filter="">All categories</button>`,
    ...tags.map((tag) => `
      <button class="chip ${state.activeTag === tag ? "is-active" : ""}" type="button" data-tag-filter="${escapeAttr(tag)}">${escapeHtml(tag)}</button>
    `),
  ];

  els.tagFilters.innerHTML = buttons.join("");
}

function renderSexFilters() {
  if (!els.sexFilters) return;

  const buttons = [
    ["", "All"],
    ["Female", "Female"],
    ["Male", "Male"],
  ].map(([value, label]) => `
    <button class="chip ${state.activeSex === value ? "is-active" : ""}" type="button" data-sex-filter="${escapeAttr(value)}">${escapeHtml(label)}</button>
  `);

  els.sexFilters.innerHTML = buttons.join("");
}

function renderProducts() {
  if (!els.productGrid) return;

  const visible = state.products.filter((product) => {
    const tags = productTags(product);
    const brandMatch = !state.activeBrand || clean(product.brand) === state.activeBrand;
    const sexMatch = !state.activeSex || clean(product.sex) === state.activeSex;
    const tagMatch = !state.activeTag || tags.includes(state.activeTag);
    const haystack = [product.name, product.sku, product.brand, product.sex, tags.join(" ")].join(" ").toLowerCase();
    return brandMatch && sexMatch && tagMatch && haystack.includes(state.search);
  });

  if (els.productStatus) {
    els.productStatus.textContent = visible.length
      ? `${visible.length} products available`
      : state.products.length ? "No products match that search." : "No active products are available yet.";
  }

  if (!visible.length) {
    els.productGrid.innerHTML = `<div class="empty-card">No products found. Try another brand, sex, category or search.</div>`;
    return;
  }

  els.productGrid.innerHTML = visible.map(productCardHtml).join("");
}

function scrollToCatalogTop() {
  const catalog = document.querySelector(".catalog-main");
  if (!catalog) return;

  requestAnimationFrame(() => {
    const headerOffset = 96;
    const top = catalog.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
  });
}

function productCardHtml(product) {
  const image = product.imageUrl
    ? `<img src="${escapeAttr(product.imageUrl)}" alt="${escapeAttr(product.name)}">`
    : `<span>${escapeHtml(initials(product.name))}</span>`;

  return `
    <article class="product-card">
      <div class="product-image">${image}</div>
      <div class="product-body">
        <div class="product-category">${escapeHtml([product.brand, product.sex].filter(Boolean).join(" | ") || productTags(product)[0] || "Beauty")}</div>
        <div class="product-name">${escapeHtml(product.name || "Untitled product")}</div>
        <div class="product-sku">${escapeHtml(product.sku || product.id)}</div>
        <div class="product-footer">
          <span class="price">${formatMoney(product.price)}</span>
          <button class="btn btn--primary" type="button" data-add-product="${escapeAttr(product.id)}">Add</button>
        </div>
      </div>
    </article>
  `;
}

function addToCart(productId) {
  const product = state.products.find((item) => item.id === productId);
  if (!product) return;

  const current = state.cart.get(productId) || { product, quantity: 0 };
  current.quantity += 1;
  state.cart.set(productId, current);
  renderCart();
  openCart();
}

function updateCartQuantity(productId, delta) {
  const item = state.cart.get(productId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) state.cart.delete(productId);
  renderCart();
}

function renderCart() {
  const items = [...state.cart.values()];
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + moneyNumber(item.product.price) * item.quantity, 0);

  if (els.cartCount) els.cartCount.textContent = String(itemCount);
  if (els.cartTotal) els.cartTotal.textContent = formatMoney(total);
  document.getElementById("cart-checkout")?.setAttribute("disabled", "");

  if (!els.cartItems) return;
  if (!items.length) {
    els.cartItems.innerHTML = `<div class="empty-card">Your cart is empty.</div>`;
    return;
  }

  els.cartItems.innerHTML = items.map(({ product, quantity }) => {
    const image = product.imageUrl
      ? `<img src="${escapeAttr(product.imageUrl)}" alt="${escapeAttr(product.name)}">`
      : `<span>${escapeHtml(initials(product.name))}</span>`;
    return `
      <article class="cart-item">
        <div class="cart-item__image">${image}</div>
        <div>
          <h3>${escapeHtml(product.name)}</h3>
          <p>${formatMoney(product.price)}</p>
        </div>
        <div class="qty-row">
          <button type="button" data-cart-qty="${escapeAttr(product.id)}" data-delta="-1">-</button>
          <strong>${quantity}</strong>
          <button type="button" data-cart-qty="${escapeAttr(product.id)}" data-delta="1">+</button>
        </div>
      </article>
    `;
  }).join("");
}

function openCart() {
  renderCart();
  els.cartDrawer?.setAttribute("aria-hidden", "false");
}

function closeCart() {
  els.cartDrawer?.setAttribute("aria-hidden", "true");
}

function openPlatformModal() {
  els.platformModal?.setAttribute("aria-hidden", "false");
}

function closePlatformModal() {
  els.platformModal?.setAttribute("aria-hidden", "true");
}

async function redirectToNearestStore(platform) {
  if (!platform) return;
  setPlatformStatus("Locating nearest store...");

  const position = await userPosition();
  const fallback = { lat: STORES[0].lat, lng: STORES[0].lng };
  const user = position || fallback;
  const store = nearestStore(user, platform);
  const url = store?.[platform === "mrd" ? "mrd" : "ubereats"];

  if (!url) {
    setPlatformStatus("No store link is available for that platform yet.");
    return;
  }

  window.location.href = url;
}

function nearestStore(user, platform) {
  return STORES
    .filter((store) => clean(store[platform === "mrd" ? "mrd" : "ubereats"]))
    .map((store) => ({ store, distance: distanceKm(user, store) }))
    .sort((a, b) => a.distance - b.distance)[0]?.store;
}

function userPosition() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, maximumAge: 60000, timeout: 10000 }
    );
  });
}

function distanceKm(a, b) {
  const toRad = (value) => value * Math.PI / 180;
  const radius = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * radius * Math.asin(Math.sqrt(x));
}

function setPlatformStatus(message) {
  if (els.platformStatus) els.platformStatus.textContent = message;
}

function setStatus(element, message, tone = "") {
  if (!element) return;
  element.textContent = message || "";
  element.classList.remove("is-error", "is-success");
  if (tone) element.classList.add(`is-${tone}`);
}

function friendlyCustomerAuthError(error) {
  switch (error?.code) {
    case "auth/email-already-in-use":
      return "An account already exists for that email address.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Those login details do not match an account.";
    case "auth/weak-password":
      return "Please use a password with at least 6 characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    default:
      return error?.message || "Something went wrong. Please try again.";
  }
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

function clean(value) {
  return String(value || "").trim();
}

function moneyNumber(value) {
  const parsed = Number.parseFloat(clean(value));
  return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : 0;
}

function formatMoney(value) {
  return `R ${moneyNumber(value).toFixed(2)}`;
}

function initials(value) {
  return clean(value).split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("") || "RHB";
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
