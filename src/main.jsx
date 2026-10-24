
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import './style.css';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) setMessage(error.message);
      setSession(data?.session ?? null);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
      }
    );

    return () => data.subscription.unsubscribe();
  }, []);

  async function handleLogin(event) {
    event.preventDefault();
    setBusy(true);
    setMessage('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) setMessage('Connexion impossible. Vérifiez votre e-mail et votre mot de passe.');

    setBusy(false);
  }

  async function handleLogout() {
    setMessage('');
    const { error } = await supabase.auth.signOut();

    if (error) setMessage('La déconnexion a échoué. Réessayez.');
  }

  const pageStyle = {
    minHeight: '100vh',
    background: '#f4f7f6',
    color: '#18332b',
    fontFamily: 'Arial, sans-serif',
    padding: '24px',
    boxSizing: 'border-box',
  };

  const cardStyle = {
    background: '#ffffff',
    padding: '24px',
    borderRadius: '14px',
    border: '1px solid #dce7e2',
    boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
  };

  if (loading) {
    return <main style={pageStyle}>Vérification de votre connexion…</main>;
  }

  if (!supabase) {
    return (
      <main style={pageStyle}>
        <section style={{ ...cardStyle, maxWidth: '560px', margin: '60px auto' }}>
          <h1>Configuration nécessaire</h1>
          <p>
            Les variables Supabase ne sont pas disponibles.
            Vérifiez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
            dans les paramètres Vercel, puis redéployez le projet.
          </p>
        </section>
      </main>
    );
  }

  if (!session) {
    return (
      <main style={pageStyle}>
        <section style={{ ...cardStyle, maxWidth: '420px', margin: '60px auto' }}>
          <p style={{ color: '#16805d', fontWeight: 'bold' }}>
            BARKA ÉNERGIE
          </p>
          <h1>Gestion du grossiste de gaz</h1>
          <p>Connectez-vous à votre espace personnel.</p>

          <form onSubmit={handleLogin}>
            <label htmlFor="email">Adresse e-mail</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              style={{
                display: 'block',
                boxSizing: 'border-box',
                width: '100%',
                padding: '12px',
                margin: '8px 0 18px',
                border: '1px solid #bdcec6',
                borderRadius: '8px',
              }}
            />

            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              style={{
                display: 'block',
                boxSizing: 'border-box',
                width: '100%',
                padding: '12px',
                margin: '8px 0 18px',
                border: '1px solid #bdcec6',
                borderRadius: '8px',
              }}
            />

            <button
              type="submit"
              disabled={busy}
              style={{
                width: '100%',
                padding: '13px',
                border: 'none',
                borderRadius: '8px',
                background: '#167653',
                color: '#ffffff',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              {busy ? 'Connexion en cours…' : 'Se connecter'}
            </button>
          </form>

          {message && (
            <p role="alert" style={{ color: '#b42318', marginTop: '16px' }}>
              {message}
            </p>
          )}
        </section>
      </main>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <p className="eyebrow">BARKA ÉNERGIE</p>
          <h1>Gestion du grossiste de gaz</h1>
          <p className="subtitle">Tableau de bord de gestion</p>
        </div>
        <button type="button" onClick={handleLogout}>
          Se déconnecter
        </button>
      </header>

      <main>
        <section className="welcome">
          <h2>Bienvenue dans votre espace de gestion</h2>
          <p>Connecté avec : {session.user.email}</p>
          <p>
            Gérez progressivement vos bouteilles, livraisons, clients,
            recettes et dépenses.
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
            <strong>500 F CFA</strong>
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
          Espace connecté. Les modules de saisie et les données restent à
          configurer et à tester.
        </footer>
      </main>
      {message && <p role="alert">{message}</p>}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);

