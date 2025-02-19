const faker = require('faker');
require('dotenv').config();

const connectDB = require('../config/db');  // Connexion MongoDB
const driver = require('../config/neo4j');  // Connexion Neo4J
const Affaire = require('../models/affaireModel');
const Individu = require('../models/individuModel');
const Fadette = require('../models/fadetteModel');

// Fonction principale
const generateData = async () => {
    console.log("Connexion aux bases...");
    await connectDB();  // MongoDB
    const session = driver.session(); // Neo4J

    console.log("Suppression des anciennes données...");
    await Affaire.deleteMany({});
    await Individu.deleteMany({});
    await Fadette.deleteMany({});
    await session.run("MATCH (n) DETACH DELETE n");
    await session.close(); // Fermer après la suppression

    console.log("Génération des individus...");

    // Liste des individus principaux
    const individus = [
        { nom: "Jean Dupont", statut: "suspect", telephone: "0600000001", dangerosite: "élevé" },
        { nom: "Paul Martin", statut: "suspect", telephone: "0600000002", dangerosite: "moyen" },
        { nom: "Alice Bernard", statut: "témoin", telephone: "0600000003", dangerosite: "faible" },
        { nom: "Jacques Morel", statut: "suspect", telephone: "0600000004", dangerosite: "élevé" },
        { nom: "David Leclerc", statut: "victime", telephone: "0600000005", dangerosite: "faible" },
        { nom: "Antoine Rivière", statut: "suspect", telephone: "0600000006", dangerosite: "moyen" }
    ];

    // Génération de 20 individus aléatoires supplémentaires
    for (let i = 0; i < 20; i++) {
        individus.push({
            nom: faker.name.findName(),
            statut: faker.random.arrayElement(["suspect", "témoin", "victime", "autre"]),
            telephone: faker.phone.phoneNumber("060########"),
            dangerosite: faker.random.arrayElement(["faible", "moyen", "élevé"])
        });
    }

    const individusMongo = await Individu.insertMany(individus);
    const sessionNeo = driver.session();

    for (let ind of individusMongo) {
        await sessionNeo.run(
            "CREATE (i:Individu {id: $id, nom: $nom, statut: $statut, telephone: $telephone, dangerosite: $dangerosite})",
            { id: ind._id.toString(), nom: ind.nom, statut: ind.statut, telephone: ind.telephone, dangerosite: ind.dangerosite }
        );
    }

    await sessionNeo.close();

    console.log("Génération des affaires...");

    const affaires = [
        {
            titre: "Braquage de commerce",
            lieu: { adresse: "10 rue du Marché, Paris", lat: 48.8566, lng: 2.3522, type: "commerce" },
            individus: [ { id: individusMongo[0]._id, role: "suspect" }, { id: individusMongo[1]._id, role: "suspect" } ]
        },
        {
            titre: "Vol de voiture dans un parking",
            lieu: { adresse: "Parking Vinci, Lyon", lat: 45.764, lng: 4.8357, type: "parking" },
            individus: [ { id: individusMongo[3]._id, role: "suspect" } ]
        }
    ];

    // Génération de 20 affaires supplémentaires
    for (let i = 0; i < 20; i++) {
        affaires.push({
            titre: `Affaire #${i + 3}: ` + faker.lorem.words(3),
            lieu: {
                adresse: faker.address.streetAddress(),
                lat: faker.address.latitude(),
                lng: faker.address.longitude(),
                type: faker.random.arrayElement(["rue", "commerce", "domicile", "parking", "autre"])
            },
            individus: []
        });
    }

    await Affaire.insertMany(affaires);

    console.log("Génération des fadettes...");

    const sessionNeo2 = driver.session();

    for (let i = 0; i < 20; i++) {
        await sessionNeo2.run(
            "MATCH (a:Individu), (b:Individu) WHERE rand() < 0.2 CREATE (a)-[:APPELLE {date: $date, nature: $nature}]->(b)",
            { date: faker.date.past().toISOString(), nature: faker.random.arrayElement(["normal", "suspect", "anonyme"]) }
        );
    }

    await sessionNeo2.close();

    console.log("Données générées avec succès !");
};

// Exécuter le script
generateData()
    .then(() => {
        console.log("Génération terminée !");
        process.exit(0); // Quitte proprement le script
    })
    .catch(err => {
        console.error("Erreur lors de la génération :", err);
        process.exit(1);
    });
