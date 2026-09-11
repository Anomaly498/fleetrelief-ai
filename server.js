const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { analyzeTransitIncident } = require('./bedrock');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'public')));

// Root route to serve the dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

// Health Check Route
app.get('/api/health', (req, res) => {
  res.json({ status: "OK", service: "FleetRelief Dispatcher" });
});

// Incident Dispatch Endpoint (Accepts both path formats)
app.post(['/api/agent/incident', '/agent/incident'], async (req, res) => {
  try {
    const { driverReport, routeName, targetLang } = req.body;

    if (!driverReport) {
      return res.status(400).json({ error: "driverReport is required" });
    }

    console.log(`[INCIDENT RECEIVED]: "${driverReport}" on ${routeName} (Mode: ${targetLang || 'MATCH_INPUT'})`);
    const triageResultString = await analyzeTransitIncident(
      driverReport, 
      routeName || "General Corridor", 
      targetLang || "MATCH_INPUT"
    );
    
    const parsedData = JSON.parse(triageResultString);

    res.status(200).json({
      success: true,
      agentDispatch: parsedData
    });
  } catch (err) {
    console.error("Agent Dispatch Error:", err);
    res.status(500).json({ error: "Failed to process incident with Bedrock", details: err.message });
  }
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`FleetRelief Agent Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;