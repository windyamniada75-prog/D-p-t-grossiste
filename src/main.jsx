
import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { createClient } from '@supabase/supabase-js'
import './style.css'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

const styles = {
  app: {
    minHeight: '100vh',
    background: '#f4f7fb',
    color: '#172033',
    fontFamily: 'Arial, sans-serif',
  },
  header: {
    background: '#123b2a',
    color: 'white',
    padding: '18px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  layout: {
    display: 'flex',
    minHeight: 'calc(100vh - 75px)',
  },
  sidebar: {
    width: 220,
    flexShrink: 0,
    background: '#ffffff',
    padding: 16,
    borderRight: '1px solid #e1e7ef',
    boxSizing: 'border-box',
  },
  main: {
    padding: 24,
    flex: 1,
    minWidth: 0,
  },
  card: {
    background: '#ffffff',
    border: '1px solid #e1e7ef',
    borderRadius: 12,
    padding: 20,
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
  },
  button: {
    padding: '10px 14px',
    border: 0,
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
    background: '#176b45',
    color: '#ffffff',
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: 11,
    border: '1px solid #cbd5e1',
    borderRadius: 7,
    marginTop: 6,
    marginBottom: 14,
    fontSize: 15,
  },
}

function App() {
  const [session, setSession] = useState(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  const [page, setPage] = useState('dashboard')
  const [clients, setClients] = useState([])
  const [clientsLoading, setClientsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [form, setForm] = useState({
    nom: '',
    telephone: '',
    adresse: '',
  })

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return

      if (error) setLoginError(error.message)
      setSession(data?.session ?? null)
      setCheckingSession(false)
    })

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (!active) return
        setSession(newSession)
        setCheckingSession(false)
        setPage('dashboard')
      }
    )

    return () => {
      active = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (session && page === 'clients') {
      loadClients()
    }
  }, [session, page])

  async function signIn(event) {
    event.preventDefault()
    setLoginError('')
    setLoginLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) setLoginError('Connexion impossible : ' + error.message)
    setLoginLoading(false)
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      setError('Erreur de déconnexion : ' + error.message)
      return
    }

    setPage('dashboard')
    setClients([])
    setForm({ nom: '', telephone: '', adresse: '' })
    setEditingId(null)
  }

  async function loadClients() {
    setClientsLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('clients')
      .select('id, nom, telephone, adresse, actif, created_at')
      .order('nom', { ascending: true })

    if (error) {
      setError('Impossible de charger les clients : ' + error.message)
    } else {
      setClients(data ?? [])
    }

    setClientsLoading(false)
  }

  function resetForm() {
    setForm({ nom: '', telephone: '', adresse: '' })
    setEditingId(null)
  }

  async function saveClient(event) {
    event.preventDefault()
    setMessage('')
    setError('')

    const nom = form.nom.trim()
    if (!nom) {
      setError('Le nom du client est obligatoire.')
      return
    }

    setSaving(true)

    let result

    if (editingId) {
      result = await supabase
        .from('clients')
        .update({
          nom,
          telephone: form.telephone.trim() || null,
          adresse: form.adresse.trim() || null,
        })
        .eq('id', editingId)
    } else {
      result = await supabase
        .from('clients')
        .insert({
          nom,
          telephone: form.telephone.trim() || null,
          adresse: form.adresse.trim() || null,
          created_by: session.user.id,
        })
    }

    if (result.error) {
      setError('Enregistrement impossible : ' + result.error.message)
    } else {
      setMessage(editingId ? 'Client modifié avec succès.' : 'Client ajouté avec succès.')
      resetForm()
      await loadClients()
    }

    setSaving(false)
  }

  function editClient(client) {
    setEditingId(client.id)
    setForm({
      nom: client.nom ?? '',
      telephone: client.telephone ?? '',
      adresse: client.adresse ?? '',
    })
    setMessage('')
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function toggleClient(client) {
    setMessage('')
    setError('')

    const { error } = await supabase
      .from('clients')
      .update({ actif: !client.actif })
      .eq('id', client.id)

    if (error) {
      setError('Modification impossible : ' + error.message)
    } else {
      setMessage(
        client.actif
          ? 'Client désactivé.'
          : 'Client réactivé.'
      )
      await loadClients()
    }
  }

  const filteredClients = clients.filter((client) => {
    const term = search.toLowerCase()
    return (
      (client.nom ?? '').toLowerCase().includes(term) ||
      (client.telephone ?? '').toLowerCase().includes(term) ||
      (client.adresse ?? '').toLowerCase().includes(term)
    )
  })

  if (checkingSession) {
    return <div style={{ padding: 40 }}>Vérification de la connexion…</div>
  }

  if (!session) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#f4f7fb',
          padding: 20,
          boxSizing: 'border-box',
        }}
      >
        <form
          onSubmit={signIn}
          style={{ ...styles.card, width: '100%', maxWidth: 400, boxSizing: 'border-box' }}
        >
          <h1 style={{ color: '#176b45', marginTop: 0 }}>Barka Énergie</h1>
          <p>Gestion du dépôt grossiste de gaz</p>

          <label htmlFor="email">Adresse e-mail</label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />

          <label htmlFor="password">Mot de passe</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />

          {loginError && (
            <p role="alert" style={{ color: '#b42318' }}>{loginError}</p>
          )}

          <button
            type="submit"
            disabled={loginLoading}
            style={{ ...styles.button, width: '100%' }}
          >
            {loginLoading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    )
  }

  const navButton = (key, label) => (
    <button
      key={key}
      onClick={() => {
        setPage(key)
        setMessage('')
        setError('')
      }}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: '12px 10px',
        marginBottom: 6,
        border: 0,
        borderRadius: 8,
        cursor: 'pointer',
        fontSize: 15,
        background: page === key ? '#e3f4e9' : 'transparent',
        color: page === key ? '#176b45' : '#334155',
        fontWeight: page === key ? 700 : 500,
      }}
    >
      {label}
    </button>
  )

  const moduleCards = [
    { title: 'Clients', description: 'Gérer les dépôts et les contacts.', action: () => setPage('clients'), ready: true },
    { title: 'Bouteilles', description: 'Suivre les bouteilles disponibles.', ready: false },
    { title: 'Chauffeurs', description: 'Consulter les chauffeurs.', ready: false },
    { title: 'Livraisons', description: 'Suivre les livraisons aux clients.', ready: false },
    { title: 'Mouvements de stock', description: 'Suivre les entrées et sorties.', ready: false },
    { title: 'Comptabilité', description: 'Suivre les opérations comptables.', ready: false },
    { title: 'Rations', description: 'Suivre les rations journalières.', ready: false },
  ]

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>Barka Énergie</div>
          <div style={{ fontSize: 13, opacity: 0.85 }}>Gestion du dépôt grossiste</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13 }}>{session.user.email}</span>
          <button
            onClick={signOut}
            style={{ ...styles.button, background: '#ffffff', color: '#123b2a' }}
          >
            Déconnexion
          </button>
        </div>
      </header>

      <div style={styles.layout}>
        <aside style={styles.sidebar}>
          <div style={{ fontWeight: 700, margin: '4px 8px 16px' }}>MENU</div>
          {navButton('dashboard', 'Tableau de bord')}
          {navButton('clients', 'Clients')}

          <div style={{ margin: '20px 8px 8px', fontSize: 12, color: '#64748b' }}>
            AUTRES MODULES
          </div>
          {['Bouteilles', 'Chauffeurs', 'Livraisons', 'Stock', 'Comptabilité', 'Rations'].map((label) => (
            <div
              key={label}
              style={{ padding: '10px 8px', color: '#94a3b8', fontSize: 14 }}
              title="Module à développer"
            >
              {label} · bientôt
            </div>
          ))}
        </aside>

        <main style={styles.main}>
          {error && (
            <div role="alert" style={{ ...styles.card, color: '#b42318', marginBottom: 16 }}>
              {error}
            </div>
          )}

          {message && (
            <div role="status" style={{ ...styles.card, color: '#176b45', marginBottom: 16 }}>
              {message}
            </div>
          )}

          {page === 'dashboard' && (
            <>
              <h1 style={{ marginTop: 0 }}>Tableau de bord</h1>
              <p style={{ color: '#64748b' }}>
                Bienvenue dans votre espace de gestion.
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                  gap: 16,
                  margin: '24px 0',
                }}
              >
                <div style={styles.card}>
                  <div style={{ color: '#64748b', fontSize: 14 }}>Module disponible</div>
                  <h2 style={{ marginBottom: 4 }}>Clients</h2>
                  <p style={{ color: '#64748b', fontSize: 14 }}>Gestion des dépôts clients</p>
                  <button style={styles.button} onClick={() => setPage('clients')}>
                    Ouvrir Clients →
                  </button>
                </div>

                <div style={styles.card}>
                  <div style={{ color: '#64748b', fontSize: 14 }}>Clients enregistrés</div>
                  <h2 style={{ fontSize: 32, margin: '12px 0' }}>—</h2>
                  <p style={{ color: '#64748b', fontSize: 13 }}>
                    Consultez le module Clients pour afficher le total.
                  </p>
                  <button
                    style={{ ...styles.button, background: '#e3f4e9', color: '#176b45' }}
                    onClick={() => setPage('clients')}
                  >
                    Voir les clients
                  </button>
                </div>
              </div>

              <h2>Modules de gestion</h2>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 16,
                }}
              >
                {moduleCards.map((module) => (
                  <div key={module.title} style={styles.card}>
                    <h3 style={{ marginTop: 0 }}>{module.title}</h3>
                    <p style={{ color: '#64748b', minHeight: 38 }}>{module.description}</p>
                    <button
                      onClick={module.action ?? (() => {
                        setMessage('Le module « ' + module.title + ' » sera développé dans une prochaine étape.')
                        setError('')
                      })}
                      style={{
                        ...styles.button,
                        background: module.ready ? '#176b45' : '#e2e8f0',
                        color: module.ready ? '#ffffff' : '#475569',
                      }}
                    >
                      {module.ready ? 'Ouvrir le module' : 'À développer'}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {page === 'clients' && (
            <>
              <h1 style={{ marginTop: 0 }}>Gestion des clients</h1>
              <p style={{ color: '#64748b' }}>
                Enregistrez et gérez les dépôts agréés de votre société.
              </p>

              <div style={{ ...styles.card, marginBottom: 24 }}>
                <h2 style={{ marginTop: 0 }}>
                  {editingId ? 'Modifier un client' : 'Ajouter un client'}
                </h2>

                <form onSubmit={saveClient}>
                  <label htmlFor="nom">Nom du client / dépôt *</label>
                  <input
                    id="nom"
                    required
                    value={form.nom}
                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                    style={styles.input}
                    placeholder="Nom du dépôt"
                  />

                  <label htmlFor="telephone">Téléphone</label>
                  <input
                    id="telephone"
                    value={form.telephone}
                    onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                    style={styles.input}
                    placeholder="Numéro de téléphone"
                  />

                  <label htmlFor="adresse">Adresse</label>
                  <input
                    id="adresse"
                    value={form.adresse}
                    onChange={(e) => setForm({ ...form, adresse: e.target.value })}
                    style={styles.input}
                    placeholder="Ville, quartier ou adresse"
                  />

                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button type="submit" disabled={saving} style={styles.button}>
                      {saving ? 'Enregistrement…' : editingId ? 'Enregistrer les modifications' : 'Enregistrer le client'}
                    </button>

                    {editingId && (
                      <button
                        type="button"
                        onClick={resetForm}
                        style={{ ...styles.button, background: '#64748b' }}
                      >
                        Annuler
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <div style={styles.card}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <h2 style={{ marginTop: 0 }}>Liste des clients ({clients.length})</h2>
                  <button onClick={loadClients} style={styles.button}>
                    Actualiser
                  </button>
                </div>

                <input
                  aria-label="Rechercher un client"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={styles.input}
                  placeholder="Rechercher par nom, téléphone ou adresse…"
                />

                {clientsLoading ? (
                  <p>Chargement des clients…</p>
                ) : filteredClients.length === 0 ? (
                  <p style={{ color: '#64748b' }}>
                    {clients.length === 0
                      ? 'Aucun client enregistré pour le moment. Ajoutez votre premier client ci-dessus.'
                      : 'Aucun résultat pour cette recherche.'}
                  </p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                      <thead>
                        <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                          {['Nom du client', 'Téléphone', 'Adresse', 'Statut', 'Actions'].map((heading) => (
                            <th key={heading} style={{ padding: 12, borderBottom: '1px solid #e2e8f0' }}>
                              {heading}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredClients.map((client) => (
                          <tr key={client.id}>
                            <td style={{ padding: 12, borderBottom: '1px solid #e2e8f0' }}>
                              {client.nom}
                            </td>
                            <td style={{ padding: 12, borderBottom: '1px solid #e2e8f0' }}>
                              {client.telephone || '—'}
                            </td>
                            <td style={{ padding: 12, borderBottom: '1px solid #e2e8f0' }}>
                              {client.adresse || '—'}
                            </td>
                            <td style={{ padding: 12, borderBottom: '1px solid #e2e8f0' }}>
                              <span style={{ color: client.actif ? '#176b45' : '#b42318' }}>
                                {client.actif ? 'Actif' : 'Inactif'}
                              </span>
                            </td>
                            <td style={{ padding: 12, borderBottom: '1px solid #e2e8f0' }}>
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <button
                                  onClick={() => editClient(client)}
                                  style={{ ...styles.button, background: '#2563eb' }}
                                >
                                  Modifier
                                </button>
                                <button
                                  onClick={() => toggleClient(client)}
                                  style={{
                                    ...styles.button,
                                    background: client.actif ? '#b42318' : '#64748b',
                                  }}
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
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')).render(<App />)

