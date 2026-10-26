
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
  const [clients, setClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('tous');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    nom: '',
    telephone: '',
    adresse: '',
    actif: true,
  });

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let alive = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!alive) return;
      if (error) setMessage('Impossible de vérifier la connexion.');
      setSession(data?.session ?? null);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (alive) setSession(newSession);
      }
    );

    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session || !supabase) {
      setClients([]);
      return;
    }

    loadClients();
  }, [session]);

  async function handleLogin(event) {
    event.preventDefault();
    setBusy(true);
    setMessage('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(
        'Connexion impossible. Vérifiez votre e-mail et votre mot de passe.'
      );
    }

    setBusy(false);
  }

  async function handleLogout() {
    setMessage('');
    const { error } = await supabase.auth.signOut();

    if (error) setMessage('La déconnexion a échoué. Réessayez.');
  }

  async function loadClients() {
    setClientsLoading(true);
    setMessage('');

    const { data, error } = await supabase
      .from('clients')
      .select('id, nom, telephone, adresse, actif, created_at')
      .order('nom', { ascending: true });

    if (error) {
      setMessage(
        `Chargement des clients impossible : ${error.message}`
      );
    } else {
      setClients(data ?? []);
    }

    setClientsLoading(false);
  }

  function updateField(event) {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  function resetForm() {
    setForm({
      nom: '',
      telephone: '',
      adresse: '',
      actif: true,
    });
    setEditingId(null);
  }

  function editClient(client) {
    setEditingId(client.id);
    setForm({
      nom: client.nom ?? '',
      telephone: client.telephone ?? '',
      adresse: client.adresse ?? '',
      actif: client.actif,
    });
    setMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function saveClient(event) {
    event.preventDefault();

    if (!session?.user?.id) {
      setMessage('Vous devez être connecté pour enregistrer un client.');
      return;
    }

    const nom = form.nom.trim();

    if (!nom) {
      setMessage('Le nom du client est obligatoire.');
      return;
    }

    setSaving(true);
    setMessage('');

    const clientData = {
      nom,
      telephone: form.telephone.trim() || null,
      adresse: form.adresse.trim() || null,
      actif: form.actif,
    };

    let result;

    if (editingId) {
      result = await supabase
        .from('clients')
        .update(clientData)
        .eq('id', editingId)
        .select('id')
        .maybeSingle();
    } else {
      result = await supabase
        .from('clients')
        .insert({
          ...clientData,
          created_by: session.user.id,
        })
        .select('id')
        .single();
    }

    if (result.error) {
      setMessage(
        `Enregistrement impossible : ${result.error.message}`
      );
    } else if (!result.data) {
      setMessage(
        'Aucun client n’a été modifié. Vérifiez vos droits d’accès.'
      );
    } else {
      setMessage(
        editingId
          ? 'Les informations du client ont été mises à jour.'
          : 'Le client a été enregistré avec succès.'
      );

      resetForm();
      await loadClients();
    }

    setSaving(false);
  }

  async function toggleClient(client) {
    const action = client.actif ? 'désactiver' : 'activer';

    if (
      !window.confirm(
        `Voulez-vous vraiment ${action} le client « ${client.nom} » ?`
      )
    ) {
      return;
    }

    setMessage('');

    const { data, error } = await supabase
      .from('clients')
      .update({ actif: !client.actif })
      .eq('id', client.id)
      .select('id')
      .maybeSingle();

    if (error) {
      setMessage(`Modification impossible : ${error.message}`);
    } else if (!data) {
      setMessage(
        'Aucune modification effectuée. Vérifiez les droits d’accès.'
      );
    } else {
      setMessage(
        client.actif
          ? 'Le client a été désactivé.'
          : 'Le client a été réactivé.'
      );
      await loadClients();
    }
  }

  const visibleClients = clients.filter((client) => {
    const text = [
      client.nom,
      client.telephone,
      client.adresse,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const matchesSearch = text.includes(search.trim().toLowerCase());

    const matchesFilter =
      filter === 'tous' ||
      (filter === 'actifs' && client.actif) ||
      (filter === 'inactifs' && !client.actif);

    return matchesSearch && matchesFilter;
  });

  const activeCount = clients.filter((client) => client.actif).length;

  const pageStyle = {
    minHeight: '100vh',
    background: '#f4f7f6',
    color: '#18332b',
    fontFamily: 'Arial, sans-serif',
    padding: '24px',
    boxSizing: 'border-box',
  };

  const cardStyle = {
    background: '#fff',
    padding: '24px',
    borderRadius: '14px',
    border: '1px solid #dce7e2',
    boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
    marginBottom: '20px',
  };

  const inputStyle = {
    display: 'block',
    boxSizing: 'border-box',
    width: '100%',
    padding: '11px',
    marginTop: '6px',
    border: '1px solid #bdcec6',
    borderRadius: '8px',
    font: 'inherit',
  };

  const primaryButton = {
    padding: '11px 16px',
    border: 'none',
    borderRadius: '8px',
    background: '#167653',
    color: '#fff',
    fontWeight: 'bold',
    cursor: 'pointer',
  };

  const secondaryButton = {
    padding: '10px 14px',
    border: '1px solid #bdcec6',
    borderRadius: '8px',
    background: '#fff',
    color: '#18332b',
    cursor: 'pointer',
  };

  if (loading) {
    return <main style={pageStyle}>Vérification de votre connexion…</main>;
  }

  if (!supabase) {
    return (
      <main style={pageStyle}>
        <section style={{ ...cardStyle, maxWidth: 560, margin: '60px auto' }}>
          <h1>Configuration nécessaire</h1>
          <p>
            Vérifiez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans
            les variables d’environnement Vercel, puis redéployez.
          </p>
        </section>
      </main>
    );
  }

  if (!session) {
    return (
      <main style={pageStyle}>
        <section style={{ ...cardStyle, maxWidth: 420, margin: '60px auto' }}>
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
              style={inputStyle}
            />

            <label htmlFor="password" style={{ display: 'block', marginTop: 16 }}>
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              style={inputStyle}
            />

            <button
              type="submit"
              disabled={busy}
              style={{ ...primaryButton, width: '100%', marginTop: 20 }}
            >
              {busy ? 'Connexion en cours…' : 'Se connecter'}
            </button>
          </form>

          {message && <p role="alert">{message}</p>}
        </section>
      </main>
    );
  }

  return (
    <div style={pageStyle}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <p style={{ color: '#16805d', fontWeight: 'bold', marginBottom: 4 }}>
            BARKA ÉNERGIE
          </p>
          <h1 style={{ margin: '4px 0' }}>Gestion du grossiste de gaz</h1>
          <p style={{ margin: 0 }}>Connecté : {session.user.email}</p>
        </div>
        <button type="button" onClick={handleLogout} style={secondaryButton}>
          Se déconnecter
        </button>
      </header>

      {message && (
        <div
          role="status"
          style={{
            ...cardStyle,
            padding: 14,
            color: message.toLowerCase().includes('impossible') ||
              message.toLowerCase().includes('erreur')
              ? '#b42318'
              : '#166534',
          }}
        >
          {message}
        </div>
      )}

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <article style={cardStyle}>
          <span>Total des clients</span>
          <h2>{clients.length}</h2>
        </article>
        <article style={cardStyle}>
          <span>Clients actifs</span>
          <h2>{activeCount}</h2>
        </article>
        <article style={cardStyle}>
          <span>Clients inactifs</span>
          <h2>{clients.length - activeCount}</h2>
        </article>
      </section>

      <section style={cardStyle}>
        <h2>{editingId ? 'Modifier un client' : 'Ajouter un client'}</h2>
        <p>
          Enregistrez les dépôts agréés et les autres clients de votre société.
        </p>

        <form onSubmit={saveClient}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
            }}
          >
            <label>
              Nom du client ou du dépôt *
              <input
                name="nom"
                value={form.nom}
                onChange={updateField}
                required
                maxLength={150}
                style={inputStyle}
                placeholder="Nom du dépôt"
              />
            </label>

            <label>
              Téléphone
              <input
                name="telephone"
                type="tel"
                value={form.telephone}
                onChange={updateField}
                maxLength={40}
                style={inputStyle}
                placeholder="Numéro de téléphone"
              />
            </label>

            <label>
              Adresse
              <input
                name="adresse"
                value={form.adresse}
                onChange={updateField}
                maxLength={250}
                style={inputStyle}
                placeholder="Ville, quartier, repère"
              />
            </label>
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              margin: '18px 0',
            }}
          >
            <input
              type="checkbox"
              name="actif"
              checked={form.actif}
              onChange={updateField}
            />
            Client actif
          </label>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <button type="submit" disabled={saving} style={primaryButton}>
              {saving
                ? 'Enregistrement…'
                : editingId
                  ? 'Enregistrer les modifications'
                  : 'Enregistrer le client'}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                style={secondaryButton}
              >
                Annuler
              </button>
            )}
          </div>
        </form>
      </section>

      <section style={cardStyle}>
        <h2>Liste des clients</h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12,
            marginBottom: 18,
          }}
        >
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un client…"
            aria-label="Rechercher un client"
            style={{ ...inputStyle, marginTop: 0 }}
          />

          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            aria-label="Filtrer les clients"
            style={{ ...inputStyle, marginTop: 0 }}
          >
            <option value="tous">Tous les clients</option>
            <option value="actifs">Clients actifs</option>
            <option value="inactifs">Clients inactifs</option>
          </select>

          <button
            type="button"
            onClick={loadClients}
            disabled={clientsLoading}
            style={secondaryButton}
          >
            {clientsLoading ? 'Chargement…' : 'Actualiser la liste'}
          </button>
        </div>

        {clientsLoading ? (
          <p>Chargement des clients…</p>
        ) : visibleClients.length === 0 ? (
          <p>
            {clients.length === 0
              ? 'Aucun client enregistré pour le moment. Utilisez le formulaire ci-dessus pour en ajouter un.'
              : 'Aucun client ne correspond à votre recherche.'}
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: 650,
              }}
            >
              <thead>
                <tr style={{ textAlign: 'left', background: '#eef5f1' }}>
                  {['Nom', 'Téléphone', 'Adresse', 'Statut', 'Actions'].map(
                    (heading) => (
                      <th
                        key={heading}
                        style={{
                          padding: 12,
                          borderBottom: '1px solid #dce7e2',
                        }}
                      >
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {visibleClients.map((client) => (
                  <tr key={client.id}>
                    <td style={{ padding: 12, borderBottom: '1px solid #e5ece8' }}>
                      {client.nom}
                    </td>
                    <td style={{ padding: 12, borderBottom: '1px solid #e5ece8' }}>
                      {client.telephone || '—'}
                    </td>
                    <td style={{ padding: 12, borderBottom: '1px solid #e5ece8' }}>
                      {client.adresse || '—'}
                    </td>
                    <td style={{ padding: 12, borderBottom: '1px solid #e5ece8' }}>
                      {client.actif ? 'Actif' : 'Inactif'}
                    </td>
                    <td style={{ padding: 12, borderBottom: '1px solid #e5ece8' }}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => editClient(client)}
                          style={secondaryButton}
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleClient(client)}
                          style={secondaryButton}
                        >
                          {client.actif ? 'Désactiver' : 'Réactiver'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer style={{ textAlign: 'center', padding: 16, color: '#52675f' }}>
        Espace de gestion connecté. Les clients sont chargés depuis Supabase.
      </footer>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);


