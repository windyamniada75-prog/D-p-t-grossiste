
import React from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

function App() {
  return (
    <div className="app">
      <header className="header">
        <div>
          <p className="eyebrow">BARKA ÉNERGIE</p>
          <h1>Gestion du grossiste de gaz</h1>
          <p className="subtitle">Tableau de bord de gestion</p>
        </div>
        <span className="status">Application en préparation</span>
      </header>

      <main>
        <section className="welcome">
          <h2>Bienvenue dans votre espace de gestion</h2>
          <p>
            Gérez progressivement vos bouteilles, vos livraisons,
            vos clients, vos recettes et les dépenses de votre entreprise.
          </p>
        </section>

        <section className="stats">
          <article className="stat-card">
            <span>Chauffeurs</span>
            <strong>4</strong>
            <small>Équipe de livraison</small>
          </article>
          <article className="stat-card">
            <span>Capacité totale des camions</span>
            <strong>2 205</strong>
            <small>Bouteilles par chargement</small>
          </article>
          <article className="stat-card">
            <span>Ration journalière</span>
            <strong>500 F</strong>
            <small>Par travailleur présent</small>
          </article>
        </section>

        <h2 className="section-title">Modules de gestion</h2>
        <section className="modules">
          <article className="module-card">
            <span className="module-icon">🚚</span>
            <h3>Chauffeurs et camions</h3>
            <p>Suivi de l’équipe et des capacités de transport.</p>
          </article>
          <article className="module-card">
            <span className="module-icon">🧯</span>
            <h3>Stock de bouteilles</h3>
            <p>Suivi des bouteilles de 6 kg et de 12 kg.</p>
          </article>
          <article className="module-card">
            <span className="module-icon">📦</span>
            <h3>Livraisons et clients</h3>
            <p>Suivi des livraisons aux dépôts agréés.</p>
          </article>
          <article className="module-card">
            <span className="module-icon">💰</span>
            <h3>Comptabilité</h3>
            <p>Suivi des recettes et des dépenses.</p>
          </article>
          <article className="module-card">
            <span className="module-icon">🧾</span>
            <h3>Rations journalières</h3>
            <p>500 F CFA par travailleur présent.</p>
          </article>
          <article className="module-card">
            <span className="module-icon">📊</span>
            <h3>Rapports</h3>
            <p>Préparation des bilans et du suivi mensuel.</p>
          </article>
        </section>

        <footer>
          Version de démarrage — les données réelles seront ajoutées
          après la configuration de la base de données sécurisée.
        </footer>
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);

