const express = require('express');
const router = express.Router();
const Fadette = require('../models/fadetteModel');
const driver = require('../config/neo4j');

// ➤ Ajouter une fadette (MongoDB + Neo4J)
router.post('/', async (req, res) => {
    const session = driver.session();
    try {
        const newFadette = new Fadette(req.body);
        await newFadette.save();

        // Ajouter les relations d'appels dans Neo4J
        for (let appel of newFadette.appels_recus) {
            await session.run(`
                MATCH (a:Individu {telephone: $de}), (b:Individu {telephone: $numero})
                CREATE (a)-[:APPELLE {date: $date, antenne: $antenne}]->(b)
            `, { de: appel.de, numero: newFadette.numero, date: appel.date, antenne: appel.antenne });
        }

        for (let appel of newFadette.appels_emis) {
            await session.run(`
                MATCH (a:Individu {telephone: $numero}), (b:Individu {telephone: $vers})
                CREATE (a)-[:APPELLE {date: $date, antenne: $antenne}]->(b)
            `, { numero: newFadette.numero, vers: appel.vers, date: appel.date, antenne: appel.antenne });
        }

        res.status(201).json(newFadette);
    } catch (err) {
        res.status(400).json({ error: err.message });
    } finally {
        await session.close();
    }
});

// ➤ Obtenir toutes les fadettes
router.get('/', async (req, res) => {
    try {
        const fadettes = await Fadette.find();
        res.json(fadettes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ➤ Obtenir une fadette par numéro de téléphone
router.get('/:numero', async (req, res) => {
    try {
        const fadette = await Fadette.findOne({ numero: req.params.numero });
        if (!fadette) return res.status(404).json({ error: "Fadette non trouvée" });
        res.json(fadette);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ➤ Supprimer une fadette (MongoDB + Neo4J)
router.delete('/:numero', async (req, res) => {
    const session = driver.session();
    try {
        const fadette = await Fadette.findOneAndDelete({ numero: req.params.numero });
        if (!fadette) return res.status(404).json({ error: "Fadette non trouvée" });

        // Supprimer les relations téléphoniques dans Neo4J
        await session.run(`
            MATCH ()-[r:APPELLE]->()
            WHERE r.antenne IN $antennes
            DELETE r
        `, { antennes: fadette.appels_recus.map(a => a.antenne).concat(fadette.appels_emis.map(a => a.antenne)) });

        res.json({ message: "Fadette supprimée !" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        await session.close();
    }
});

router.get('/numeros/pivot', async (req, res) => {
    const session = driver.session();
    try {
        const result = await session.run(`
            MATCH (s1:Individu)-[:APPELLE]->(p:Individu)<-[:APPELLE]-(s2:Individu)
            WHERE s1.statut = "suspect" AND s2.statut = "suspect" AND s1 <> s2
            RETURN p.telephone AS numero_pivot, COUNT(*) AS nombre_de_suspects
            ORDER BY nombre_de_suspects DESC
            LIMIT 5
        `);

        res.json(result.records.map(record => ({
            numero: record.get('numero_pivot'),
            nombre_de_suspects: record.get('nombre_de_suspects')
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        await session.close();
    }
});

router.get('/:antenne/individus', async (req, res) => {
    const session = driver.session();
    try {
        const result = await session.run(`
            MATCH (a:Individu)-[:SE_CONNECTE_A]->(ant:Antenne {id: $antenne})
            RETURN a.nom AS nom, a.id AS id
        `, { antenne: req.params.antenne });

        res.json(result.records.map(record => ({
            id: record.get('id'),
            nom: record.get('nom')
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        await session.close();
    }
});

router.get('/antenne/:antenne/individus', async (req, res) => {
    const session = driver.session();
    try {
        const result = await session.run(`
            MATCH (a:Individu)-[:SE_CONNECTE_A]->(ant:Antenne {id: $antenne})
            RETURN a.nom AS nom, a.id AS id
        `, { antenne: req.params.antenne });

        res.json(result.records.map(record => ({
            id: record.get('id'),
            nom: record.get('nom')
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        await session.close();
    }
});

module.exports = router;
