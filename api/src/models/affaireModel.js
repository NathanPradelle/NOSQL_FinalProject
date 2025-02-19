const mongoose = require('mongoose');

const AffaireSchema = new mongoose.Schema({
    titre: { type: String, required: true },
    date: { type: Date, default: Date.now },
    lieu: {
        adresse: String,
        lat: Number,
        lng: Number,
        type: { type: String, enum: ["rue", "commerce", "domicile", "parking", "autre"], default: "autre" }  // Ajout ici
    },
    individus: [{ id: String, role: String }],
    temoignages: [{ temoin: String, declaration: String }],
    fadettes: [String]
});


module.exports = mongoose.model('Affaire', AffaireSchema);
