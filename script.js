const searchInput = document.querySelector('#search');
const cards = [...document.querySelectorAll('.video-card')];
const filters = [...document.querySelectorAll('.filter')];
const emptyState = document.querySelector('#emptyState');
let activeFilter = 'all';
function updateCards(){
  const query = searchInput.value.trim().toLocaleLowerCase();
  let visible = 0;
  cards.forEach(card => {
    const categories = card.dataset.category.split(' ');
    const matchesFilter = activeFilter === 'all' || categories.includes(activeFilter);
    const matchesSearch = (card.dataset.search + ' ' + card.innerText).toLocaleLowerCase().includes(query);
    const show = matchesFilter && matchesSearch;
    card.hidden = !show;
    if(show) visible++;
  });
  emptyState.hidden = visible !== 0;
}
filters.forEach(button => button.addEventListener('click', () => {
  activeFilter = button.dataset.filter;
  filters.forEach(item => item.classList.toggle('active', item === button));
  updateCards();
}));
searchInput.addEventListener('input', updateCards);

// Récupérer automatiquement les titres des vidéos YouTube
document.querySelectorAll(".video-card").forEach(async (card) => {
  const iframe = card.querySelector("iframe");
  const titleElement = card.querySelector("h3");

  if (!iframe || !titleElement) return;

  const videoId = new URL(iframe.src).pathname.split("/").pop();

  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(
        "https://www.youtube.com/watch?v=" + videoId
      )}&format=json`
    );

    if (!response.ok) throw new Error("Title unavailable");

    const data = await response.json();
    titleElement.textContent = data.title;
    card.dataset.search = (card.dataset.search + " " + data.title).toLowerCase();
  } catch (error) {
    console.log("Impossible de récupérer le titre :", videoId);
  }
});

// Arrêter les autres vidéos quand une nouvelle démarre
window.addEventListener("message", (event) => {
  if (!event.origin.includes("youtube.com")) return;

  let data;

  try {
    data = JSON.parse(event.data);
  } catch {
    return;
  }

  if (data.event !== "onStateChange" || data.info !== 1) return;

  document.querySelectorAll(".video-player iframe").forEach((iframe) => {
    if (iframe.contentWindow !== event.source) {
      iframe.contentWindow.postMessage(
        JSON.stringify({
          event: "command",
          func: "pauseVideo",
          args: []
        }),
        "*"
      );
    }
  });
});

// Activer le contrôle des lecteurs YouTube
document.querySelectorAll(".video-player iframe").forEach((iframe) => {
  const url = new URL(iframe.src);
  url.searchParams.set("enablejsapi", "1");
  url.searchParams.set("origin", window.location.origin);
  iframe.src = url.toString();
});

