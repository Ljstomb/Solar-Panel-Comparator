import React, { useState, useEffect } from 'react';

const panelTypes = [
  {
    name: 'Monocrystalline',
    efficiency: 0.20,
    costPerWatt: 1.0,
    maintenance: 0.01,
    installCostPerPanel: 200
  },
  {
    name: 'Polycrystalline',
    efficiency: 0.17,
    costPerWatt: 0.8,
    maintenance: 0.015,
    installCostPerPanel: 180
  },
  {
    name: 'Thin-Film (CIGS)',
    efficiency: 0.13,
    costPerWatt: 0.7,
    maintenance: 0.02,
    installCostPerPanel: 150
  }
];

const usageProfiles = {
  Residential: 30,
  Commercial: 300,
  Industrial: 3000
};

const SolarCalculator = () => {
  const [location, setLocation] = useState('');
  const [profile, setProfile] = useState('Residential');
  const [dailyUsage, setDailyUsage] = useState(30);
  const [sunlightHours, setSunlightHours] = useState(4);
  const [budget, setBudget] = useState(10000);

  useEffect(() => {
    setDailyUsage(usageProfiles[profile]);
  }, [profile]);

  useEffect(() => {
    if (location) {
      fetch(`https://developer.nrel.gov/api/solar/solar_resource/v1.json?api_key=DEMO_KEY&address=${location}`)
        .then(res => res.json())
        .then(data => {
          if (data.outputs && data.outputs.avg_ghi) {
            setSunlightHours((data.outputs.avg_ghi.annual / 1000) * 24 / 365);
          }
        })
        .catch(err => console.error('Failed to fetch irradiance data', err));
    }
  }, [location]);

  const dailyKWhToWatts = dailyUsage * 1000;
  const requiredSystemSizeKW = dailyKWhToWatts / (sunlightHours * 1000);

  const calculate = () => {
    return panelTypes.map((panel) => {
      const panelOutput = 300; // avg rated output in watts
      const totalPanels = Math.ceil((requiredSystemSizeKW * 1000) / panelOutput);
      const systemCost = totalPanels * (panel.costPerWatt * panelOutput + panel.installCostPerPanel);
      const annualMaintenance = totalPanels * panel.maintenance * panelOutput;
      return {
        ...panel,
        totalPanels,
        systemCost,
        annualMaintenance
      };
    });
  };

  const results = calculate();

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem' }}>
      <h1>Solar Panel Cost & Efficiency Comparator</h1>

      <label>
        Location:
        <input type="text" placeholder="Enter your location (e.g., Phoenix, AZ)" value={location} onChange={(e) => setLocation(e.target.value)} />
      </label>

      <br /><br />

      <label>
        Select Profile:
        <select value={profile} onChange={(e) => setProfile(e.target.value)}>
          {Object.keys(usageProfiles).map((key) => (
            <option key={key} value={key}>{key}</option>
          ))}
        </select>
      </label>

      <br /><br />

      <label>
        Average Daily Electricity Usage (kWh):
        <input type="number" value={dailyUsage} onChange={(e) => setDailyUsage(Number(e.target.value))} />
      </label>

      <br /><br />

      <label>
        Average Sunlight Hours per Day:
        <input type="number" value={sunlightHours.toFixed(2)} readOnly />
      </label>

      <br /><br />

      <label>
        Budget ($):
        <input type="number" value={budget} onChange={(e) => setBudget(Number(e.target.value))} />
      </label>

      <br /><br />

      {results.map((res, idx) => (
        <div key={idx} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem' }}>
          <h2>{res.name}</h2>
          <p>Efficiency: {(res.efficiency * 100).toFixed(1)}%</p>
          <p>Panels Needed: {res.totalPanels}</p>
          <p>Total System Cost: ${res.systemCost.toLocaleString()}</p>
          <p>Annual Maintenance Cost: ${res.annualMaintenance.toFixed(2)}</p>
          <p>{res.systemCost <= budget ? '✅ Within Budget' : '❌ Exceeds Budget'}</p>
        </div>
      ))}
    </div>
  );
};

export default SolarCalculator;
