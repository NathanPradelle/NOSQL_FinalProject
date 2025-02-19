const express = require('express');
const router = express.Router();
const Affaire = require('../models/affaireModel');

// ➤ Ajouter une nouvelle affaire
router.post('/', async (req, res) => {
    try {
        const newAffaire = new Affaire(req.body);
        await newAffaire.save();
        res.status(201).json(newAffaire);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// ➤ Obtenir toutes les affaires
router.get('/', async (req, res) => {
    try {
        const affaires = await Affaire.find();
        res.json(affaires);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ➤ Obtenir une affaire par son ID
router.get('/:id', async (req, res) => {
    try {
        const affaire = await Affaire.findById(req.params.id);
        if (!affaire) return res.status(404).json({ error: "Affaire non trouvée" });
        res.json(affaire);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ➤ Mettre à jour une affaire
router.put('/:id', async (req, res) => {
    try {
        const affaire = await Affaire.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!affaire) return res.status(404).json({ error: "Affaire non trouvée" });
        res.json(affaire);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ➤ Supprimer une affaire
router.delete('/:id', async (req, res) => {
    try {
        const affaire = await Affaire.findByIdAndDelete(req.params.id);
        if (!affaire) return res.status(404).json({ error: "Affaire non trouvée" });
        res.json({ message: "Affaire supprimée !" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/geo', async (req, res) => {
    try {
        const { lat, lng, radius } = req.query;
        const affaires = await Affaire.find({
            "lieu.lat": { $gte: lat - radius, $lte: lat + radius },
            "lieu.lng": { $gte: lng - radius, $lte: lng + radius }
        });
        res.json(affaires);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


module.exports = router;
