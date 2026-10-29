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
  
const [inventaires, setInventaires] = useState([]);
  
const [rations, setRations] = useState([]);
const [rationDate, setRationDate] = useState(
  new Date().toISOString().slice(0, 10)
);
const [rationChauffeurs] = useState([
  'Razack',
  'Régis',
  'Issaka',
  'Toussain'
]);
const [rationPresences, setRationPresences] = useState({});
const [rationPaiements, setRationPaiements] = useState({});
const [rationCommentaires, setRationCommentaires] = useState({});
const [rationLoading, setRationLoading] = useState(false);
const [rationMessage, setRationMessage] = useState('');

const [inventaireDate, setInventaireDate] = useState(
  new Date().toISOString().slice(0, 10)
);
const [inventaireFormat, setInventaireFormat] = useState('6');
const [inventaireContenu, setInventaireContenu] = useState('vide');
const [inventaireEtat, setInventaireEtat] = useState('utilisable');
const [inventaireEmplacement, setInventaireEmplacement] = useState('depot');
const [inventaireCamionId, setInventaireCamionId] = useState('');
const [inventaireQuantitePhysique, setInventaireQuantitePhysique] = useState('');
const [inventaireQuantiteTheorique, setInventaireQuantiteTheorique] = useState('');
const [inventaireCommentaire, setInventaireCommentaire] = useState('');
const [inventaireLoading, setInventaireLoading] = useState(false);
const [inventaireMessage, setInventaireMessage] = useState('');

  const [stockLoading, setStockLoading] = useState(false);
  const [stockFormat, setStockFormat] = useState('6');
  const [stockContenu, setStockContenu] = useState('vide');
  const [stockEtat, setStockEtat] = useState('utilisable');
  const [stockEmplacement, setStockEmplacement] = useState('depot');
  const [stockCamionId, setStockCamionId] = useState('');
  const [camions, setCamions] = useState([]);
  const [stockQuantite, setStockQuantite] = useState('');
  const [stockMessage, setStockMessage] = useState('');
  const [stockVue, setStockVue] = useState('actif');
const [stockActionId, setStockActionId] = useState('');
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
    setInventaires([]);
    setRations([]);
    return;
  }

  loadClients();
  loadStockBouteilles();
  loadCamions();
  loadInventaires();
  loadRations();
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
  
async function loadCamions() {
  if (!supabase || !session) return;

  const { data, error } = await supabase
    .from('camions')
    .select('id, nom, format_kg, capacite, chauffeur')
    .eq('actif', true)
    .order('nom', { ascending: true });

  if (error) {
    console.error('Erreur chargement camions :', error.message);
    return;
  }

  setCamions(data || []);
}

  async function loadStockBouteilles() {
    if (!supabase || !session) return;
    setStockLoading(true);
    setStockMessage('');

    try {
      const { data, error } = await supabase
        .from('stock_bouteilles')
        .select('id, format_kg, contenu, etat, emplacement, quantite, camion_id, client_id, created_at, supprime')
        .eq('supprime', stockVue === 'corbeille')
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

async function loadInventaires() {
  if (!supabase || !session) return;

  setInventaireLoading(true);
  setInventaireMessage('');

  try {
    const { data, error } = await supabase
      .from('inventaires_bouteilles')
      .select(
        'id, date_inventaire, format_kg, contenu, etat, emplacement, camion_id, client_id, quantite_theorique, quantite_physique, commentaire, created_at'
      )
      .order('date_inventaire', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      setInventaireMessage(
        'Chargement des inventaires impossible : ' + error.message
      );
    } else {
      setInventaires(data || []);
    }
  } catch {
    setInventaireMessage(
      'Impossible de contacter Supabase pour charger les inventaires.'
    );
  } finally {
    setInventaireLoading(false);
  }
}

async function loadRations() {
  if (!supabase || !session) return;

  setRationLoading(true);
  setRationMessage('');

  try {
    const { data, error } = await supabase
      .from('rations_journalieres')
      .select(
        'id, date_ration, chauffeur, present, montant_du, montant_paye, commentaire, created_at'
      )
      .order('date_ration', { ascending: false })
      .order('chauffeur', { ascending: true });

    if (error) {
      setRationMessage(
        'Chargement des rations impossible : ' + error.message
      );
    } else {
      setRations(data || []);
    }
  } catch {
    setRationMessage(
      'Impossible de contacter Supabase pour charger les rations.'
    );
  } finally {
    setRationLoading(false);
  }
}

async function saveRations(e) {
  e.preventDefault();

  if (!supabase || !session) {
    setRationMessage('Connectez-vous pour enregistrer les rations.');
    return;
  }

  setRationLoading(true);
  setRationMessage('');

  try {
    const lignes = rationChauffeurs.map(chauffeur => {
      const present = Boolean(rationPresences[chauffeur]);
      const montant_du = present ? 500 : 0;
      const montant_paye = present
        ? Math.min(
            montant_du,
            Math.max(0, Number(rationPaiements[chauffeur] || 0))
          )
        : 0;

      return {
        date_ration: rationDate,
        chauffeur,
        present,
        montant_du,
        montant_paye,
        commentaire: rationCommentaires[chauffeur] || null,
        created_by: session.user.id
      };
    });

    const { error } = await supabase
      .from('rations_journalieres')
      .upsert(lignes, {
        onConflict: 'date_ration,chauffeur,created_by'
      });

    if (error) {
      setRationMessage(
        'Enregistrement impossible : ' + error.message
      );
      return;
    }

    setRationMessage('Présences et rations enregistrées avec succès.');
    await loadRations();
  } catch {
    setRationMessage(
      'Une erreur est survenue pendant l’enregistrement.'
    );
  } finally {
    setRationLoading(false);
  }
}

async function supprimerInventaire(id) {
  const confirmation = window.confirm(
    'Voulez-vous vraiment supprimer cet inventaire ? Cette action est irréversible.'
  );

  if (!confirmation) return;

  if (!supabase || !session) {
    setInventaireMessage('Vous devez être connecté.');
    return;
  }

  setInventaireLoading(true);
  setInventaireMessage('');

  try {
    const { error } = await supabase
      .from('inventaires_bouteilles')
      .delete()
      .eq('id', id);

    if (error) throw error;

    setInventaireMessage('Inventaire supprimé avec succès.');
    await loadInventaires();
  } catch (error) {
    setInventaireMessage(
      'Suppression impossible : ' + error.message
    );
  } finally {
    setInventaireLoading(false);
  }
}


async function saveInventaire(e) {
  e.preventDefault();

  if (!supabase || !session) {
    setInventaireMessage('Vous devez être connecté.');
    return;
  }

  const quantiteTheorique = Number(inventaireQuantiteTheorique);
  const quantitePhysique = Number(inventaireQuantitePhysique);

  if (
    inventaireQuantiteTheorique === '' ||
    !Number.isInteger(quantiteTheorique) ||
    quantiteTheorique < 0
  ) {
    setInventaireMessage(
      'Saisissez un stock théorique entier et positif ou égal à zéro.'
    );
    return;
  }

  if (
    inventaireQuantitePhysique === '' ||
    !Number.isInteger(quantitePhysique) ||
    quantitePhysique < 0
  ) {
    setInventaireMessage(
      'Saisissez une quantité physique entière et positive ou égale à zéro.'
    );
    return;
  }

  if (inventaireEmplacement === 'camion' && !inventaireCamionId) {
    setInventaireMessage('Choisissez le camion à inventorier.');
    return;
  }

  setInventaireLoading(true);
  setInventaireMessage('');

  try {
    const { error } = await supabase
      .from('inventaires_bouteilles')
      .insert({
        date_inventaire: inventaireDate,
        format_kg: Number(inventaireFormat),
        contenu: inventaireContenu,
        etat: inventaireEtat,
        emplacement: inventaireEmplacement,
        camion_id: inventaireEmplacement === 'camion'
          ? inventaireCamionId
          : null,
        client_id: null,
        quantite_theorique: quantiteTheorique,
        quantite_physique: quantitePhysique,
        commentaire: inventaireCommentaire.trim() || null,
        created_by: session.user.id
      });

    if (error) throw error;

    setInventaireMessage(
      `Inventaire enregistré. Écart : ${quantitePhysique - quantiteTheorique} bouteille(s).`
    );

    setInventaireQuantiteTheorique('');
    setInventaireQuantitePhysique('');
    setInventaireCommentaire('');

    await loadInventaires();
  } catch (error) {
    setInventaireMessage(
      'Enregistrement impossible : ' + error.message
    );
  } finally {
    setInventaireLoading(false);
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

  if (stockEmplacement === 'camion' && !stockCamionId) {
    setStockMessage('Veuillez choisir le camion concerné.');
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
        camion_id: stockEmplacement === 'camion' ? stockCamionId : null,
        client_id: null,
        quantite,
        created_by: session.user.id
      });

    if (error) {
      setStockMessage('Enregistrement impossible : ' + error.message);
    } else {
      setStockMessage('La quantité de bouteilles a été enregistrée.');
      setStockQuantite('');
      setStockCamionId('');
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
  ['inventaire', 'Inventaire'],
  ['rations', 'Rations'],
];

 const otherModules = ['Bouteilles', 'Inventaire', 'Chauffeurs', 'Livraisons', 'Mouvements de stock', 'Comptabilité', 'Rations'];

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
             
{[
  ['Clients', 'Gérer les dépôts et les contacts.', true, 'clients'],
  ['Bouteilles', 'Gérer le stock de bouteilles et la corbeille.', true, 'bouteilles'],
  ...otherModules
    .filter(name => name !== 'Bouteilles')
    .map(name => [name, 'Module à développer dans une prochaine étape.', false, ''])
].map(([title, description, ready, key]) => (

    

<article key={title} style={cardStyle}><h3 style={{ marginTop: 0 }}>{title}</h3><p style={{ color: '#64748b', minHeight: 38 }}>{description}</p><button type="button" style={{ ...buttonStyle, background: ready || title === 'Bouteilles' || title === 'Inventaire' ? '#176b45' : '#e2e8f0', color: ready || title === 'Bouteilles' || title === 'Inventaire' ? '#fff' : '#475569' }} onClick={() => title === 'Bouteilles' ? navigate('bouteilles') : title === 'Inventaire' ? navigate('inventaire') : ready ? navigate('clients') : setMessage(`Le module « ${title} » sera développé dans une prochaine étape.`)}>{ready || title === 'Bouteilles' || title === 'Inventaire' ? 'Ouvrir le module' : 'À développer'}</button></article>


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

              <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
  <button
    type="button"
    onClick={() => {
      setStockVue('actif');
      loadStockBouteilles();
    }}
    style={inputStyle}
  >
    Stock normal
  </button>

  <button
    type="button"
    onClick={() => {
      setStockVue('corbeille');
      loadStockBouteilles();
    }}
    style={inputStyle}
  >
    Corbeille
  </button>
</div>
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
<th style={{ padding: 12 }}>Camion / Dépôt client</th>
  <th style={{ padding: 12 }}>Quantité</th>
  <th style={{ padding: 12 }}>Actions</th>
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
    <td style={{ padding: 12 }}>
      {item.emplacement === 'camion'
        ? 'Camion'
        : item.emplacement === 'client'
          ? 'Client'
          : 'Dépôt'}
    </td>
    <td style={{ padding: 12 }}>
      {item.camion_id
        ? camions.find(camion => camion.id === item.camion_id)?.nom || 'Camion inconnu'
        : item.client_id
          ? clients.find(client => client.id === item.client_id)?.nom || 'Client inconnu'
          : '—'}
    </td>
    <td style={{ padding: 12 }}>{item.quantite}</td>
    <td style={{ padding: 12 }}>
      <button
        type="button"
        disabled={stockActionId === item.id}
        onClick={async () => {
          const dansCorbeille = stockVue === 'corbeille';
          const action = dansCorbeille ? 'restaurer' : 'mettre à la corbeille';

          if (!window.confirm(`Voulez-vous ${action} cet enregistrement ?`)) return;

          setStockActionId(item.id);
          setStockMessage('');

          try {
            const { error } = await supabase
              .from('stock_bouteilles')
              .update({ supprime: !dansCorbeille })
              .eq('id', item.id);

            if (error) {
              setStockMessage('Erreur : ' + error.message);
            } else {
              setStockMessage(
                dansCorbeille
                  ? 'Enregistrement restauré.'
                  : 'Enregistrement déplacé dans la corbeille.'
              );
              await loadStockBouteilles();
            }
          } catch {
            setStockMessage('Une erreur est survenue.');
          } finally {
            setStockActionId('');
          }
        }}
      >
        {stockActionId === item.id
          ? 'Patientez...'
          : stockVue === 'corbeille'
            ? 'Restaurer'
            : 'Corbeille'}
      </button>
    </td>
  </tr>
))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>}

{page === 'inventaire' && <>
  <h1 style={{ marginTop: 0 }}>Inventaire mensuel</h1>
  <p style={{ color: '#64748b' }}>
    Comparez le stock théorique aux quantités réellement comptées.
  </p>

  <section style={cardStyle}>
    <h2 style={{ marginTop: 0 }}>Nouveau comptage</h2>

    <form onSubmit={saveInventaire}>
      <label>Date de l'inventaire</label>
      <input
        type="date"
        value={inventaireDate}
        onChange={e => setInventaireDate(e.target.value)}
        required
        style={inputStyle}
      />

      <label>Format</label>
      <select
        value={inventaireFormat}
        onChange={e => setInventaireFormat(e.target.value)}
        style={inputStyle}
      >
        <option value="6">6 kg</option>
        <option value="12">12 kg</option>
      </select>

      <label>Contenu</label>
      <select
        value={inventaireContenu}
        onChange={e => setInventaireContenu(e.target.value)}
        style={inputStyle}
      >
        <option value="pleine">Pleine</option>
        <option value="vide">Vide</option>
      </select>

      <label>État</label>
      <select
        value={inventaireEtat}
        onChange={e => setInventaireEtat(e.target.value)}
        style={inputStyle}
      >
        <option value="utilisable">Utilisable</option>
        <option value="hors_service">Hors service</option>
      </select>

      <label>Emplacement</label>
      <select
        value={inventaireEmplacement}
        onChange={e => setInventaireEmplacement(e.target.value)}
        style={inputStyle}
      >
        <option value="depot">Dépôt principal</option>
        <option value="camion">Camion</option>
      </select>

      {inventaireEmplacement === 'camion' && (
        <>
          <label>Camion</label>
          <select
            value={inventaireCamionId}
            onChange={e => setInventaireCamionId(e.target.value)}
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

    

<label>Stock théorique total</label>
<input
  type="number"
  min="0"
  step="1"
  value={inventaireQuantiteTheorique}
  onChange={e => setInventaireQuantiteTheorique(e.target.value)}
  placeholder="Saisir le stock théorique"
  required
  style={inputStyle}
/>


<label>Quantité physique comptée</label>
<input
  type="number"
  min="0"
  step="1"
  value={inventaireQuantitePhysique}
  onChange={e => setInventaireQuantitePhysique(e.target.value)}
  placeholder="Ex. : 250"
  required
  style={inputStyle}
/>


      <label>Commentaire (facultatif)</label>
      <textarea
        value={inventaireCommentaire}
        onChange={e => setInventaireCommentaire(e.target.value)}
        placeholder="Expliquez éventuellement un écart"
        style={inputStyle}
      />

      {inventaireMessage && (
        <p role="status">{inventaireMessage}</p>
      )}

      <button
        type="submit"
        disabled={inventaireLoading}
        style={buttonStyle}
      >
        {inventaireLoading ? 'Enregistrement…' : 'Enregistrer l’inventaire'}
      </button>
    </form>
  </section>

  <section style={cardStyle}>
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 12
    }}>
      <h2 style={{ marginTop: 0 }}>Historique des inventaires</h2>
      <button
        type="button"
        onClick={loadInventaires}
        disabled={inventaireLoading}
        style={buttonStyle}
      >
        Actualiser
      </button>
    </div>

    {inventaireLoading ? (
      <p>Chargement des inventaires…</p>
    ) : inventaires.length === 0 ? (
      <p style={{ color: '#64748b' }}>
        Aucun inventaire enregistré.
      </p>
    ) : (
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          minWidth: 750
        }}>
         
<thead>
  <tr style={{ textAlign: 'left', background: '#eef5f1' }}>
    <th style={{ padding: 10 }}>Date</th>
    <th style={{ padding: 10 }}>Format</th>
    <th style={{ padding: 10 }}>Contenu</th>
    <th style={{ padding: 10 }}>État</th>
    <th style={{ padding: 10 }}>Emplacement</th>
    <th style={{ padding: 10 }}>Théorique</th>
    <th style={{ padding: 10 }}>Physique</th>
    <th style={{ padding: 10 }}>Écart</th>
    <th style={{ padding: 10 }}>Commentaire</th>
  </tr>
</thead>
<tbody>
  {inventaires.map(item => {
    const ecart =
      Number(item.quantite_physique) -
      Number(item.quantite_theorique);

    return (
      <tr key={item.id}>
        <td style={{ padding: 10 }}>{item.date_inventaire}</td>
        <td style={{ padding: 10 }}>{item.format_kg} kg</td>
        <td style={{ padding: 10 }}>{item.contenu}</td>
        <td style={{ padding: 10 }}>{item.etat}</td>
        <td style={{ padding: 10 }}>{item.emplacement}</td>
        <td style={{ padding: 10 }}>{item.quantite_theorique}</td>
        <td style={{ padding: 10 }}>{item.quantite_physique}</td>
        <td style={{
          padding: 10,
          fontWeight: 'bold',
          color: ecart < 0
            ? '#b91c1c'
            : ecart > 0
              ? '#166534'
              : '#334155'
        }}>
          {ecart > 0 ? '+' : ''}{ecart}
        </td>
        <td style={{ padding: 10 }}>
          {item.commentaire || '—'}
        </td>
        
<td style={{ padding: 10 }}>
  <button
    type="button"
    onClick={() => supprimerInventaire(item.id)}
    disabled={inventaireLoading}
    style={{
      ...buttonStyle,
      background: '#b91c1c'
    }}
  >
    Supprimer
  </button>
</td>

      </tr>
    );
  })}

</tbody>
</table>

      </div>

    )}
  </section>
</>}


{page === 'rations' && <>
  <h1 style={{ marginTop: 0 }}>Gestion des rations</h1>
  <p style={{ color: '#64748b' }}>
    Chaque chauffeur présent reçoit une ration de 500 FCFA par jour.
  </p>

  <section style={cardStyle}>
    <h2 style={{ marginTop: 0 }}>Présences quotidiennes</h2>

    <form onSubmit={saveRations}>
      <label>Date des rations</label>
      <input
        type="date"
        value={rationDate}
        onChange={e => setRationDate(e.target.value)}
        required
        style={inputStyle}
      />

      {rationChauffeurs.map(chauffeur => (
        <div
          key={chauffeur}
          style={{
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: 12,
            marginTop: 12
          }}
        >
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontWeight: 'bold'
          }}>
            <input
              type="checkbox"
              checked={Boolean(rationPresences[chauffeur])}
              onChange={e => {
                const present = e.target.checked;
                setRationPresences(prev => ({
                  ...prev,
                  [chauffeur]: present
                }));
                if (!present) {
                  setRationPaiements(prev => ({
                    ...prev,
                    [chauffeur]: 0
                  }));
                }
              }}
            />
            {chauffeur} — {rationPresences[chauffeur] ? 'Présent' : 'Absent'}
          </label>

          <p style={{ marginBottom: 8 }}>
            Montant dû : {rationPresences[chauffeur] ? 500 : 0} FCFA
          </p>

          <label>Montant payé (FCFA)</label>
          <input
            type="number"
            min="0"
            max={rationPresences[chauffeur] ? 500 : 0}
            step="1"
            value={rationPaiements[chauffeur] || 0}
            onChange={e => setRationPaiements(prev => ({
              ...prev,
              [chauffeur]: e.target.value
            }))}
            disabled={!rationPresences[chauffeur]}
            style={inputStyle}
          />

          <label>Commentaire (facultatif)</label>
          <input
            type="text"
            value={rationCommentaires[chauffeur] || ''}
            onChange={e => setRationCommentaires(prev => ({
              ...prev,
              [chauffeur]: e.target.value
            }))}
            placeholder="Ex. : paiement en attente"
            style={inputStyle}
          />
        </div>
      ))}

      <div style={{
        marginTop: 16,
        padding: 12,
        background: '#eef5f1',
        borderRadius: 8
      }}>
        <p>
          <strong>Total dû :</strong>{' '}
          {rationChauffeurs.reduce(
            (total, chauffeur) =>
              total + (rationPresences[chauffeur] ? 500 : 0),
            0
          )} FCFA
        </p>
        <p>
          <strong>Total payé :</strong>{' '}
          {rationChauffeurs.reduce(
            (total, chauffeur) =>
              total + (
                rationPresences[chauffeur]
                  ? Math.min(500, Math.max(0, Number(rationPaiements[chauffeur] || 0)))
                  : 0
              ),
            0
          )} FCFA
        </p>
        <p>
          <strong>Reste à payer :</strong>{' '}
          {rationChauffeurs.reduce(
            (total, chauffeur) =>
              total + (
                rationPresences[chauffeur]
                  ? 500 - Math.min(500, Math.max(0, Number(rationPaiements[chauffeur] || 0)))
                  : 0
              ),
            0
          )} FCFA
        </p>
      </div>

      {rationMessage && (
        <p role="status">{rationMessage}</p>
      )}

      <button
        type="submit"
        disabled={rationLoading}
        style={buttonStyle}
      >
        {rationLoading ? 'Enregistrement…' : 'Enregistrer les rations'}
      </button>
    </form>
  </section>
</>}

        </main>

      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
