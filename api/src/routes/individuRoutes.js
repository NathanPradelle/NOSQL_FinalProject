const express = require('express');
const router = express.Router();
const Individu = require('../models/individuModel');
const driver = require('../config/neo4j');

// ➤ Ajouter un individu (MongoDB + Neo4J)
router.post('/', async (req, res) => {
    const session = driver.session();
    try {
        // Ajouter l'individu dans MongoDB
        const newIndividu = new Individu(req.body);
        await newIndividu.save();

        // Ajouter l'individu dans Neo4J
        const query = `CREATE (i:Individu {id: $id, nom: $nom, statut: $statut, telephone: $telephone})`;
        await session.run(query, {
            id: newIndividu._id.toString(),
            nom: newIndividu.nom,
            statut: newIndividu.statut,
            telephone: newIndividu.telephone || ""
        });

        res.status(201).json(newIndividu);
    } catch (err) {
        res.status(400).json({ error: err.message });
    } finally {
        await session.close();
    }
});

// ➤ Obtenir tous les individus (MongoDB)
router.get('/', async (req, res) => {
    try {
        const individus = await Individu.find();
        res.json(individus);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ➤ Obtenir un individu par ID (MongoDB)
router.get('/:id', async (req, res) => {
    try {
        const individu = await Individu.findById(req.params.id);
        if (!individu) return res.status(404).json({ error: "Individu non trouvé" });
        res.json(individu);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ➤ Mettre à jour un individu (MongoDB + Neo4J)
router.put('/:id', async (req, res) => {
    const session = driver.session();
    try {
        const individu = await Individu.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!individu) return res.status(404).json({ error: "Individu non trouvé" });

        // Mettre à jour dans Neo4J
        const query = `
            MATCH (i:Individu {id: $id})
            SET i.nom = $nom, i.statut = $statut, i.telephone = $telephone
        `;
        await session.run(query, {
            id: individu._id.toString(),
            nom: individu.nom,
            statut: individu.statut,
            telephone: individu.telephone || ""
        });

        res.json(individu);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        await session.close();
    }
});

// ➤ Supprimer un individu (MongoDB + Neo4J)
router.delete('/:id', async (req, res) => {
    const session = driver.session();
    try {
        const individu = await Individu.findByIdAndDelete(req.params.id);
        if (!individu) return res.status(404).json({ error: "Individu non trouvé" });

        // Supprimer dans Neo4J
        const query = `MATCH (i:Individu {id: $id}) DETACH DELETE i`;
        await session.run(query, { id: req.params.id });

        res.json({ message: "Individu supprimé !" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        await session.close();
    }
});

router.get('/:id/relations', async (req, res) => {
    const session = driver.session();
    try {
        const result = await session.run(`
            MATCH (a:Individu {id: $id})-[r:APPELLE]->(b:Individu)
            RETURN a.nom AS appelant, b.nom AS destinataire, r.date AS date, r.antenne AS antenne
        `, { id: req.params.id });

        res.json(result.records.map(record => ({
            appelant: record.get('appelant'),
            destinataire: record.get('destinataire'),
            date: record.get('date'),
            antenne: record.get('antenne')
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        await session.close();
    }
});

router.get('/:id/affaires', async (req, res) => {
    try {
        const affaires = await Affaire.find({ "individus.id": req.params.id });
        res.json(affaires);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id/temoignages', async (req, res) => {
    try {
        const temoignages = await Affaire.find({ "temoignages.temoin": req.params.id }, { temoignages: 1, _id: 0 });
        res.json(temoignages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id/contacts', async (req, res) => {
    const session = driver.session();
    try {
        const result = await session.run(`
            MATCH (a:Individu {id: $id})-[:APPELLE]->(b:Individu)
            RETURN b.nom AS contact, b.id AS id
        `, { id: req.params.id });

        res.json(result.records.map(record => ({
            id: record.get('id'),
            nom: record.get('contact')
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        await session.close();
    }
});

router.get('/:id/full-profile', async (req, res) => {
    const session = driver.session();
    try {
        const affaires = await Affaire.find({ "individus.id": req.params.id });

        const result = await session.run(`
            MATCH (a:Individu {id: $id})-[:APPELLE]->(b:Individu)
            RETURN b.nom AS contact, b.id AS id
        `, { id: req.params.id });

        res.json({
            affaires,
            contacts: result.records.map(record => ({
                id: record.get('id'),
                nom: record.get('contact')
            }))
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        await session.close();
    }
});

// ➤ Trouver les suspects ayant appelé un même numéro
router.get('/numero/:telephone', async (req, res) => {
    const session = driver.session();
    try {
        const result = await session.run(`
            MATCH (s:Individu)-[:APPELLE]->(t:Individu {telephone: $telephone})
            WHERE s.statut = "suspect"
            RETURN s.nom AS suspect, s.id AS id
        `, { telephone: req.params.telephone });

        res.json(result.records.map(record => ({
            id: record.get('id'),
            nom: record.get('suspect')
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        await session.close();
    }
});

// ➤ Trouver les intermédiaires entre deux suspects
router.get('/:id1/:id2/intermediaire', async (req, res) => {
    const session = driver.session();
    try {
        const result = await session.run(`
            MATCH (s1:Individu {id: $id1})-[:APPELLE]->(i:Individu)-[:APPELLE]->(s2:Individu {id: $id2})
            RETURN i.nom AS intermediaire, i.id AS id
        `, { id1: req.params.id1, id2: req.params.id2 });

        res.json(result.records.map(record => ({
            id: record.get('id'),
            nom: record.get('intermediaire')
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        await session.close();
    }
});

// ➤ Vérifier si un suspect était à proximité d’un crime ET a appelé après
const Affaire = require('../models/affaireModel');

router.get('/:id/proximite/:affaire', async (req, res) => {
    const session = driver.session();
    try {
        // Récupérer le lieu du crime depuis MongoDB
        const affaire = await Affaire.findById(req.params.affaire);
        if (!affaire) return res.status(404).json({ error: "Affaire non trouvée" });

        // Vérifier si l'individu était proche ET a passé un appel après
        const result = await session.run(`
            MATCH (s:Individu {id: $id})-[:SE_CONNECTE_A]->(a:Antenne)
            WHERE a.localisation CONTAINS $lieu
            WITH s
            MATCH (s)-[:APPELLE]->(t:Individu)
            RETURN t.nom AS contact, t.id AS id
        `, { id: req.params.id, lieu: affaire.lieu.adresse });

        res.json({
            lieu_crime: affaire.lieu.adresse,
            contacts_apres: result.records.map(record => ({
                id: record.get('id'),
                nom: record.get('contact')
            }))
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        await session.close();
    }
});

router.get('/suspects/multi-affaires', async (req, res) => {
    try {
        const suspects = await Affaire.aggregate([
            { $unwind: "$individus" },
            { $group: { _id: "$individus.id", nombre_affaires: { $sum: 1 } } },
            { $match: { nombre_affaires: { $gte: 2 } } },
            { $sort: { nombre_affaires: -1 } }
        ]);

        res.json(suspects);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/suspects/domino', async (req, res) => {
    const session = driver.session();
    try {
        const result = await session.run(`
            MATCH (s1:Individu)-[:APPELLE]->(s2:Individu)-[:APPELLE]->(s3:Individu)
            WHERE s1.statut = "suspect" AND s3.statut = "suspect"
            RETURN s1.nom AS initiateur, s2.nom AS intermédiaire, s3.nom AS final
        `);

        res.json(result.records.map(record => ({
            initiateur: record.get('initiateur'),
            intermediaire: record.get('intermédiaire'),
            final: record.get('final')
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        await session.close();
    }
});

module.exports = router;
