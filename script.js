
const SUPABASE_URL = "https://pkpqbnxsfgvsikelauxb.supabase.co";
const SUPABASE_KEY = "sb_publishable_eoHdYYrMc9K-GQzW2MlVSw_HJtRyMoB";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// Elements
const siteContent = document.getElementById("siteContent");
const authModal = document.getElementById("authModal");
const authForm = document.getElementById("authForm");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const authMessage = document.getElementById("authMessage");
const authTitle = document.getElementById("authTitle");
const authSubmit = document.getElementById("authSubmit");
const switchAuth = document.getElementById("switchAuth");
const subscribeBtn = document.getElementById("subscribeBtn");
const subscriberCount = document.getElementById("subscriberCount");

let isLoginMode = false;

// Show site only when logged in
function updateAccess(session) {
  const loggedIn = Boolean(session);

  siteContent.hidden = !loggedIn;
  authModal.hidden = loggedIn;

  document.body.style.overflow = loggedIn ? "" : "hidden";

  if (loggedIn) {
    loadSubscriberCount();
  }
}

// Check current login
async function checkLogin() {
  const { data, error } = await db.auth.getSession();

  if (error) {
    console.error("Session error:", error.message);
    updateAccess(null);
    return;
  }

  updateAccess(data.session);
}

// Auth state changes
db.auth.onAuthStateChange((_event, session) => {
  updateAccess(session);
});

// Switch between signup and login
switchAuth.addEventListener("click", () => {
  isLoginMode = !isLoginMode;

  authTitle.textContent = isLoginMode
    ? "Connexion à ton compte"
    : "Créer ton compte";

  authSubmit.textContent = isLoginMode
    ? "Se connecter"
    : "Créer mon compte";

  switchAuth.textContent = isLoginMode
    ? "Pas encore de compte ? Inscription"
    : "Déjà un compte ? Connexion";

  authMessage.textContent = "";
});

// Signup / Login
authForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = authEmail.value.trim();
  const password = authPassword.value;

  authSubmit.disabled = true;
  authMessage.textContent = "Chargement...";

  try {
    let result;

    if (isLoginMode) {
      result = await db.auth.signInWithPassword({
        email,
        password
      });
    } else {
      result = await db.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin +
            window.location.pathname
        }
      });
    }

    if (result.error) {
      throw result.error;
    }

    if (isLoginMode) {
      authMessage.textContent = "Connexion réussie !";
      updateAccess(result.data.session);
    } else if (result.data.session) {
      authMessage.textContent = "Compte créé avec succès !";
      updateAccess(result.data.session);
    } else {
      authMessage.textContent =
        "Compte créé ! Vérifie ton email pour confirmer ton inscription.";
    }

  } catch (error) {
    authMessage.textContent = error.message;
  } finally {
    authSubmit.disabled = false;
  }
});

// Logout button
subscribeBtn.addEventListener("click", async () => {
  const { error } = await db.auth.signOut();

  if (error) {
    alert("Erreur: " + error.message);
  }
});

// Subscriber count
async function loadSubscriberCount() {
  const { data, error } = await db.rpc("get_subscriber_count");

  if (error) {
    console.error("Subscriber count error:", error.message);
    return;
  }

  subscriberCount.textContent = data ?? 0;
}

// Video search and filters
const searchInput = document.getElementById("search");
const videoCards = [...document.querySelectorAll(".video-card")];
const filterButtons = [...document.querySelectorAll(".filter")];
const emptyState = document.getElementById("emptyState");

let currentFilter = "all";

function filterVideos() {
  const query = searchInput.value.toLowerCase().trim();
  let visibleCount = 0;

  videoCards.forEach((card) => {
    const categories = card.dataset.category || "";
    const searchText = (
      card.dataset.search + " " + card.textContent
    ).toLowerCase();

    const matchesFilter =
      currentFilter === "all" ||
      categories.split(" ").includes(currentFilter);

    const matchesSearch = searchText.includes(query);
    const visible = matchesFilter && matchesSearch;

    card.hidden = !visible;

    if (visible) visibleCount++;
  });

  emptyState.hidden = visibleCount !== 0;
}

searchInput.addEventListener("input", filterVideos);

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((item) =>
      item.classList.remove("active")
    );

    button.classList.add("active");
    currentFilter = button.dataset.filter;

    filterVideos();
  });
});

// Start
checkLogin();

console.log("NASRI REACTION ROOM loaded successfully!");

