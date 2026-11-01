
const searchInput = document.querySelector('#search');
const cards = [...document.querySelectorAll('.video-card')];
const filters = [...document.querySelectorAll('.filter')];
const emptyState = document.querySelector('#emptyState');

let activeFilter = 'all';
let activeCard = null;

// استخراج ID متاع الفيديو
function getVideoId(card) {
  const iframe = card.querySelector('iframe');
  if (!iframe) return null;
  return new URL(iframe.src).pathname.split('/').pop();
}

// إنشاء Cover لكل فيديو
cards.forEach(card => {
  const player = card.querySelector('.video-player');
  const iframe = player.querySelector('iframe');
  const videoId = getVideoId(card);

  if (!iframe || !videoId) return;

  const cover = document.createElement('button');
  cover.className = 'video-cover';
  cover.type = 'button';
  cover.setAttribute('aria-label', 'Lire la vidéo');

  const image = document.createElement('img');
  image.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  image.alt = 'Couverture de la vidéo';
  image.loading = 'lazy';

  cover.appendChild(image);

  // نخفي الفيديو حتى يضغط المستخدم على Cover
  iframe.remove();
  player.appendChild(cover);

  cover.addEventListener('click', () => {
    // إيقاف الفيديو السابق وإرجاع Cover متاعو
    if (activeCard && activeCard !== card) {
      resetCard(activeCard);
    }

    // تشغيل الفيديو المختار
    const newIframe = document.createElement('iframe');
    newIframe.src =
      `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;

    newIframe.title = card.querySelector('h3')?.textContent || 'NASRI Reaction';
    newIframe.allow =
      'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    newIframe.allowFullscreen = true;
    newIframe.loading = 'lazy';

    cover.remove();
    player.appendChild(newIframe);

    activeCard = card;
  });
});

// إرجاع الفيديو إلى Cover متاعو
function resetCard(card) {
  const player = card.querySelector('.video-player');
  const iframe = player.querySelector('iframe');

  if (iframe) iframe.remove();

  const videoId = getVideoIdFromCard(card);
  if (!videoId) return;

  const cover = document.createElement('button');
  cover.className = 'video-cover';
  cover.type = 'button';
  cover.setAttribute('aria-label', 'Lire la vidéo');

  const image = document.createElement('img');
  image.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  image.alt = 'Couverture de la vidéo';
  image.loading = 'lazy';

  cover.appendChild(image);

  cover.addEventListener('click', () => {
    playCard(card, videoId, cover);
  });

  player.appendChild(cover);
  activeCard = null;
}

function getVideoIdFromCard(card) {
  return card.dataset.videoId;
}

function playCard(card, videoId, cover) {
  if (activeCard && activeCard !== card) {
    resetCard(activeCard);
  }

  const player = card.querySelector('.video-player');
  const iframe = document.createElement('iframe');

  iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
  iframe.title = card.querySelector('h3')?.textContent || 'NASRI Reaction';
  iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
  iframe.allowFullscreen = true;

  cover.remove();
  player.appendChild(iframe);
  activeCard = card;
}

// حفظ ID لكل فيديو
cards.forEach(card => {
  const iframeId = card.querySelector('iframe');
  if (iframeId) {
    card.dataset.videoId = new URL(iframeId.src).pathname.split('/').pop();
  }
});

// جلب أسماء الفيديوهات تلقائياً
cards.forEach(async card => {
  const videoId = card.dataset.videoId;
  const titleElement = card.querySelector('h3');

  if (!videoId || !titleElement) return;

  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(
        'https://www.youtube.com/watch?v=' + videoId
      )}&format=json`
    );

    if (!response.ok) throw new Error('Title unavailable');

    const data = await response.json();
    titleElement.textContent = data.title;
    card.dataset.search =
      (card.dataset.search + ' ' + data.title).toLowerCase();

    updateCards();
  } catch (error) {
    console.log('Titre indisponible :', videoId);
  }
});

// البحث والفلاتر
function updateCards() {
  const query = searchInput.value.trim().toLocaleLowerCase();
  let visible = 0;

  cards.forEach(card => {
    const categories = card.dataset.category.split(' ');
    const matchesFilter =
      activeFilter === 'all' || categories.includes(activeFilter);

    const matchesSearch =
      (card.dataset.search + ' ' + card.innerText)
        .toLocaleLowerCase().includes(query);

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

