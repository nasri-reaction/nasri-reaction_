
// ==========================================
// NASRI REACTION ROOM
// SUPABASE + YOUTUBE AUTOMATIC VIDEOS
// ==========================================


// 1. SUPABASE CONFIGURATION

const SUPABASE_URL =
  "https://pkpqbnxsfgvsikelauxb.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_eoHdYYrMc9K-GQzW2MlVSw_HJtRyMoB";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


// 2. YOUTUBE CONFIGURATION

const YOUTUBE_API_KEY = "YOUR_YOUTUBE_API_KEY";

const CHANNEL_ID = "UCsWZjmuQrQd94xNVlKKpLTw";

const MAX_VIDEOS = 12;


// 3. HTML ELEMENTS

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

const videoGrid = document.getElementById("videoGrid");
const videosLoading = document.getElementById("videosLoading");
const emptyState = document.getElementById("emptyState");

const searchInput = document.getElementById("search");

const filterButtons = [
  ...document.querySelectorAll(".filter")
];


// 4. AUTHENTICATION STATE

let isLoginMode = false;
let authReady = false;


// 5. SHOW / HIDE WEBSITE

function updateAccess(session) {

  const loggedIn = Boolean(session);

  siteContent.hidden = !loggedIn;
  authModal.hidden = loggedIn;

  document.body.style.overflow =
    loggedIn ? "" : "hidden";

  if (loggedIn) {
    loadSubscriberCount();
    loadYouTubeVideos();
  }
}


// 6. CHECK EXISTING SESSION

async function checkLogin() {

  siteContent.hidden = true;
  authModal.hidden = false;

  const { data, error } = await db.auth.getSession();

  if (error) {
    console.error("Session error:", error.message);

    updateAccess(null);
    authReady = true;

    return;
  }

  updateAccess(data.session);

  authReady = true;
}


// 7. LISTEN TO AUTH CHANGES

db.auth.onAuthStateChange((_event, session) => {

  if (authReady) {
    updateAccess(session);
  }

});


// 8. SWITCH LOGIN / SIGNUP

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


// 9. SIGNUP / LOGIN FORM

authForm.addEventListener("submit", async (event) => {

  event.preventDefault();

  const email = authEmail.value.trim();
  const password = authPassword.value;

  authSubmit.disabled = true;
  authMessage.textContent = "Chargement...";

  try {

    if (isLoginMode) {

      // LOGIN

      const { data, error } =
        await db.auth.signInWithPassword({
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

      // CREATE ACCOUNT

      const { data, error } =
        await db.auth.signUp({
          email,
          password
        });

      if (error) throw error;

      if (data.session) {

        authMessage.textContent =
          "Compte créé avec succès !";

        updateAccess(data.session);

      } else {

        authMessage.textContent =
          "Compte créé ! Tu peux maintenant te connecter.";

      }

    }

  } catch (error) {

    authMessage.textContent = error.message;

  } finally {

    authSubmit.disabled = false;

  }

});


// 10. LOGOUT

subscribeBtn.addEventListener("click", async () => {

  const { error } = await db.auth.signOut();

  if (error) {

    alert("Erreur: " + error.message);

  } else {

    updateAccess(null);

  }

});


// 11. SUBSCRIBER COUNT

async function loadSubscriberCount() {

  const { data, error } =
    await db.rpc("get_subscriber_count");

  if (error) {

    console.error(
      "Subscriber count error:",
      error.message
    );

    return;
  }

  subscriberCount.textContent = data ?? 0;

}


// ==========================================
// YOUTUBE AUTOMATIC VIDEOS
// ==========================================


// 12. LOAD VIDEOS FROM YOUTUBE

async function loadYouTubeVideos() {

  videosLoading.hidden = false;

  videosLoading.textContent =
    "Chargement des vidéos...";

  emptyState.hidden = true;

  try {

    if (
      !YOUTUBE_API_KEY ||
      YOUTUBE_API_KEY === "YOUR_YOUTUBE_API_KEY"
    ) {
      throw new Error(
        "Ajoute ta clé YouTube API dans script.js."
      );
    }


    // A. GET CHANNEL UPLOADS PLAYLIST

    const channelUrl = new URL(
      "https://www.googleapis.com/youtube/v3/channels"
    );

    channelUrl.search = new URLSearchParams({

      part: "contentDetails",
      id: CHANNEL_ID,
      key: YOUTUBE_API_KEY

    });

    const channelResponse =
      await fetch(channelUrl);

    const channelData =
      await channelResponse.json();

    if (!channelResponse.ok) {

      throw new Error(
        channelData.error?.message ||
        "Erreur de chargement de la chaîne."
      );

    }

    const uploadsPlaylist =
      channelData.items?.[0]
        ?.contentDetails
        ?.relatedPlaylists
        ?.uploads;

    if (!uploadsPlaylist) {

      throw new Error(
        "Playlist des vidéos introuvable."
      );

    }


    // B. GET LATEST VIDEOS

    const playlistUrl = new URL(
      "https://www.googleapis.com/youtube/v3/playlistItems"
    );

    playlistUrl.search = new URLSearchParams({

      part: "snippet",
      playlistId: uploadsPlaylist,
      maxResults: String(MAX_VIDEOS),
      key: YOUTUBE_API_KEY

    });

    const playlistResponse =
      await fetch(playlistUrl);

    const playlistData =
      await playlistResponse.json();

    if (!playlistResponse.ok) {

      throw new Error(
        playlistData.error?.message ||
        "Impossible de charger les vidéos."
      );

    }


    // C. FILTER VALID VIDEOS

    const videos = (playlistData.items || [])
      .filter(item =>
        item.snippet?.resourceId?.videoId
      );


    if (videos.length === 0) {

      videoGrid.innerHTML = "";

      videosLoading.textContent =
        "Aucune vidéo disponible pour le moment.";

      return;

    }


    // D. DISPLAY VIDEOS

    videoGrid.innerHTML = "";

    videos.forEach(item => {

      const videoId =
        item.snippet.resourceId.videoId;

      const title =
        item.snippet.title;

      const description =
        item.snippet.description || "";


      // VIDEO CARD

      const card =
        document.createElement("article");

      card.className = "video-card";

      card.dataset.category = "rap reaction";

      card.dataset.search =
        (title + " " + description).toLowerCase();


      // VIDEO PLAYER

      const player =
        document.createElement("div");

      player.className = "video-player";


      const iframe =
        document.createElement("iframe");

      iframe.src =
        "https://www.youtube-nocookie.com/embed/" +
        encodeURIComponent(videoId);

      iframe.title = title;

      iframe.loading = "lazy";

      iframe.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";

      iframe.allowFullscreen = true;

      player.appendChild(iframe);


      // CARD META

      const meta =
        document.createElement("div");

      meta.className = "card-meta";


      const category =
        document.createElement("span");

      category.textContent =
        "RAP · RÉACTION";


      const creator =
        document.createElement("span");

      creator.textContent = "NASRI";

      meta.append(category, creator);


      // TITLE

      const heading =
        document.createElement("h3");

      heading.textContent = title;


      // DESCRIPTION

      const paragraph =
        document.createElement("p");

      paragraph.textContent =
        "Découvre la réaction de NASRI.";


      // YOUTUBE LINK

      const watchLink =
        document.createElement("a");

      watchLink.href =
        "https://www.youtube.com/watch?v=" +
        encodeURIComponent(videoId);

      watchLink.target = "_blank";

      watchLink.rel =
        "noopener noreferrer";

      watchLink.textContent =
        "Voir sur YouTube ↗";


      // ADD ELEMENTS

      card.append(
        player,
        meta,
        heading,
        paragraph,
        watchLink
      );

      videoGrid.appendChild(card);

    });


    // UPDATE FILTERING

    allVideoCards = [
      ...videoGrid.querySelectorAll(".video-card")
    ];

    filterVideos();

    videosLoading.hidden = true;

  } catch (error) {

    console.error("YouTube API error:", error);

    videosLoading.hidden = false;

    videosLoading.textContent =
      "Erreur : " + error.message;

  }

}


// ==========================================
// SEARCH AND FILTERS
// ==========================================


// 13. FILTER STATE

let currentFilter = "all";

let allVideoCards = [];


// 14. FILTER VIDEOS

function filterVideos() {

  const query =
    searchInput.value.toLowerCase().trim();

  let visibleCount = 0;

  allVideoCards.forEach(card => {

    const categories =
      card.dataset.category || "";

    const searchText = (
      (card.dataset.search || "") +
      " " +
      card.textContent
    ).toLowerCase();


    const matchesFilter =
      currentFilter === "all" ||
      categories.split(" ").includes(currentFilter);


    const visible =
      matchesFilter &&
      searchText.includes(query);


    card.hidden = !visible;

    if (visible) {
      visibleCount++;
    }

  });


  emptyState.hidden =
    visibleCount !== 0;

}


// 15. SEARCH INPUT

searchInput.addEventListener("input", filterVideos);


// 16. FILTER BUTTONS

filterButtons.forEach(button => {

  button.addEventListener("click", () => {

    filterButtons.forEach(item => {
      item.classList.remove("active");
    });

    button.classList.add("active");

    currentFilter =
      button.dataset.filter;

    filterVideos();

  });

});


// ==========================================
// START WEBSITE
// ==========================================

checkLogin();

console.log(
  "NASRI REACTION ROOM loaded successfully!"
);



