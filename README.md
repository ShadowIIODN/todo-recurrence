# ✅ Todo Récurrence — Web App

Application de todo list avec récurrences, timers, catégories, priorités et authentification Google/Discord.

---

## 🚀 Déploiement rapide (15 minutes)

### Étape 1 — Créer le projet Supabase

1. Va sur [supabase.com](https://supabase.com) → **New Project**
2. Note ton **Project URL** et ta **anon key** (Settings → API)
3. Va dans **SQL Editor → New Query**, colle tout le contenu de `supabase-schema.sql` et clique **Run**

### Étape 2 — Configurer Google OAuth

1. Va sur [console.cloud.google.com](https://console.cloud.google.com)
2. Crée un projet → **APIs & Services → Credentials → Create OAuth Client ID**
3. Type : **Web application**
4. Authorized redirect URIs : `https://VOTRE_PROJECT_ID.supabase.co/auth/v1/callback`
5. Copie le **Client ID** et **Client Secret**
6. Dans Supabase → **Authentication → Providers → Google** → Active + colle les clés

### Étape 3 — Configurer Discord OAuth

1. Va sur [discord.com/developers](https://discord.com/developers/applications) → **New Application**
2. **OAuth2 → Redirects** : ajoute `https://VOTRE_PROJECT_ID.supabase.co/auth/v1/callback`
3. Copie **Client ID** et **Client Secret**
4. Dans Supabase → **Authentication → Providers → Discord** → Active + colle les clés

### Étape 4 — Déployer sur Vercel

1. Push ce projet sur GitHub
2. Va sur [vercel.com](https://vercel.com) → **New Project** → importe ton repo
3. Dans **Environment Variables**, ajoute :
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://VOTRE_PROJECT_ID.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = VOTRE_ANON_KEY
   NEXT_PUBLIC_SITE_URL = https://VOTRE_DOMAINE.vercel.app
   ```
4. **Deploy** !

### Étape 5 — Mettre à jour les redirect URLs

Dans Supabase → **Authentication → URL Configuration** :
- Site URL : `https://VOTRE_DOMAINE.vercel.app`
- Redirect URLs : `https://VOTRE_DOMAINE.vercel.app/dashboard`

---

## 💻 Développement local

```bash
# 1. Installer les dépendances
npm install

# 2. Copier le fichier d'environnement
cp .env.local.example .env.local
# Remplis les valeurs Supabase dans .env.local

# 3. Lancer le serveur
npm run dev
# → http://localhost:3000
```

---

## 📁 Structure du projet

```
todo-web/
├── app/
│   ├── auth/page.tsx          — Page de connexion Google/Discord
│   ├── dashboard/page.tsx     — Page principale
│   ├── globals.css            — Styles globaux dark mode
│   └── layout.tsx
├── components/
│   ├── AddTask.tsx            — Formulaire d'ajout de tâche
│   ├── TaskItem.tsx           — Composant tâche avec timers
│   └── Sidebar.tsx            — Navigation latérale
├── hooks/
│   └── useTasks.ts            — Logic CRUD + timers Supabase
├── lib/
│   └── supabase.ts            — Client Supabase + types
├── middleware.ts               — Protection des routes auth
├── supabase-schema.sql        — Schéma base de données
└── .env.local.example         — Variables d'environnement
```

---

## ✨ Fonctionnalités

- 🔐 Connexion Google & Discord — chaque utilisateur a ses données privées
- ✅ Tâches avec priorités (haute, normale, basse)
- 📁 Catégories personnalisées avec couleurs
- 🔁 Récurrences par intervalle (minutes → mois) ou jours de la semaine avec heure précise
- ⏱ Timer countdown avant la prochaine occurrence
- 🔔 Décochage automatique + timer "refaisable depuis X"
- 📅 Dates d'échéance one-shot
- 📝 Notes et sous-tâches
- 🔍 Recherche et filtres (à faire, en retard)
- 📊 Stats (total complétées, streak)
- 💾 Sauvegarde temps réel via Supabase
- 🌙 Dark mode

---

## 🔧 Partager avec tes amis

Il suffit de leur envoyer le lien Vercel. Chacun se connecte avec son compte Google ou Discord et a ses propres tâches privées. Aucune installation requise !
