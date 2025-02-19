# 🚔 CrimeLab - Analyse Criminelle avec Neo4J & MongoDB

CrimeLab est un projet permettant d'analyser des réseaux criminels en utilisant **Neo4J** pour les connexions et **MongoDB** pour le stockage des affaires criminelles. L'objectif est de **visualiser et analyser les relations entre suspects, témoins, lieux et appels téléphoniques**.

---

## 📌 Installation & Setup

### 1️⃣ **Cloner le dépôt**  
```sh
git clone https://github.com/votre-utilisateur/CrimeLab.git
cd CrimeLab
```

### 2️⃣ **Créer un fichier `.env`**  
Ajoutez un fichier `.env` à la racine avec :
```ini
MONGO_URI=mongodb://mongodb:27017/crimelab
NEO4J_URI=bolt://neo4j:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=test
```

### 3️⃣ **Lancer l'environnement avec Docker**  
Assurez-vous d'avoir **Docker** installé, puis exécutez :
```sh
docker-compose up -d
```

### 4️⃣ **Générer des données de test**
```sh
docker exec -it node-api node src/utils/generateData.js
```

### 5️⃣ **Lancer les requêtes avec Postman**  
Utilisez le fichier **Postman Collection** disponible dans le projet pour tester toutes les routes rapidement.

---

## 📌 Fonctionnalités principales
✅ **Stockage et gestion des affaires criminelles (MongoDB)**  
✅ **Analyse des appels téléphoniques et des connexions (Neo4J)**  
✅ **Visualisation des liens entre suspects, témoins, affaires et fadettes**  
✅ **Requêtes avancées pour analyser les comportements suspects**  

🚀 **Projet développé dans le cadre de l'étude des bases NoSQL**.  
📌 **Auteur** : [Votre Nom]

