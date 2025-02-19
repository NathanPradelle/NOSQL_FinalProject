const express = require('express');
const connectDB = require('./src/config/db');
const driver = require('./src/config/neo4j');
require('dotenv').config();

const app = express();
app.use(express.json());

// Connexion aux bases
connectDB();
driver.verifyConnectivity().then(() => console.log("Neo4J connecté !")).catch(console.error);

// Routes
app.get("/", (req, res) => res.send("API CrimeLab en cours d'exécution"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));

const affaireRoutes = require('./src/routes/affaireRoutes');
app.use('/affaires', affaireRoutes);

const individuRoutes = require('./src/routes/individuRoutes');
app.use('/individus', individuRoutes);

const fadetteRoutes = require('./src/routes/fadetteRoutes');
app.use('/fadettes', fadetteRoutes);


