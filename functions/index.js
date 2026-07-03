const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const aiPrediction = require("./aiPrediction");
const alertGenerator = require("./alertGenerator");
const reportGenerator = require("./reportGenerator");
const translate = require("./translate");

// Cloud function endpoints & event triggers
exports.predictMedicineDemand = aiPrediction.predictMedicineDemand;
exports.monitorStockThresholds = alertGenerator.monitorStockThresholds;
exports.generateDailyReport = reportGenerator.generateDailyReport;
exports.translateText = translate.translateText;
