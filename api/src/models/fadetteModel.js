const mongoose = require('mongoose');

const FadetteSchema = new mongoose.Schema({
    numero: { type: String, required: true },
    appels_recus: [{
        de: String,
        date: Date,
        antenne: String,
        nature: { type: String, enum: ["normal", "suspect", "anonyme"], default: "normal" }  // Ajout ici
    }],
    appels_emis: [{
        vers: String,
        date: Date,
        antenne: String,
        nature: { type: String, enum: ["normal", "suspect", "anonyme"], default: "normal" }  // Ajout ici
    }]
});


module.exports = mongoose.model('Fadette', FadetteSchema);
