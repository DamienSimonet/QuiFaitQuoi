# Qui fait quoi ? — jeu de team building « ouverture d'esprit »

Trois écrans, une session, aucune installation côté participants.

| Fichier | Qui l'ouvre | Sur quoi |
|---|---|---|
| `index.html` | les participants | leur iPhone, via le QR code |
| `commande.html` | l'animateur | son portable |
| `tableau.html` | personne | le vidéoprojecteur |
| `qfq-common.js` | — | configuration Firebase + logique partagée (le seul fichier à modifier) |

---

## 1. Mettre en service (une seule fois)

**a. Coller la configuration Firebase.** Ouvrir `qfq-common.js`, remplacer le bloc
`firebaseConfig` en haut du fichier par celui du jeu précédent (console Firebase →
Paramètres du projet → Vos applications → Configuration du SDK). C'est le **seul**
endroit à modifier : les trois pages l'importent.

**b. Mettre à jour les règles Firestore.** Dans la console Firebase → Firestore →
Règles, coller le contenu de `firestore.rules` puis publier. Ce fichier contient les
règles de l'ancien jeu **inchangées** plus un bloc pour la racine `/qfq` : les deux
jeux cohabitent sans se gêner.

**c. Publier sur GitHub Pages.** Déposer les quatre fichiers à la racine du dépôt
`QuiFaitQuoi`, puis Settings → Pages → Source : `main` / `/root`. L'adresse devient :

```
https://damiensimonet.github.io/QuiFaitQuoi/commande.html   ← animateur
https://damiensimonet.github.io/QuiFaitQuoi/tableau.html    ← mur
https://damiensimonet.github.io/QuiFaitQuoi/index.html      ← participants (via QR)
```

> Les pages utilisent des modules JavaScript : elles doivent être servies par
> GitHub Pages, pas ouvertes par double-clic depuis le Finder.

---

## 2. Dérouler une séance

**Avant l'arrivée.** Ouvrir `commande.html`, cliquer **Créer une nouvelle session**.
Coller la liste des inscrits (un nom par ligne) et l'enregistrer. Cliquer
**Ouvrir le mur ↗** et projeter cette fenêtre.

**Phase 1 — les affirmations.** Le mur affiche le QR code et le code à 4 lettres.
Chacun scanne, touche son nom (ou se déclare hors liste), écrit **une phrase vraie
que ses collègues ignorent** (140 caractères). Le mur coche les noms au fur et à
mesure — jamais le texte. Le panneau permet de relire chaque affirmation et de
demander à quelqu'un de la réécrire si elle est trop transparente ou déplacée.

**Phase 2 — le jeu.** Régler le nombre de personnes par groupe (6 par défaut) : le
panneau annonce la répartition (20 personnes → 3 groupes de 7, 7, 6 — jamais moins
que la taille demandée). Cliquer **Répartir et lancer le jeu**. Chacun voit son
groupe et le rejoint physiquement. Sur les téléphones, la même grille : toutes les
affirmations, à attribuer aux noms. Une modification faite par un membre apparaît
aussitôt sur les autres téléphones, avec le nom de l'auteur de la modification. Un
nom ne peut servir qu'une fois. N'importe quel membre valide la réponse du groupe ;
elle est alors figée (le panneau peut la rouvrir). Le mur montre l'avancement de
chaque table et le chronomètre.

**Phase 3 — les résultats.** Cliquer **Afficher les résultats**. Trois écrans
pilotés depuis le panneau :

- **Classement** — le score en pourcentage.
- **Détail d'un groupe** — chaque affirmation, la réponse donnée, la vraie personne.
- **Les surprises** — ce que personne n'a trouvé, ce que tout le monde a trouvé, et
  les personnes le plus souvent citées à tort. C'est le matériau du débriefing.

**Après.** Bouton **Effacer la session** : noms et affirmations sont supprimés du
serveur.

---

## 3. Comment le score est calculé

Le score d'un groupe est le **nombre de personnes correctement identifiées**, sur le
total des affirmations. Toutes les bonnes réponses comptent, y compris les
affirmations des membres du groupe : le but n'est pas de gagner, c'est de connaître
le plus de monde possible — un groupe qui n'a identifié que les siens a tout de même
identifié ces personnes-là.

Un second chiffre indique combien de personnes ont été identifiées **en dehors** du
groupe. C'est lui qui mesure l'effort de découverte, et sur lequel s'appuyer en
débriefing : un groupe de huit démarre mécaniquement avec deux bonnes réponses de
plus qu'un groupe de six.

Une case laissée vide compte comme une erreur.

## 4. Points d'attention en salle

- **Retardataire.** Quelqu'un qui se connecte après la répartition n'est dans aucun
  groupe et son affirmation n'est pas dans le jeu. Le plus simple est de l'intégrer à
  une table comme observateur, ou de revenir à la collecte (bouton *Revenir à la phase
  précédente*, qui efface les groupes et les réponses).
- **Téléphone verrouillé.** L'identité est mémorisée : il suffit de rouvrir la page.
- **Deux séances le même jour.** Chaque session a son propre code ; elles n'interfèrent pas.
- **Réseau.** Les téléphones ont besoin d'internet (4G suffit). Prévoir de dicter le
  code à 4 lettres si le QR code passe mal.
