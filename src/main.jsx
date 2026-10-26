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
        </main>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
