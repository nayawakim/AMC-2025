# AMC-2025

Application mobile développée dans le cadre de la **Compétition de développement mobile collégiale et universitaire AMC 2025**, organisée par **ApplETS** à Montréal.

## Capture d'écran
<img width="510" height="1048" alt="Capture d’écran 2026-03-19 095843" src="https://github.com/user-attachments/assets/9cc161b9-e37f-42a8-b32f-4cdf6ba2239e" />
<img width="512" height=<img width="515" height="1075" alt="Capture d’écran 2026-03-19 095929" src="https://github.com/user-attachments/assets/ca550f0a-87af-4172-94ec-926d037adf20" />
<img width="515" height="1075" alt="Capture d’écran 2026-03-19 095929" src="https://github.com/user-attachments/assets/53f969c1-7dc2-4e71-ac48-1b5868f84edc" />
<img width="511" height="1076" alt="Capture d’écran 2026-03-19 095947" src="https://github.com/user-attachments/assets/eb0858a1-c56c-4268-94b5-fdba5cd326ae" />

## Aperçu du projet

AMC-2025 est une application mobile de survie en contexte d’**apocalypse zombie**. Elle combine une **carte collaborative**, un **assistant IA**, et un **scan QR** afin d’aider les utilisateurs à se repérer, signaler des zones dangereuses et interagir rapidement avec l’application dans un univers immersif.

L’application a été développée avec **Expo / React Native** et s’appuie sur **Convex** pour la logique backend temps réel. Le projet inclut aussi l’utilisation de la **caméra**, de la **géolocalisation**, de **Google Maps**, et d’un stockage local avec **SQLite**.

## Contexte

La compétition AMC 2025 est une compétition collégiale et universitaire de développement mobile. Elle accueille des équipes de **4 à 5 personnes**, offre des **prix** et laisse aux participants le choix des outils et plateformes de développement.

Ce dépôt contient notre proposition d’application mobile réalisée dans ce contexte hackathon.

## Fonctionnalités principales

### 1. Carte interactive de survie
- Affichage de la position de l’utilisateur sur la carte
- Consultation de points utiles : **abris**, **nourriture/eau**, **médicaments**
- Signalement de **zones de danger** avec niveau de sévérité
- Ajout, modification et suppression de points sur la carte
- Visualisation de zones dangereuses avec rayon et couleur selon la gravité

### 2. Chat IA intégré
- Interface de discussion immersive dans un univers d’apocalypse zombie
- Envoi de messages à une IA conseillère
- Réponses générées via l’API OpenAI à travers une action Convex
- Possibilité de capturer une photo depuis la caméra dans l’interface de chat

### 3. Scan QR
- Lecture de codes QR avec la caméra
- Affichage immédiat du contenu scanné
- Fonctionnalité pensée pour l’identification rapide d’éléments ou d’utilisateurs dans l’univers du projet

### 4. Stockage local et expérimentation
- Utilisation de **SQLite** pour stocker certains identifiants localement
- Sauvegarde de QR codes scannés dans une base locale
- Page de test pour valider la logique de persistance locale

## Stack technique

### Frontend
- React Native
- Expo
- Expo Router
- TypeScript
- NativeWind / Tailwind CSS

### Fonctionnalités mobiles
- Expo Camera
- Expo Location
- React Native Maps
- Expo SQLite
- Expo Haptics

### Backend / services
- Convex
- OpenAI API

## Structure du projet

```bash
AMC-2025/
├── app/                  # Routes et écrans Expo Router
│   ├── (tabs)/
│   │   ├── map.tsx       # Carte interactive
│   │   ├── chat.tsx      # Chat IA + caméra
│   │   └── scan.tsx      # Scan QR
├── components/           # Composants réutilisables UI et carte
├── convex/               # Backend Convex (chat, map, reports, schema)
├── lib/                  # Utilitaires, thème, SQLite
├── assets/               # Icônes, images et ressources visuelles
└── constants/            # Constantes globales du projet
