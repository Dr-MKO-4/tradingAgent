// express-backend/src/services/dataService.js

const fs   = require('fs');
const path = require('path');

// Chemin absolu vers ton history.json
const JSON_PATH = path.resolve(__dirname, '../../../data/history.json');

/**
 * Lit et renvoie le tableau `history` du fichier JSON.
 * @returns {Array<Object>} Liste des enregistrements d'historique.
 */
function getHistory() {
  if (!fs.existsSync(JSON_PATH)) {
    // Si le fichier n'existe pas, on retourne un tableau vide
    return [];
  }
  const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
  return data.history || [];
}

/**
 * Lit et renvoie le tableau `metrics` du fichier JSON.
 * @returns {Array<Object>} Liste des enregistrements métriques.
 */
function getMetrics() {
  if (!fs.existsSync(JSON_PATH)) {
    return [];
  }
  const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
  return data.metrics || [];
}

module.exports = {
  getHistory,
  getMetrics
};
