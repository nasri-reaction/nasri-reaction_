
// ==========================================
// NASRI REACTION ROOM - COMPLETE SYSTEM
// ==========================================

// SUPABASE CONNECTION
const SUPABASE_URL = "https://pkpqbnxsfgvsikelauxb.supabase.co";
const SUPABASE_KEY = "sb_publishable_eoHdYYrMc9K-GQzW2MlVSw_HJtRyMoB";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// ==========================================
// VIDEOS SYSTEM
// ==========================================

const searchInput = document.querySelector('#search');
const cards = [...document.querySelectorAll('.video-card')];
const filters = [...document.querySelectorAll('.filter')];
const emptyState = document.querySelector('#emptyState');

let activeFilter = 'all';
let activeCard = null;

cards.forEach(card => {
  const player = card.querySelector('.video-player');
  const oldIframe = player.querySelector('iframe');

  if (!oldIframe) return;

  const videoId = new URL(oldIframe.src).pathname.split('/').pop();
  card.dataset.videoId = videoId;

  showCover(card);
});

function showCover(card) {
  const player = card.querySelector('.video-player');
  player.innerHTML = '';

  const cover = document.createElement('button');
  cover.className = 'video-cover';
  cover.type = 'button';

  const img = document.createElement('img');
  img.src = `https://img.youtube.com/vi/${card.dataset.videoId}/hqdefault.jpg`;
  img.alt = 'Couverture vidéo';

  cover.appendChild(img);
  player.appendChild(cover);

  cover.addEventListener('click', () => playCard(card));
}

function playCard(card) {
  if (activeCard && activeCard !== card) {
    showCover(activeCard);
  }

  const player = card.querySelector('.video-player');
  const videoId = card.dataset.videoId;

  const iframe = document.createElement('iframe');

  iframe.src =
    `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;

  iframe.title = card.querySelector('h3')?.textContent || 'NASRI Reaction';
  iframe.allow =
    'autoplay; encrypted-media; picture-in-picture; gyroscope; accelerometer';

  iframe.allowFullscreen = true;

  player.innerHTML = '';
  player.appendChild(iframe);

  activeCard = card;
}

// YOUTUBE TITLES

cards.forEach(async card => {
  const videoId = card.dataset.videoId;
  const title = card.querySelector('h3');

  if (!videoId || !title) return;

  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(
        'https://www.youtube.com/watch?v=' + videoId
      )}&format=json`
    );

    if (!response.ok) throw new Error('Title unavailable');

    const data = await response.json();

    title.textContent = data.title;

    card.dataset.search =
      (card.dataset.search + ' ' + data.title).toLowerCase();

    updateCards();

  } catch (error) {
    console.log('Titre indisponible:', videoId);
  }
});

// SEARCH AND FILTERS

function updateCards() {
  const query = searchInput.value.trim().toLowerCase();
  let visible = 0;

  cards.forEach(card => {
    const categories = card.dataset.category.split(' ');

    const matchesFilter =
      activeFilter === 'all' || categories.includes(activeFilter);

    const matchesSearch =
      (card.dataset.search + ' ' + card.innerText)
        .toLowerCase().includes(query);

    const show = matchesFilter && matchesSearch;

    card.hidden = !show;

    if (show) visible++;
  });

  emptyState.hidden = visible !== 0;
}

filters.forEach(button => {
  button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;

    filters.forEach(item =>
      item.classList.toggle('active', item === button)
    );

    updateCards();
  });
});

searchInput.addEventListener('input', updateCards);

updateCards();

// ==========================================
// NASRI AUTHENTICATION SYSTEM
// ==========================================

const subscribeBtn = document.querySelector('#subscribeBtn');
const modal = document.querySelector('#authModal');
const authForm = document.querySelector('#authForm');
const authMessage = document.querySelector('#authMessage');

const authEmail = document.querySelector('#authEmail');
const authPassword = document.querySelector('#authPassword');

const authTitle = document.querySelector('#authTitle');
const authSubmit = document.querySelector('#authSubmit');
const switchAuth = document.querySelector('#switchAuth');

let loginMode = false;

// OPEN MODAL

subscribeBtn.addEventListener('click', async () => {

  const { data, error } = await db.auth.getSession();

  if (error) {
    authMessage.textContent = error.message;
    modal.hidden = false;
    return;
  }

  if (data.session) {
    const { error: logoutError } = await db.auth.signOut();

    if (logoutError) {
      authMessage.textContent = logoutError.message;
      modal.hidden = false;
      return;
    }

    subscribeBtn.textContent = "+ S'abonner";
    return;
  }

  modal.hidden = false;
  authMessage.textContent = '';
});

// CLOSE MODAL

document.querySelector('#closeAuth').addEventListener('click', () => {
  modal.hidden = true;
});

// SWITCH LOGIN / SIGNUP

switchAuth.addEventListener('click', () => {

  loginMode = !loginMode;

  authTitle.textContent = loginMode
    ? 'Connexion'
    : 'Créer ton compte';

  authSubmit.textContent = loginMode
    ? 'Se connecter'
    : 'Créer mon compte';

  switchAuth.textContent = loginMode
    ? 'Créer un compte'
    : 'Déjà un compte ? Connexion';

  authMessage.textContent = '';
});

// SIGNUP AND LOGIN

authForm.addEventListener('submit', async (e) => {

  e.preventDefault();

  const email = authEmail.value.trim();
  const password = authPassword.value;

  authSubmit.disabled = true;
  authMessage.textContent = 'Chargement...';

  try {

    let result;

    if (loginMode) {

      result = await db.auth.signInWithPassword({
        email,
        password
      });

    } else {

      result = await db.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            'https://nasri-reaction.github.io/nasri-reaction_/'
        }
      });

    }

    if (result.error) {
      authMessage.textContent = result.error.message;
      return;
    }

    if (!loginMode && !result.data.session) {

      authMessage.textContent =
        'Compte créé ! Vérifie ton Email pour confirmer ton inscription.';

      return;
    }

    authMessage.textContent =
      'Bienvenue dans NASRI REACTION ROOM !';

    subscribeBtn.textContent = 'Déconnexion';

    await updateCount();

    setTimeout(() => {
      modal.hidden = true;
      authForm.reset();
    }, 1500);

  } catch (error) {

    authMessage.textContent =
      'Une erreur est survenue. Réessaie.';

    console.error(error);

  } finally {

    authSubmit.disabled = false;

  }

});

// ==========================================
// SUBSCRIBER COUNTER
// ==========================================

async function updateCount() {

  const counter = document.querySelector('#subscriberCount');

  const { data, error } = await db.rpc(
    'get_subscriber_count'
  );

  if (error) {
    console.error('Counter error:', error);
    return;
  }

  counter.textContent = Number(data).toLocaleString('fr-FR');
}

// ==========================================
// AUTH SESSION
// ==========================================

async function checkSession() {

  const { data, error } = await db.auth.getSession();

  if (error) {
    console.error(error);
    return;
  }

  subscribeBtn.textContent = data.session
    ? 'Déconnexion'
    : "+ S'abonner";

  await updateCount();
}

db.auth.onAuthStateChange((event, session) => {

  subscribeBtn.textContent = session
    ? 'Déconnexion'
    : "+ S'abonner";

  if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
    setTimeout(updateCount, 0);
  }

});

checkSession();

console.log('NASRI REACTION ROOM loaded successfully!');

