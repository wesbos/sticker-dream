# 🔐 Comprendre Google OAuth pour Sticker Dream

## ❓ Question Fréquente

> "Pourquoi dois-je créer un projet Google Cloud Console ? Le but c'est que chaque utilisateur utilise sa propre authentification non ?"

**Réponse :** OUI, chaque utilisateur utilise bien son propre compte Google ! Mais vous devez quand même créer le projet pour identifier VOTRE APPLICATION.

---

## 📖 Comment Fonctionne OAuth (Simplifié)

### Analogie avec une Boîte de Nuit

Imaginez OAuth comme l'entrée d'une boîte de nuit :

```
Votre App (Sticker Dream) = La Boîte de Nuit
Google Cloud Project = La Licence d'Exploitation de la boîte
OAuth Client IDs = Les Tampon/Badge du club
Utilisateurs = Les clients qui veulent entrer
```

**Sans licence (Client IDs)**, Google refuse que votre app demande l'accès aux comptes utilisateurs.

**Avec licence (Client IDs)**, Google dit : "OK, Sticker Dream est une app légitime, elle peut demander aux utilisateurs leur permission."

---

## 🎯 Qui Fait Quoi ?

### Vous (Le Développeur)

**Une seule fois**, vous créez :

```bash
Google Cloud Console
└── Projet "Sticker Dream App"
    ├── OAuth Client ID (Web): xxx.apps.googleusercontent.com
    ├── OAuth Client ID (iOS): yyy.apps.googleusercontent.com
    ├── OAuth Client ID (Android): zzz.apps.googleusercontent.com
    └── API Gemini activée
```

Ces IDs sont **publics** et **partagés par tous les utilisateurs** de votre app. Ils identifient votre application, pas les utilisateurs.

### Les Utilisateurs (Chacun)

Chaque fois qu'un utilisateur télécharge votre app :

```
User Alice télécharge l'app
  ↓
Ouvre l'app → Voit "Se connecter avec Google"
  ↓
Clique → Popup Google OAuth s'affiche
  ↓
Popup dit: "Sticker Dream (identifiée par vos Client IDs)
           veut accéder à votre compte Google (alice@gmail.com)
           et utiliser Gemini API"
  ↓
Alice clique "Autoriser"
  ↓
App reçoit un ACCESS TOKEN personnel à Alice
  ↓
App utilise le quota Gemini d'Alice (500 images/jour)
```

```
User Bob télécharge l'app (même app, mêmes Client IDs)
  ↓
Se connecte avec bob@gmail.com
  ↓
Reçoit un ACCESS TOKEN différent (personnel à Bob)
  ↓
App utilise le quota Gemini de Bob (500 images/jour différent d'Alice)
```

---

## 🔑 Les Client IDs Ne Sont PAS des Secrets

### Idée Reçue ❌

"Si je mets mes Client IDs dans l'app, tout le monde peut les voler !"

### Réalité ✅

**Les Client IDs sont PUBLICS par design.** Ils sont comme le nom de votre restaurant sur l'enseigne.

Ce qui est sécurisé :
- Les ACCESS TOKENS (générés à chaque connexion utilisateur)
- Les REFRESH TOKENS (stockés de manière sécurisée)
- L'API Key Gemini (si utilisée en mode développeur)

Les Client IDs sont visibles dans :
- Le code source de votre app
- Les requêtes réseau
- Les inspecteurs de trafic

**C'est normal et intentionnel !**

---

## 📊 Schéma du Flux Complet

```
┌─────────────────────────────────────────────────────────────┐
│ 1. VOUS (DÉVELOPPEUR) - Configuration Initiale              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Google Cloud Console                                       │
│  └── Créer Projet "Sticker Dream"                          │
│      ├── Activer Gemini API                                │
│      ├── Créer OAuth Consent Screen                        │
│      └── Créer 3 Client IDs:                               │
│          • Web: 123.apps.googleusercontent.com             │
│          • iOS: 456.apps.googleusercontent.com             │
│          • Android: 789.apps.googleusercontent.com         │
│                                                             │
│  → Copier ces IDs dans votre .env                          │
│  → Builder l'app avec ces IDs                              │
│  → Publier sur App Store / Play Store                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. UTILISATEUR 1 (Alice) - Premier Lancement               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Alice télécharge "Sticker Dream" depuis App Store          │
│  └── L'app contient vos Client IDs (123, 456, 789)         │
│                                                             │
│  Alice ouvre l'app → Voit écran de connexion               │
│  └── Clique "Se connecter avec Google"                     │
│                                                             │
│  Popup Google OAuth apparaît:                               │
│  ┌─────────────────────────────────────────────────┐       │
│  │ 🔐 Sticker Dream veut accéder à votre compte   │       │
│  │                                                 │       │
│  │ Application: Sticker Dream (Client ID: 456)    │       │
│  │ Compte: alice@gmail.com                        │       │
│  │                                                 │       │
│  │ Autorisations demandées:                       │       │
│  │ ✓ Voir votre profil Google                    │       │
│  │ ✓ Utiliser Gemini API en votre nom            │       │
│  │                                                 │       │
│  │ [Annuler]  [Autoriser]                        │       │
│  └─────────────────────────────────────────────────┘       │
│                                                             │
│  Alice clique "Autoriser"                                   │
│  └── Google génère:                                         │
│      • ACCESS TOKEN pour Alice (valide 1h)                 │
│      • REFRESH TOKEN pour Alice                            │
│                                                             │
│  L'app stocke ces tokens dans AsyncStorage d'Alice         │
│                                                             │
│  Quand Alice génère une image:                              │
│  └── App utilise l'ACCESS TOKEN d'Alice                    │
│      └── Gemini vérifie: "Ce token appartient à Alice"    │
│          └── Utilise le quota de alice@gmail.com          │
│              (500 images/jour)                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. UTILISATEUR 2 (Bob) - Sur le Même App                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Bob télécharge la MÊME APP "Sticker Dream"                │
│  └── L'app contient les MÊMES Client IDs (123, 456, 789)   │
│                                                             │
│  Bob ouvre l'app → Se connecte avec Google                 │
│                                                             │
│  Popup Google OAuth (identique à Alice):                    │
│  ┌─────────────────────────────────────────────────┐       │
│  │ 🔐 Sticker Dream veut accéder à votre compte   │       │
│  │                                                 │       │
│  │ Application: Sticker Dream (Client ID: 456)    │       │
│  │ Compte: bob@gmail.com  ← DIFFÉRENT             │       │
│  │                                                 │       │
│  │ [Annuler]  [Autoriser]                        │       │
│  └─────────────────────────────────────────────────┘       │
│                                                             │
│  Bob clique "Autoriser"                                     │
│  └── Google génère de NOUVEAUX tokens pour Bob:            │
│      • ACCESS TOKEN pour Bob (différent d'Alice)           │
│      • REFRESH TOKEN pour Bob                              │
│                                                             │
│  L'app stocke ces tokens dans AsyncStorage de Bob          │
│  (complètement séparés des tokens d'Alice)                 │
│                                                             │
│  Quand Bob génère une image:                                │
│  └── App utilise l'ACCESS TOKEN de Bob                     │
│      └── Gemini vérifie: "Ce token appartient à Bob"      │
│          └── Utilise le quota de bob@gmail.com            │
│              (500 images/jour, séparé d'Alice)             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 💰 Qui Paie Quoi ?

### Votre Quota à Vous (Développeur)

**RIEN** ! Vous ne payez rien et n'utilisez aucun quota.

Les Client IDs ne coûtent rien et n'ont pas de quota.

### Quota des Utilisateurs

**Chaque utilisateur** utilise son propre quota Google Gemini gratuit :
- 500 images/jour via Google AI Studio
- Lié à leur compte Google personnel (alice@gmail.com, bob@gmail.com, etc.)

Si Alice génère 500 images aujourd'hui :
- ✅ Bob peut toujours générer 500 images (quota séparé)
- ✅ Alice pourra générer 500 nouvelles images demain (quota reset)

---

## 🔒 Comparaison : OAuth vs API Key

### Approche 1 : API Key (❌ Mauvais pour app publique)

```
Vous créez UNE API key Gemini
  ↓
Vous mettez cette key dans l'app
  ↓
TOUS les utilisateurs partagent VOTRE quota
  ↓
Problèmes:
  • Votre quota (500/jour) partagé par TOUS
  • Si 100 users = 5 images/user/jour
  • API key exposée dans l'app (hackable)
  • Vous payez si dépassement
```

### Approche 2 : OAuth (✅ Correct)

```
Vous créez des OAuth Client IDs
  ↓
Chaque user se connecte avec SON compte Google
  ↓
Chaque user a SON propre quota (500/jour)
  ↓
Avantages:
  • 100 users = 50,000 images/jour (100 × 500)
  • Scalabilité infinie
  • Sécurisé (tokens temporaires)
  • Vous ne payez rien
```

---

## 📝 Checklist Configuration

### ✅ Ce que VOUS faites (une fois)

- [ ] Créer projet Google Cloud Console
- [ ] Activer Gemini API (Generative Language API)
- [ ] Configurer OAuth Consent Screen
  - [ ] App name: "Sticker Dream"
  - [ ] Support email: votre email
  - [ ] Scopes: `https://www.googleapis.com/auth/generative-language.retriever`
- [ ] Créer OAuth Client ID (Web)
- [ ] Créer OAuth Client ID (iOS) avec Bundle ID
- [ ] Créer OAuth Client ID (Android) avec Package name + SHA-1
- [ ] Copier les 3 Client IDs dans `mobile/.env`
- [ ] Builder l'app
- [ ] Publier sur stores

**Temps: ~15 minutes**

### ✅ Ce que LES UTILISATEURS font (chacun)

- [ ] Télécharger l'app
- [ ] Cliquer "Se connecter avec Google"
- [ ] Autoriser l'accès
- [ ] Utiliser leur quota personnel (500/jour)

**Temps: ~30 secondes**

---

## 🎓 Analogie Finale

Imaginez une bibliothèque publique :

**Client IDs** = La carte de bibliothèque officielle
- Identifie la bibliothèque auprès de la ville
- Publique (tout le monde connaît le nom de la bibliothèque)
- Une seule pour toute la bibliothèque

**User OAuth** = La carte d'emprunt personnelle de chaque membre
- Identifie chaque personne
- Privée (unique à chaque membre)
- Chaque membre peut emprunter 5 livres (quota personnel)

Vous créez la bibliothèque (Client IDs).
Chaque utilisateur obtient sa carte personnelle (OAuth tokens).
Chaque utilisateur peut emprunter 500 livres/jour (quota Gemini).

---

## ❓ Questions Fréquentes

### "Mes Client IDs sont-ils secrets ?"

**Non.** Ils sont publics et c'est normal. Ils identifient votre app, pas les utilisateurs.

### "Si quelqu'un vole mes Client IDs ?"

Il peut créer une app qui prétend être "Sticker Dream", mais :
- L'utilisateur verra toujours une popup Google demandant confirmation
- Les tokens générés seront liés au compte de l'utilisateur, pas au vôtre
- Le voleur ne peut pas accéder à VOS données ou VOTRE quota
- Vous pouvez révoquer les Client IDs si nécessaire

### "Est-ce que je paie pour les utilisateurs ?"

**Non.** Chaque utilisateur utilise son propre quota Google gratuit.

### "Combien d'utilisateurs peuvent utiliser l'app ?"

**Illimité !** Chaque utilisateur = nouveau quota de 500 images/jour.

### "Et si l'utilisateur dépasse 500 images/jour ?"

Il verra une erreur "quota exceeded" de Gemini. Il devra attendre le lendemain ou upgrader son compte Google (pas le vôtre).

---

## 🚀 Prochaines Étapes

1. Suivre `SETUP_GOOGLE_OAUTH.md` pour la configuration pas-à-pas
2. Tester avec VOTRE compte Google d'abord
3. Inviter des beta testeurs qui utilisent LEURS comptes
4. Publier l'app

Chaque utilisateur aura son expérience indépendante avec son quota personnel !

---

**Résumé en une phrase:**

Vous créez les "papiers d'identité" de votre app (Client IDs), mais chaque utilisateur se connecte avec SON compte Google et utilise SON quota personnel (500/jour).
