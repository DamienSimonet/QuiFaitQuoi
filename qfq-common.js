/* =====================================================================
   QUI FAIT QUOI ? — module commun
   Jeu de team building « ouverture d'esprit » — Programme Yoda
   ---------------------------------------------------------------------
   Ce fichier est importé par index.html, commande.html et tableau.html.
   C'est le SEUL endroit où la configuration Firebase est écrite.
   ===================================================================== */

/* ---------------------------------------------------------------------
   CONFIGURATION FIREBASE — projet « yoda-perdus-en-mer »
   Le même projet que le premier jeu : les deux cohabitent dans la même
   base, dans deux tiroirs distincts (/sessions et /qfq).
   Rien à modifier ici.
   --------------------------------------------------------------------- */
export const firebaseConfig = {
  apiKey:            "AIzaSyAfBRgmH-Nt7uhiZKmWVKi7B18_hkzJP74",
  authDomain:        "yoda-perdus-en-mer.firebaseapp.com",
  projectId:         "yoda-perdus-en-mer",
  storageBucket:     "yoda-perdus-en-mer.firebasestorage.app",
  messagingSenderId: "881660998060",
  appId:             "1:881660998060:web:a3a81684998fb0684cca09"
};
/* ------------------------------------------------------------------- */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, doc, collection, setDoc, updateDoc, deleteDoc,
  onSnapshot, getDocs, getDoc, deleteField, writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export {
  doc, collection, setDoc, updateDoc, deleteDoc,
  onSnapshot, getDocs, getDoc, deleteField, writeBatch
};

// Diagnostic : la cause n°1 de « rien ne se passe » est une config non remplacée.
if (JSON.stringify(firebaseConfig).includes('A_REMPLACER') &&
    typeof window !== 'undefined' && window.qfqError) {
  window.qfqError("La configuration Firebase n'a pas été collée dans qfq-common.js : il y reste des « A_REMPLACER ». Rien ne peut fonctionner tant que ce bloc n'est pas remplacé par celui de votre projet Firebase.");
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

/* Racine dédiée à ce jeu : n'interfère avec aucune autre application. */
export const ROOT = "qfq";

export const sessionRef = (code)      => doc(db, ROOT, code);
export const playersCol = (code)      => collection(db, ROOT, code, "players");
export const playerRef  = (code, pid) => doc(db, ROOT, code, "players", pid);
export const groupsCol  = (code)      => collection(db, ROOT, code, "groups");
export const groupRef   = (code, gid) => doc(db, ROOT, code, "groups", gid);

export const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
export const MAX_CLAIM = 140;

/* ---------------------------------------------------------------------
   Utilitaires
   --------------------------------------------------------------------- */

export function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

export function newCode() {
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // sans I ni O, illisibles au mur
  let c = "";
  for (let i = 0; i < 4; i++) c += A[Math.floor(Math.random() * A.length)];
  return c;
}

export function newId() {
  if (crypto?.randomUUID) return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function fmtTime(sec) {
  sec = Math.max(0, Math.round(sec));
  const m = Math.floor(sec / 60), s = sec % 60;
  return m + ":" + String(s).padStart(2, "0");
}

/* Comparaison de noms tolérante (accents, casse, espaces) */
export function normName(s) {
  return String(s ?? "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/\s+/g, " ").trim();
}

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ---------------------------------------------------------------------
   Répartition en groupes — équilibrée, jamais en dessous de la taille
   demandée. 23 personnes en groupes de 6 -> 3 groupes de 8, 8, 7.
   Renvoie [{ gid, letter, members:[pid,...] }, ...]
   --------------------------------------------------------------------- */
export function makeGroups(playerIds, targetSize) {
  const ids = shuffle(playerIds);
  const n = ids.length;
  const t = Math.max(2, Number(targetSize) || 6);
  const nb = Math.max(1, Math.floor(n / t));       // jamais de groupe sous-dimensionné
  const base = Math.floor(n / nb);
  const extra = n % nb;                            // les `extra` premiers groupes ont +1

  const groups = [];
  let k = 0;
  for (let g = 0; g < nb; g++) {
    const size = base + (g < extra ? 1 : 0);
    groups.push({
      gid: LETTERS[g],
      letter: LETTERS[g],
      members: ids.slice(k, k + size)
    });
    k += size;
  }
  return groups;
}

/* ---------------------------------------------------------------------
   Scores
   ---------------------------------------------------------------------
   TOUTES les bonnes réponses comptent, y compris les affirmations des
   membres du groupe : le but du jeu est de connaître le plus de monde
   possible, pas de gagner. Un groupe qui n'identifie que les siens a
   quand même identifié ces personnes-là.
   Le détail « hors du groupe » (ext / extOk) reste calculé : il sert
   à l'écran des surprises et à nuancer le classement, sans le fonder.
   --------------------------------------------------------------------- */
export function scoreGroup(group, deck) {
  const members = new Set(group.members || []);
  const answers = group.answers || {};
  let ext = 0, extOk = 0, totalOk = 0, filled = 0;
  const detail = [];

  deck.forEach((authorPid, i) => {
    const ans = answers[String(i)] ?? null;
    const ok = ans !== null && ans === authorPid;
    const own = members.has(authorPid);         // proposition d'un membre du groupe
    if (ans !== null) filled++;
    if (ok) totalOk++;
    if (!own) { ext++; if (ok) extOk++; }
    detail.push({ i, authorPid, ans, ok, own, counted: true });
  });

  return {
    ...group,
    ext, extOk, totalOk, filled, total: deck.length,
    // score principal : toutes les bonnes réponses
    pct: deck.length ? Math.round((totalOk / deck.length) * 1000) / 10 : 0,
    // indicateur secondaire : les personnes découvertes hors du groupe
    pctExt: ext ? Math.round((extOk / ext) * 1000) / 10 : 0,
    detail
  };
}

export function rankGroups(groups, deck) {
  // Le rang ne dépend que du nombre total de bonnes réponses.
  const arr = groups
    .map(g => scoreGroup(g, deck))
    .sort((a, b) => b.pct - a.pct ||
      String(a.letter || a.gid).localeCompare(String(b.letter || b.gid)));
  arr.forEach((g, i) => {
    g.rank = (i > 0 && arr[i - 1].pct === g.pct) ? arr[i - 1].rank : i + 1;
  });
  return arr;
}

/* ---------------------------------------------------------------------
   « Les surprises » — le matériau du débriefing.
   - mysteres : propositions que personne n'a su attribuer
   - evidences : propositions devinées par tous les groupes concernés
   - aimants : personnes le plus souvent citées à tort
   --------------------------------------------------------------------- */
export function analyseSurprises(groups, deck, playersById) {
  const perProp = deck.map((authorPid, i) => {
    let concerned = 0, found = 0;
    groups.forEach(g => {
      const members = new Set(g.members || []);
      if (members.has(authorPid)) return;          // gratuite pour ce groupe
      concerned++;
      if ((g.answers || {})[String(i)] === authorPid) found++;
    });
    return { i, authorPid, concerned, found, rate: concerned ? found / concerned : null };
  });

  const wrongCount = new Map();   // pid -> nombre d'attributions erronées reçues
  groups.forEach(g => {
    const members = new Set(g.members || []);
    deck.forEach((authorPid, i) => {
      if (members.has(authorPid)) return;
      const ans = (g.answers || {})[String(i)];
      if (ans && ans !== authorPid) wrongCount.set(ans, (wrongCount.get(ans) || 0) + 1);
    });
  });

  const aimants = [...wrongCount.entries()]
    .map(([pid, n]) => ({ pid, n, name: playersById[pid]?.name || "?" }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 5);

  return {
    mysteres: perProp.filter(p => p.concerned > 0 && p.found === 0),
    evidences: perProp.filter(p => p.concerned > 0 && p.found === p.concerned),
    aimants,
    perProp
  };
}
