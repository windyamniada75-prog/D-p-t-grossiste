import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import './style.css';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const pageStyle = { minHeight: '100vh', background: '#f4f7f6', color: '#18332b', fontFamily: 'Arial, sans-serif', boxSizing: 'border-box' };
const cardStyle = { background: '#fff', padding: 20, borderRadius: 12, border: '1px solid #dce7e2', boxShadow: '0 4px 16px rgba(0,0,0,.04)', marginBottom: 16 };
const inputStyle = { display: 'block', boxSizing: 'border-box', width: '100%', padding: 11, marginTop: 6, marginBottom: 14, border: '1px solid #bdcec6', borderRadius: 8, font: 'inherit' };
const buttonStyle = { padding: '10px 14px', border: 0, borderRadius: 8, background: '#167653', color: '#fff', fontWeight: 700, cursor: 'pointer' };

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [page, setPage] = useState('dashboard');
  const [clients, setClients] = useState([]);
    const [stockBouteilles, setStockBouteilles] = useState([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockFormat, setStockFormat] = useState('6');
  const [stockContenu, setStockContenu] = useState('vide');
  const [stockEtat, setStockEtat] = useState('utilisable');
  const [stockEmplacement, setStockEmplacement] = useState('depot');
  const [stockQuantite, setStockQuantite] = useState('');
  const [stockMessage, setStockMessage] = useState('');
  const [clientsLoading, setClientsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('tous');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ nom: '', telephone: '', adresse: '', actif: true });

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    let alive = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!alive) return;
      if (error) setMessage('Impossible de vérifier la connexion. Rechargez la page.');
      setSession(data?.session ?? null);
      setLoading(false);
    }).catch(() => {
      if (alive) { setMessage('Erreur lors de la vérification de la connexion.'); setLoading(false); }
    });
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (alive) { setSession(newSession); setPage('dashboard'); }
    });
    return () => { alive = false; data.subscription.unsubscribe(); };
  }, []);

 
  useEffect(() => {
    if (!session || !supabase) {
      setClients([]);
      setStockBouteilles([]);
      return;
    }
    loadClients();
    loadStockBouteilles();
  }, [session]);


  async function handleLogin(event) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true); setMessage('');
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage('Connexion impossible. Vérifiez votre e-mail et votre mot de passe.');
    } catch {
      setMessage('Erreur de connexion. Vérifiez votre connexion Internet puis réessayez.');
    } finally { setBusy(false); }
  }

  async function handleLogout() {
    if (!supabase) return;
    setMessage('');
    const { error } = await supabase.auth.signOut();
    if (error) setMessage('La déconnexion a échoué. Réessayez.');
    else { setPage('dashboard'); resetForm(); }
  }

  async function loadClients() {
    if (!supabase || !session) return;
    setClientsLoading(true);
    try {
      const { data, error } = await supabase.from('clients')
        .select('id, nom, telephone, adresse, actif, created_at')
        .order('nom', { ascending: true });
      if (error) setMessage(`Chargement des clients impossible : ${error.message}`);
      else setClients(data ?? []);
    } catch {
      setMessage('Impossible de contacter Supabase pour charger les clients.');
    } finally { setClientsLoading(false); }
  }
  async function loadStockBouteilles() {
    if (!supabase || !session) return;
    setStockLoading(true);
    setStockMessage('');

    try {
      const { data, error } = await supabase
        .from('stock_bouteilles')
        .select('id, format_kg, contenu, etat, emplacement, quantite, camion_id, client_id, created_at')
        .order('format_kg', { ascending: true });

      if (error) {
        setStockMessage('Chargement du stock impossible : ' + error.message);
      } else {
        setStockBouteilles(data || []);
      }
    } catch {
      setStockMessage('Impossible de contacter Supabase pour charger le stock.');
    } finally {
      setStockLoading(false);
    }
  }

  async function saveStockBouteilles(event) {
    event.preventDefault();

    if (!supabase || !session?.user?.id) {
      setStockMessage('Vous devez être connecté pour enregistrer le stock.');
      return;
    }

    const quantite = Number(stockQuantite);

    if (!Number.isInteger(quantite) || quantite < 0 || stockQuantite.trim() === '') {
      setStockMessage('Saisissez une quantité entière égale ou supérieure à zéro.');
      return;
    }

    setStockLoading(true);
    setStockMessage('');

    try {
      const { error } = await supabase
        .from('stock_bouteilles')
        .insert({
          format_kg: Number(stockFormat),
          contenu: stockContenu,
          etat: stockEtat,
          emplacement: stockEmplacement,
          quantite,
          created_by: session.user.id
        });

      if (error) {
        setStockMessage('Enregistrement impossible : ' + error.message);
      } else {
        setStockMessage('La quantité de bouteilles a été enregistrée.');
        setStockQuantite('');
        await loadStockBouteilles();
      }
    } catch {
      setStockMessage('Erreur lors de l’enregistrement du stock.');
    } finally {
      setStockLoading(false);
    }
  }

  
  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm(previous => ({ ...previous, [name]: type === 'checkbox' ? checked : value }));
  }

  function resetForm() {
    setForm({ nom: '', telephone: '', adresse: '', actif: true });
    setEditingId(null);
  }

  function editClient(client) {
    setEditingId(client.id);
    setForm({ nom: client.nom ?? '', telephone: client.telephone ?? '', adresse: client.adresse ?? '', actif: client.actif });
    setMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function saveClient(event) {
    event.preventDefault();
    if (!supabase || !session?.user?.id) { setMessage('Vous devez être connecté pour enregistrer un client.'); return; }
    const nom = form.nom.trim();
    if (!nom) { setMessage('Le nom du client est obligatoire.'); return; }
    setSaving(true); setMessage('');
    const clientData = { nom, telephone: form.telephone.trim() || null, adresse: form.adresse.trim() || null, actif: form.actif };
    try {
      let result;
      if (editingId) {
        result = await supabase.from('clients').update(clientData).eq('id', editingId).select('id').maybeSingle();
      } else {
        result = await supabase.from('clients').insert({ ...clientData, created_by: session.user.id }).select('id').single();
      }
      if (result.error) setMessage(`Enregistrement impossible : ${result.error.message}`);
      else if (!result.data) setMessage('Aucune modification effectuée. Vérifiez les droits d’accès Supabase.');
      else {
        setMessage(editingId ? 'Les informations du client ont été mises à jour.' : 'Le client a été enregistré avec succès.');
        resetForm();
        await loadClients();
      }
    } catch {
      setMessage('Erreur inattendue lors de l’enregistrement du client.');
    } finally { setSaving(false); }
  }

  async function toggleClient(client) {
    if (!supabase) return;
    const action = client.actif ? 'désactiver' : 'réactiver';
    if (!window.confirm(`Voulez-vous vraiment ${action} le client « ${client.nom} » ?`)) return;
    setMessage('');
    try {
      const { data, error } = await supabase.from('clients').update({ actif: !client.actif }).eq('id', client.id).select('id').maybeSingle();
      if (error) setMessage(`Modification impossible : ${error.message}`);
      else if (!data) setMessage('Aucune modification effectuée. Vérifiez les droits d’accès.');
      else { setMessage(client.actif ? 'Le client a été désactivé.' : 'Le client a été réactivé.'); await loadClients(); }
    } catch { setMessage('Erreur inattendue lors de la modification du client.'); }
  }

  const visibleClients = clients.filter(client => {
    const text = [client.nom, client.telephone, client.adresse].filter(Boolean).join(' ').toLowerCase();
    const matchesSearch = text.includes(search.trim().toLowerCase());
    const matchesFilter = filter === 'tous' || (filter === 'actifs' && client.actif) || (filter === 'inactifs' && !client.actif);
    return matchesSearch && matchesFilter;
  });
  const activeCount = clients.filter(client => client.actif).length;

  if (loading) return <main style={{ ...pageStyle, padding: 32 }}>Vérification de votre connexion…</main>;

  if (!supabase) return (
    <main style={{ ...pageStyle, padding: 24 }}>
      <section style={{ ...cardStyle, maxWidth: 560, margin: '60px auto' }}>
        <h1>Configuration nécessaire</h1>
        <p>Les variables VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY ne sont pas configurées. Vérifiez-les dans Vercel puis redéployez.</p>
      </section>
    </main>
  );

  if (!session) return (
    <main style={{ ...pageStyle, padding: 24, display: 'grid', placeItems: 'center' }}>
      <section style={{ ...cardStyle, maxWidth: 420, width: '100%', boxSizing: 'border-box' }}>
        <p style={{ color: '#16805d', fontWeight: 700 }}>BARKA ÉNERGIE</p>
        <h1>Gestion du grossiste de gaz</h1>
        <p>Connectez-vous à votre espace personnel.</p>
        <form onSubmit={handleLogin}>
          <label htmlFor="email">Adresse e-mail</label>
          <input id="email" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
          <label htmlFor="password">Mot de passe</label>
          <input id="password" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle} />
          {message && <p role="alert" style={{ color: '#b42318' }}>{message}</p>}
          <button type="submit" disabled={busy} style={{ ...buttonStyle, width: '100%' }}>{busy ? 'Connexion en cours…' : 'Se connecter'}</button>
        </form>
      </section>
    </main>
  );

   const navItems = [
    ['dashboard', 'Tableau de bord'],
    ['clients', 'Clients'],
    ['bouteilles', 'Bouteilles'],
  ];
  const otherModules = ['Bouteilles', 'Chauffeurs', 'Livraisons', 'Mouvements de stock', 'Comptabilité', 'Rations'];

  function navigate(key) {
    setPage(key); setMessage('');
    if (key !== 'clients') resetForm();
  }

  return (
    <div style={pageStyle}>
      <header style={{ background: '#123b2a', color: '#fff', padding: '16px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div><div style={{ fontSize: 20, fontWeight: 700 }}>BARKA ÉNERGIE</div><div style={{ fontSize: 13 }}>Gestion du dépôt grossiste de gaz</div></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13 }}>{session.user.email}</span>
          <button type="button" onClick={handleLogout} style={{ ...buttonStyle, background: '#fff', color: '#123b2a' }}>Déconnexion</button>
        </div>
      </header>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 70px)', flexWrap: 'wrap' }}>
        <aside style={{ width: 220, flexShrink: 0, background: '#fff', padding: 14, borderRight: '1px solid #dce7e2', boxSizing: 'border-box' }}>
          <strong style={{ display: 'block', padding: '8px 10px 14px' }}>MENU</strong>
          {navItems.map(([key, label]) => (
            <button key={key} type="button" onClick={() => navigate(key)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: 12, marginBottom: 6, border: 0, borderRadius: 8, cursor: 'pointer', background: page === key ? '#e3f4e9' : 'transparent', color: page === key ? '#176b45' : '#334155', fontWeight: page === key ? 700 : 500 }}>{label}</button>
          ))}
          <div style={{ margin: '20px 8px 8px', fontSize: 12, color: '#64748b' }}>AUTRES MODULES</div>
          {otherModules.map(label => <div key={label} style={{ padding: '10px 8px', color: '#94a3b8', fontSize: 14 }}>{label} · bientôt</div>)}
        </aside>

        <main style={{ padding: 24, flex: 1, minWidth: 280 }}>
          {message && <div role="status" style={{ ...cardStyle, color: /impossible|erreur|configuration|aucune/i.test(message) ? '#b42318' : '#166534' }}>{message}</div>}

          {page === 'dashboard' && <>
            <h1 style={{ marginTop: 0 }}>Tableau de bord</h1>
            <p style={{ color: '#64748b' }}>Bienvenue dans votre espace de gestion.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 16, margin: '24px 0' }}>
              <article style={cardStyle}><div style={{ color: '#64748b' }}>Total des clients</div><h2 style={{ fontSize: 32, margin: '10px 0' }}>{clients.length}</h2><button type="button" style={buttonStyle} onClick={() => navigate('clients')}>Ouvrir Clients →</button></article>
              <article style={cardStyle}><div style={{ color: '#64748b' }}>Clients actifs</div><h2 style={{ fontSize: 32, margin: '10px 0' }}>{activeCount}</h2><button type="button" style={{ ...buttonStyle, background: '#e3f4e9', color: '#176b45' }} onClick={() => navigate('clients')}>Voir les clients</button></article>
              <article style={cardStyle}><div style={{ color: '#64748b' }}>Modules disponibles</div><h2 style={{ fontSize: 32, margin: '10px 0' }}>1</h2><p style={{ color: '#64748b' }}>Le module Clients est opérationnel.</p></article>
            </div>
            <h2>Modules de gestion</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              {[['Clients', 'Gérer les dépôts et les contacts.', true], ...otherModules.map(name => [name, 'Module à développer dans une prochaine étape.', false])].map(([title, description, ready]) => (
                <article key={title} style={cardStyle}><h3 style={{ marginTop: 0 }}>{title}</h3><p style={{ color: '#64748b', minHeight: 38 }}>{description}</p><button type="button" style={{ ...buttonStyle, background: ready ? '#176b45' : '#e2e8f0', color: ready ? '#fff' : '#475569' }} onClick={() => ready ? navigate('clients') : setMessage(`Le module « ${title} » sera développé dans une prochaine étape.`)}>{ready ? 'Ouvrir le module' : 'À développer'}</button></article>
              ))}
            </div>
          </>}

          {page === 'clients' && <>
            <h1 style={{ marginTop: 0 }}>Gestion des clients</h1>
            <p style={{ color: '#64748b' }}>Enregistrez et gérez les dépôts agréés de votre société.</p>
            <section style={cardStyle}>
              <h2 style={{ marginTop: 0 }}>{editingId ? 'Modifier un client' : 'Ajouter un client'}</h2>
              <form onSubmit={saveClient}>
                <label htmlFor="client-nom">Nom du client ou dépôt *</label>
                <input id="client-nom" name="nom" value={form.nom} onChange={updateField} required maxLength={150} style={inputStyle} placeholder="Nom du dépôt" />
                <label htmlFor="client-telephone">Téléphone</label>
                <input id="client-telephone" name="telephone" type="tel" value={form.telephone} onChange={updateField} maxLength={40} style={inputStyle} placeholder="Numéro de téléphone" />
                <label htmlFor="client-adresse">Adresse</label>
                <input id="client-adresse" name="adresse" value={form.adresse} onChange={updateField} maxLength={250} style={inputStyle} placeholder="Ville, quartier, repère" />
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '10px 0 18px' }}><input type="checkbox" name="actif" checked={form.actif} onChange={updateField} /> Client actif</label>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button type="submit" disabled={saving} style={buttonStyle}>{saving ? 'Enregistrement…' : editingId ? 'Enregistrer les modifications' : 'Enregistrer le client'}</button>
                  {editingId && <button type="button" onClick={resetForm} style={{ ...buttonStyle, background: '#64748b' }}>Annuler</button>}
                </div>
              </form>
            </section>

            <section style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}><h2 style={{ marginTop: 0 }}>Liste des clients ({clients.length})</h2><button type="button" onClick={loadClients} disabled={clientsLoading} style={buttonStyle}>{clientsLoading ? 'Chargement…' : 'Actualiser'}</button></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
                <input value={search} onChange={e => setSearch(e.target.value)} aria-label="Rechercher un client" placeholder="Rechercher par nom, téléphone ou adresse…" style={inputStyle} />
                <select value={filter} onChange={e => setFilter(e.target.value)} aria-label="Filtrer les clients" style={inputStyle}><option value="tous">Tous les clients</option><option value="actifs">Clients actifs</option><option value="inactifs">Clients inactifs</option></select>
              </div>
              {clientsLoading ? <p>Chargement des clients…</p> : visibleClients.length === 0 ? <p style={{ color: '#64748b' }}>{clients.length === 0 ? 'Aucun client enregistré pour le moment. Ajoutez votre premier client ci-dessus.' : 'Aucun résultat pour cette recherche.'}</p> : (
                <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}><thead><tr style={{ textAlign: 'left', background: '#eef5f1' }}>{['Nom', 'Téléphone', 'Adresse', 'Statut', 'Actions'].map(h => <th key={h} style={{ padding: 12, borderBottom: '1px solid #dce7e2' }}>{h}</th>)}</tr></thead><tbody>
                  {visibleClients.map(client => <tr key={client.id}><td style={{ padding: 12, borderBottom: '1px solid #e5ece8' }}>{client.nom}</td><td style={{ padding: 12, borderBottom: '1px solid #e5ece8' }}>{client.telephone || '—'}</td><td style={{ padding: 12, borderBottom: '1px solid #e5ece8' }}>{client.adresse || '—'}</td><td style={{ padding: 12, borderBottom: '1px solid #e5ece8', color: client.actif ? '#167653' : '#b42318' }}>{client.actif ? 'Actif' : 'Inactif'}</td><td style={{ padding: 12, borderBottom: '1px solid #e5ece8' }}><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><button type="button" onClick={() => editClient(client)} style={{ ...buttonStyle, background: '#2563eb' }}>Modifier</button><button type="button" onClick={() => toggleClient(client)} style={{ ...buttonStyle, background: client.actif ? '#b42318' : '#64748b' }}>{client.actif ? 'Désactiver' : 'Réactiver'}</button></div></td></tr>)}
                </tbody></table></div>
              )}
           
            </section>
          </>}

          {page === 'bouteilles' && <>
            <h1 style={{ marginTop: 0 }}>Gestion des bouteilles</h1>
            <p style={{ color: '#64748b' }}>
              Enregistrez les quantités de bouteilles pleines, vides et hors service.
            </p>

            <section style={cardStyle}>
              <h2 style={{ marginTop: 0 }}>Enregistrer une quantité</h2>

              <form onSubmit={saveStockBouteilles}>
                <label>Format de bouteille</label>
                <select value={stockFormat} onChange={e => setStockFormat(e.target.value)} style={inputStyle}>
                  <option value="6">6 kg</option>
                  <option value="12">12 kg</option>
                </select>

                <label>Contenu</label>
                <select value={stockContenu} onChange={e => setStockContenu(e.target.value)} style={inputStyle}>
                  <option value="vide">Vide</option>
                  <option value="pleine">Pleine</option>
                </select>

                <label>État</label>
                <select value={stockEtat} onChange={e => setStockEtat(e.target.value)} style={inputStyle}>
                  <option value="utilisable">Utilisable</option>
                  <option value="hors_service">Hors service</option>
                </select>

                <label>Emplacement</label>
               
<select value={stockEmplacement} onChange={e => setStockEmplacement(e.target.value)} style={inputStyle}>
  <option value="depot">Dépôt principal</option>
  <option value="camion">Dans un camion</option>
  <option value="client">Chez un dépôt client</option>
</select>

{stockEmplacement === 'camion' && (
  <>
    <label>Camion concerné</label>
    <select
      value={stockCamionId}
      onChange={e => setStockCamionId(e.target.value)}
      style={inputStyle}
      required
    >
      <option value="">-- Choisir un camion --</option>
      {camions.map(camion => (
        <option key={camion.id} value={camion.id}>
          {camion.nom}
        </option>
      ))}
    </select>
  </>
)}


                <label>Quantité de bouteilles</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={stockQuantite}
                  onChange={e => setStockQuantite(e.target.value)}
                  required
                  style={inputStyle}
                  placeholder="Ex. : 100"
                />

                {stockMessage && <p role="status">{stockMessage}</p>}

                <button type="submit" disabled={stockLoading} style={buttonStyle}>
                  {stockLoading ? 'Enregistrement…' : 'Enregistrer le stock'}
                </button>
              </form>
            </section>

            <section style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <h2 style={{ marginTop: 0 }}>Stock enregistré</h2>
                <button type="button" onClick={loadStockBouteilles} disabled={stockLoading} style={buttonStyle}>
                  {stockLoading ? 'Chargement…' : 'Actualiser'}
                </button>
              </div>

              {stockLoading ? <p>Chargement du stock…</p> : stockBouteilles.length === 0 ? (
                <p style={{ color: '#64748b' }}>Aucune quantité enregistrée pour le moment.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                    <thead>
                      
<tr style={{ textAlign: 'left', background: '#eef5f1' }}>
  <th style={{ padding: 12 }}>Date d'enregistrement</th>
  <th style={{ padding: 12 }}>Format</th>
  <th style={{ padding: 12 }}>Contenu</th>
  <th style={{ padding: 12 }}>État</th>
  <th style={{ padding: 12 }}>Emplacement</th>
  <th style={{ padding: 12 }}>Quantité</th>
</tr>

                    </thead>
                    <tbody>
      
                      {stockBouteilles.map(item => (
                        <tr key={item.id}>
                          <td style={{ padding: 12 }}>
                            {item.created_at
                              ? new Date(item.created_at).toLocaleString('fr-FR', {
                                  dateStyle: 'short',
                                  timeStyle: 'short'
                                })
                              : '—'}
                          </td>
                          <td style={{ padding: 12 }}>{item.format_kg} kg</td>
                          <td style={{ padding: 12 }}>
                            {item.contenu === 'pleine' ? 'Pleine' : 'Vide'}
                          </td>
                          <td style={{ padding: 12 }}>
                            {item.etat === 'hors_service' ? 'Hors service' : 'Utilisable'}
                          </td>
                          <td style={{ padding: 12 }}>Dépôt</td>
                          <td style={{ padding: 12 }}>{item.quantite}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>}

        </main>

      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
