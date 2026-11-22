# Accès à Cmail depuis l'extérieur — VPN IPsec sur FortiGate

**CHU de Tlemcen · Messagerie interne Cmail**

Ce guide permet aux agents d'utiliser l'application mobile Cmail en dehors du réseau de l'hôpital (domicile, 4G, mission). Le téléphone se connecte au FortiGate par un VPN chiffré et n'a accès **qu'au serveur Cmail**, rien d'autre du réseau interne.

> Les menus cités correspondent à FortiOS 7.x ; leur intitulé peut varier légèrement selon la version (vérifier dans *Système → Firmware*).
> Le SSL‑VPN est abandonné par Fortinet à partir de FortiOS 7.6 : ce guide utilise **IPsec**.

---

## Principe

```
Téléphone (4G / Wi‑Fi externe)
   │  FortiClient VPN (IPsec, chiffré)
   ▼
FortiGate — adresse IP publique fixe de l'hôpital
   │  règle : VPN → SRV-CMAIL, TCP 8000 uniquement
   ▼
PC serveur Cmail — 192.168.1.118:8000
```

- **Un seul service exposé** : le VPN du FortiGate. Le port 8000 de Cmail n'est **jamais** ouvert sur Internet.
- **Tunnel partiel** : seul le trafic vers Cmail passe par l'hôpital, le reste d'Internet du téléphone reste direct.
- **Un compte par agent** : la révocation est immédiate (agent parti, téléphone perdu).

---

## Valeurs à renseigner

| Élément | Valeur | À compléter |
|---|---|---|
| Adresse IP publique fixe de l'hôpital | | ☐ |
| Adresse LAN du PC serveur Cmail | `192.168.1.118` (exemple) | ☐ |
| Port de Cmail | `8000` (TCP) | |
| Plage d'adresses des clients VPN | `10.212.134.200 – 10.212.134.250` | ☐ |
| Groupe d'utilisateurs VPN | `VPN-CMAIL` | |
| Clé pré‑partagée IPsec | *(aléatoire, 32 caractères minimum — à conserver en lieu sûr)* | ☐ |
| Adresse « Serveur » dans l'application Cmail | `http://192.168.1.118:8000/api/mobile` | |

---

## Étape 1 — Préparer le serveur Cmail dans le FortiGate

### 1.1 Fixer l'adresse du PC serveur
*Réseau → Interfaces → (interface LAN) → Serveur DHCP → Réservations*

- Ajouter une réservation : **adresse MAC du PC Cmail → `192.168.1.118`**.
- Sans cette réservation, l'adresse du serveur peut changer et l'application ne le trouvera plus.

### 1.2 Objet adresse
*Politique & Objets → Adresses → Créer*

| Champ | Valeur |
|---|---|
| Nom | `SRV-CMAIL` |
| Type | Sous‑réseau |
| Adresse | `192.168.1.118/32` |
| Interface | LAN |

### 1.3 Objet service
*Politique & Objets → Services → Créer*

| Champ | Valeur |
|---|---|
| Nom | `CMAIL-8000` |
| Protocole | TCP |
| Port de destination | `8000` |

---

## Étape 2 — Créer les utilisateurs

### 2.1 Comptes
*Utilisateur & Authentification → Définition des utilisateurs → Créer*

- Type : **Utilisateur local** (ou LDAP si un annuaire existe).
- **Un compte par agent**, nommé de façon explicite (ex. `m.embarki`).
- Mot de passe robuste, différent du mot de passe Cmail.

### 2.2 Groupe
*Utilisateur & Authentification → Groupes d'utilisateurs → Créer*

- Nom : `VPN-CMAIL`, membres : les comptes ci‑dessus.

### 2.3 Double authentification (fortement conseillé)
*Utilisateur & Authentification → FortiTokens*

- Activer **FortiToken Mobile** pour chaque compte (2 jetons gratuits fournis, suffisants pour l'essai ; licences supplémentaires ensuite).

---

## Étape 3 — Créer le VPN avec l'assistant

*VPN → Assistant IPsec*

| Écran | Paramètre | Valeur |
|---|---|---|
| Configuration | Nom | `VPN-CMAIL` |
| | Modèle | **Accès distant (Remote Access)** |
| | Type d'appareil distant | **Client → FortiClient** |
| Authentification | Interface entrante | **WAN** (adresse IP fixe) |
| | Méthode | Clé pré‑partagée |
| | Clé pré‑partagée | *(valeur du tableau)* |
| | Groupe d'utilisateurs | `VPN-CMAIL` |
| Politique & routage | Interface locale | LAN |
| | Adresse locale | `SRV-CMAIL` |
| | Plage d'adresses des clients | `10.212.134.200 – 10.212.134.250` |
| | Masque | `255.255.255.0` |
| | **Tunnel partiel (split tunneling)** | **Activé** |
| Client | Enregistrement du mot de passe | Désactivé (conseillé) |
| | Connexion automatique / toujours actif | Selon la politique de l'hôpital |

Valider : l'assistant crée le tunnel, les adresses et une règle de pare‑feu.

---

## Étape 4 — Restreindre la règle de pare‑feu

*Politique & Objets → Politique de pare‑feu* → ouvrir la règle créée par l'assistant (VPN → LAN).

| Champ | Valeur |
|---|---|
| Source | plage VPN + groupe `VPN-CMAIL` |
| Destination | **`SRV-CMAIL` uniquement** |
| Service | **`CMAIL-8000` uniquement** (ajouter `PING` pour les tests si besoin) |
| Action | Accepter |
| NAT | Désactivé |
| Journalisation | **Toutes les sessions** |

> Un utilisateur VPN ne peut ainsi atteindre **que Cmail** — ni les postes, ni les autres serveurs de l'hôpital.

---

## Étape 5 — Préparer le PC serveur Cmail

### 5.1 Pare‑feu Windows
*Pare‑feu Windows Defender → Paramètres avancés → Règles de trafic entrant → Nouvelle règle*

- Type : **Port** → **TCP 8000**.
- Action : Autoriser.
- Profils : Domaine, Privé, **et Public**.
- *Étendue → Adresses IP distantes* : `192.168.1.0/24` et `10.212.134.0/24` (réseau local + clients VPN).

### 5.2 Démarrer Cmail
Cmail est servi par **Apache (XAMPP) sur le port 8000**, qui écoute sur toutes les interfaces (réseau local et VPN).
Lancer **`demarrer-cmail.bat`** (dossier du projet) : il démarre Apache si besoin et ouvre 2 fenêtres à laisser ouvertes :

1. file d'attente (e‑mails, analyse des documents, dictée vocale) ;
2. planificateur (messages programmés, récurrents).

---

## Étape 6 — Installer sur le téléphone (fiche utilisateur)

1. Installer **FortiClient VPN** (gratuit) depuis le Play Store.
2. Ouvrir FortiClient → **Nouveau VPN** :
   - Nom : `CHU Cmail`
   - Type : **IPsec VPN**
   - Serveur : *adresse IP publique de l'hôpital*
   - Authentification : **clé pré‑partagée** → *(fournie par le service informatique)*
   - Nom d'utilisateur : *votre compte VPN*
3. Appuyer sur **Connecter**, saisir le mot de passe (et le code FortiToken si demandé).
4. Ouvrir **Cmail**. Sur l'écran de connexion, la pastille **« Serveur »** doit indiquer :
   `http://192.168.1.118:8000/api/mobile`
5. Se connecter normalement : messages, pièces jointes, scanner et notifications fonctionnent comme à l'hôpital.

> VPN déconnecté : Cmail affiche le bandeau gris « Hors ligne ». Les réponses écrites restent en attente et partent automatiquement à la reconnexion.

---

## Étape 7 — Tests de validation

À faire avec 2 ou 3 téléphones **en 4G, Wi‑Fi désactivé** :

| # | Test | Résultat attendu | OK |
|---|---|---|---|
| 1 | Connexion FortiClient | État « Connecté », adresse `10.212.134.x` attribuée | ☐ |
| 2 | Ouvrir Cmail et se connecter | Réception affichée, pas de bandeau « Hors ligne » | ☐ |
| 3 | Ouvrir une pièce jointe | Le document s'ouvre | ☐ |
| 4 | Envoyer un message depuis un autre compte | Notification reçue sur le téléphone | ☐ |
| 5 | Naviguer sur un site Internet | Fonctionne (tunnel partiel) | ☐ |
| 6 | Tenter d'atteindre un autre serveur interne | **Refusé** | ☐ |
| 7 | Désactiver le compte VPN dans le FortiGate | Connexion VPN impossible | ☐ |
| 8 | Couper le VPN, écrire une réponse, reconnecter | La réponse part automatiquement | ☐ |

---

## Exploitation au quotidien

| Situation | Action |
|---|---|
| Nouvel agent | Créer son compte, l'ajouter à `VPN-CMAIL`, lui remettre la fiche utilisateur (étape 6) |
| Agent parti / téléphone perdu | *Utilisateur & Authentification* → **désactiver le compte** (effet immédiat). Bloquer aussi son compte dans l'administration Cmail |
| Qui est connecté ? | *Tableau de bord → Moniteur → Moniteur VPN IPsec* |
| Historique des accès | *Journal & Rapports → Trafic transféré* (filtre : destination `SRV-CMAIL`) |
| Changement d'adresse du serveur | Modifier la réservation DHCP **et** l'objet `SRV-CMAIL` |
| Clé pré‑partagée compromise | La changer dans le tunnel, puis la redistribuer aux agents |

---

## Dépannage

| Symptôme | Cause probable | Vérification |
|---|---|---|
| FortiClient : « délai dépassé » | Mauvaise adresse publique, ports IPsec bloqués par l'opérateur | Adresse du serveur ; UDP 500/4500 autorisés sur le WAN |
| FortiClient : « échec d'authentification » | Mot de passe, clé pré‑partagée ou groupe | Compte membre de `VPN-CMAIL` ? clé identique ? |
| VPN connecté mais Cmail « Serveur injoignable » | Règle FortiGate ou pare‑feu Windows | Règle VPN → `SRV-CMAIL` / `CMAIL-8000` ; règle Windows TCP 8000 depuis `10.212.134.0/24` ; Apache démarré (XAMPP) |
| Cmail fonctionne mais pas de notifications | File d'attente / application en arrière‑plan | Fenêtres de `demarrer-cmail.bat` ouvertes ; batterie du téléphone « Sans restriction » pour Cmail et FortiClient |
| Internet ne fonctionne plus quand le VPN est actif | Tunnel partiel désactivé | Activer *split tunneling* dans le tunnel `VPN-CMAIL` |
| Fonctionne en Wi‑Fi interne mais pas en 4G | Test fait sans passer par le VPN | Refaire le test Wi‑Fi coupé |

---

## Rappels de sécurité

- Ne **jamais** ouvrir le port 8000 de Cmail directement sur Internet (pas de HTTPS, page de connexion exposée).
- Un compte VPN **nominatif** par agent ; pas de compte partagé.
- Activer la **double authentification** (FortiToken) dès que possible.
- Garder la **clé pré‑partagée** hors des e‑mails et des messageries.
- Maintenir le **firmware FortiGate** à jour (correctifs de sécurité VPN).
- Les données restent dans l'hôpital : aucun service externe (ni Gmail, ni cloud) n'intervient dans l'accès à distance.
