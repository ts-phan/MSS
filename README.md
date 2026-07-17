# Simulateur Système Masse-Ressort — Version obfusquée (PWA)

Fonctionnellement identique à la version standard, mais le code source applicatif
(JSX transpilé) est obfusqué pour rendre la lecture/copie du code plus difficile.
Voir `../final_normal/README.md` pour la liste des nouveautés de cette version
(nouveau modèle de désactivation d'étage, slider `k1_ref`) et les instructions de
déploiement GitHub Pages (identiques ici : `index.html` + `manifest.json` + `sw.js` +
`icons/` à la racine du dépôt).

## Ce qui a été fait

1. Le code JSX (React) a été transpilé en JavaScript pur via Babel (`@babel/preset-react`,
   runtime classique).
2. Le JavaScript résultant a été obfusqué avec `javascript-obfuscator` :
   - Renommage des identifiants en hexadécimal
   - Extraction et encodage base64 des chaînes de caractères littérales
   - Découpage des chaînes en fragments
3. Le chargement de Babel Standalone (nécessaire uniquement pour transpiler du JSX au
   runtime) a été retiré : le code étant déjà transpilé, ce n'est plus utile — cela réduit
   aussi le poids et le temps de chargement de la page.

## Options d'obfuscation volontairement désactivées

Certaines options agressives de `javascript-obfuscator` ont été désactivées après tests,
car elles cassent le fonctionnement de React dans ce contexte (composants qui ne se
re-rendent plus, props perdues) :

| Option | État | Raison |
|---|---|---|
| `controlFlowFlattening` | Désactivé | Casse fréquemment les hooks React (useEffect, useMemo) et alourdit fortement l'exécution |
| `deadCodeInjection` | Désactivé | Alourdit le bundle sans bénéfice de sécurité réel pour une app côté client |
| `selfDefending` | Désactivé | Peut interférer avec le cycle de re-render de React dans certains navigateurs |
| `transformObjectKeys` | Désactivé | **Critique** : casserait les props React usuelles (`onChange`, `value`, `key`, etc.) accédées par nom |

## Limites de l'obfuscation côté client

Il faut être transparent sur ce que l'obfuscation apporte réellement : **le code s'exécute
toujours intégralement dans le navigateur de l'utilisateur**, donc il reste techniquement
possible de le désobfusquer (formatters, débogueurs pas-à-pas, `console.log` intercepté).
L'obfuscation dissuade la lecture/copie casuelle du code mais n'offre aucune protection
contre un attaquant déterminé. Pour une vraie protection de propriété intellectuelle sur la
logique de calcul, il faudrait déplacer les calculs sensibles côté serveur (API backend),
ce qui sort du périmètre d'une PWA statique déployée sur GitHub Pages.

## Vérification effectuée

La version obfusquée a été testée dans un navigateur headless et produit des résultats
numériques strictement identiques à la version non obfusquée — notamment le comportement
du nouveau modèle de désactivation d'étage (traverse + dalle désactivées → système réduit
à exactement 120,05 Hz, identique à la fréquence de référence à 120 Hz) — l'obfuscation
n'a introduit aucune régression fonctionnelle.
