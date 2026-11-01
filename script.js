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
