// Chemin : src/utils/formatDate.js
export function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString('fr-FR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
}
