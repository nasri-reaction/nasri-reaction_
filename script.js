
const searchInput = document.querySelector('#search');
const cards = [...document.querySelectorAll('.video-card')];
const filters = [...document.querySelectorAll('.filter')];
const emptyState = document.querySelector('#emptyState');

let activeFilter = 'all';
let activeCard = null;

// Préparer les vidéos et leurs couvertures
cards.forEach(card => {
  const player = card.querySelector('.video-player');
  const oldIframe = player.querySelector('iframe');

  if (!oldIframe) return;

  const videoId = new URL(oldIframe.src).pathname.split('/').pop();
  card.dataset.videoId = videoId;

  showCover(card);
});

// Afficher la couverture
function showCover(card) {
  const player = card.querySelector('.video-player');
  player.innerHTML = '';

  const cover = document.createElement('button');
  cover.className = 'video-cover';
  cover.type = 'button';
  cover.setAttribute('aria-label', 'Lire la vidéo');

  const img = document.createElement('img');
  img.src = `https://img.youtube.com/vi/${card.dataset.videoId}/hqdefault.jpg`;
  img.alt = 'Couverture vidéo';

  cover.appendChild(img);
  player.appendChild(cover);

  cover.addEventListener('click', () => playCard(card));
}

// Lancer une vidéo
function playCard(card) {
  // Arrêter la vidéo précédente et restaurer sa couverture
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

// Récupérer automatiquement les titres YouTube
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

// Recherche et filtres
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
