const mongoose = require('mongoose');

const IndividuSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    age: Number,
    profession: String,
    statut: { type: String, enum: ["suspect", "témoin", "victime", "autre"], default: "autre" },
    telephone: { type: String, unique: true, sparse: true },
    dangerosite: { type: String, enum: ["faible", "moyen", "élevé"], default: "faible" },  // Ajout ici
});


module.exports = mongoose.model('Individu', IndividuSchema);
