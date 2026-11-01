
const SUPABASE_URL = "https://pkpqbnxsfgvsikelauxb.supabase.co";
const SUPABASE_KEY = "sb_publishable_eoHdYYrMc9K-GQzW2MlVSw_HJtRyMoB";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

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
let authReady = false;

function updateAccess(session) {
  const loggedIn = Boolean(session);

  siteContent.hidden = !loggedIn;
  authModal.hidden = loggedIn;
  document.body.style.overflow = loggedIn ? "" : "hidden";

  if (loggedIn) loadSubscriberCount();
}

async function checkLogin() {
  siteContent.hidden = true;
  authModal.hidden = false;

  const { data, error } = await db.auth.getSession();

  if (error) {
    updateAccess(null);
    return;
  }

  updateAccess(data.session);
  authReady = true;
}

db.auth.onAuthStateChange((_event, session) => {
  if (authReady) updateAccess(session);
});

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

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = authEmail.value.trim();
  const password = authPassword.value;

  authSubmit.disabled = true;
  authMessage.textContent = "Chargement...";

  try {
    if (isLoginMode) {
      // Vérification réelle par Supabase
      const { data, error } = await db.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      if (!data.session || !data.user) {
        throw new Error("Connexion refusée.");
      }

      authMessage.textContent = "Connexion réussie !";
      updateAccess(data.session);

    } else {
      const { data, error } = await db.auth.signUp({
        email,
        password
      });

      if (error) throw error;

      if (data.session) {
        updateAccess(data.session);
        authMessage.textContent = "Compte créé !";
      } else {
        authMessage.textContent =
          "Compte créé ! Tu peux maintenant te connecter.";
      }
    }
  } catch (error) {
    updateAccess(null);
    authMessage.textContent = error.message;
  } finally {
    authSubmit.disabled = false;
  }
});

subscribeBtn.addEventListener("click", async () => {
  const { error } = await db.auth.signOut();

  if (error) {
    alert("Erreur: " + error.message);
  } else {
    updateAccess(null);
  }
});

async function loadSubscriberCount() {
  const { data, error } = await db.rpc("get_subscriber_count");

  if (error) {
    console.error(error.message);
    return;
  }

  subscriberCount.textContent = data ?? 0;
}

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
      (card.dataset.search || "") + " " + card.textContent
    ).toLowerCase();

    const matchesFilter =
      currentFilter === "all" ||
      categories.split(" ").includes(currentFilter);

    const visible = matchesFilter && searchText.includes(query);
    card.hidden = !visible;

    if (visible) visibleCount++;
  });

  emptyState.hidden = visibleCount !== 0;
}

searchInput.addEventListener("input", filterVideos);

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    currentFilter = button.dataset.filter;
    filterVideos();
  });
});

checkLogin();

console.log("NASRI REACTION ROOM loaded successfully!");


