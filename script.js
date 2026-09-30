// L'adresse de base de l API PHP
const API_URL = 'index.php';

// ==========================================
// FONCTIONS UTILITAIRES
// ==========================================

async function chargerListeDeroulante() {
    try {
        const reponse = await fetch(`${API_URL}?action=liste_etudiants`);
        const etudiants = await reponse.json();
        
        const selectConsult = document.getElementById('select_etudiant');
        const selectNote = document.getElementById('note_etudiant_id');
        
        selectConsult.innerHTML = '<option value="">-- Choisir un étudiant --</option>';
        selectNote.innerHTML = '<option value="">-- Choisir un étudiant --</option>';

        etudiants.forEach(e => {
            const optionText = `${e.nom} ${e.prenom}`;
            selectConsult.innerHTML += `<option value="${e.id}">${optionText}</option>`;
            selectNote.innerHTML += `<option value="${e.id}">${optionText}</option>`;
        });
    } catch (erreur) {
        console.error("Erreur listes étudiants:", erreur);
    }
}

async function chargerMatieres() {
    try {
        const reponse = await fetch(`${API_URL}?action=liste_matieres`);
        const matieres = await reponse.json();
        
        const selectMatiere = document.getElementById('note_matiere_id');
        selectMatiere.innerHTML = '<option value="">-- Choisir une matière --</option>';
        
        matieres.forEach(m => {
            selectMatiere.innerHTML += `<option value="${m.id}">${m.nom_matiere}</option>`;
        });
    } catch (erreur) {
        console.error("Erreur listes matières:", erreur);
    }
}

// FONCTIONS GLOBALES (appelées depuis le HTML)

async function supprimerEtudiant(id) {
    if (!confirm("Voulez-vous vraiment supprimer cet étudiant ?")) return;

    try {
        const reponse = await fetch(`${API_URL}?action=supprimer_etudiant`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        });
        const resultat = await reponse.json();
        
        if (resultat.message) {
            alert(resultat.message);
            document.getElementById('btn-liste').click();
            chargerListeDeroulante();
        } else {
            alert(resultat.erreur);
        }
    } catch (erreur) {
        alert("Erreur lors de la suppression.");
    }
}

function ouvrirModifier(id, nom, prenom, email) {
    document.getElementById('edit_id').value = id;
    document.getElementById('edit_nom').value = nom;
    document.getElementById('edit_prenom').value = prenom;
    document.getElementById('edit_email').value = email;
    
    const modal = new bootstrap.Modal(document.getElementById('modifierModal'));
    modal.show();
}

// INITIALISATION (AU CHARGEMENT DE LA PAGE)
window.addEventListener('load', () => {
    
    // 1. Remplir les listes déroulantes
    chargerListeDeroulante();
    chargerMatieres();

    // 2. Bouton "Afficher la liste"
    document.getElementById('btn-liste').addEventListener('click', async () => {
        try {
            const reponse = await fetch(`${API_URL}?action=liste_etudiants`);
            const etudiants = await reponse.json();
            
            let html = '<table class="table table-striped table-hover"><thead><tr><th>Nom</th><th>Prénom</th><th>Email</th><th>Actions</th></tr></thead><tbody>';
            
            etudiants.forEach(e => {
                html += `<tr>
                    <td>${e.nom}</td>
                    <td>${e.prenom}</td>
                    <td>${e.email}</td>
                    <td>
                        <button class="btn btn-sm btn-warning me-1" onclick="ouvrirModifier(${e.id}, '${e.nom}', '${e.prenom}', '${e.email}')">Modifier</button>
                        <button class="btn btn-sm btn-danger" onclick="supprimerEtudiant(${e.id})">Supprimer</button>
                    </td>
                </tr>`;
            });
            html += '</tbody></table>';
            
            document.getElementById('resultat-liste').innerHTML = html;
        } catch (erreur) {
            document.getElementById('resultat-liste').innerHTML = '<p class="text-danger">Erreur lors du chargement.</p>';
        }
    });

    // 3. Bouton "Rechercher"
    document.getElementById('btn-rechercher').addEventListener('click', async () => {
        const id = document.getElementById('select_etudiant').value;
        const zoneResultat = document.getElementById('resultat-recherche');

        if (!id) {
            zoneResultat.innerHTML = '<p class="text-danger">Veuillez choisir un étudiant.</p>';
            return;
        }

        try {
            const reponseMatieres = await fetch(`${API_URL}?action=matieres_etudiant&id=${id}`);
            const matieres = await reponseMatieres.json();

            const reponseNotes = await fetch(`${API_URL}?action=notes_etudiant&id=${id}`);
            const notes = await reponseNotes.json();

            let html = '<h4>Matières :</h4>';
            if (matieres.length === 0) {
                html += '<p class="text-muted">Aucune matière trouvée.</p>';
            } else {
                html += '<ul>';
                matieres.forEach(m => html += `<li>${m.nom_matiere}</li>`);
                html += '</ul>';
            }

            html += '<h4 class="mt-3">Notes :</h4>';
            if (notes.length === 0) {
                html += '<p class="text-muted">Aucune note trouvée.</p>';
            } else {
                html += '<table class="table table-striped"><thead><tr><th>Matière</th><th>Note</th></tr></thead><tbody>';
                notes.forEach(n => {
                    html += `<tr><td>${n.nom_matiere}</td><td>${n.note}</td></tr>`;
                });
                html += '</tbody></table>';
            }

            zoneResultat.innerHTML = html;
        } catch (erreur) {
            zoneResultat.innerHTML = '<p class="text-danger">Erreur lors de la recherche.</p>';
        }
    });

    // 4. Formulaire "Ajouter un étudiant"
    document.getElementById('form-etudiant').addEventListener('submit', async (event) => {
        event.preventDefault();
        const data = {
            nom: document.getElementById('nom').value,
            prenom: document.getElementById('prenom').value,
            email: document.getElementById('email').value
        };

        try {
            const reponse = await fetch(`${API_URL}?action=ajout_etudiant`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const resultat = await reponse.json();
            
            const zone = document.getElementById('resultat-etudiant');
            if (resultat.message) {
                zone.innerHTML = `<p class="text-success">✅ ${resultat.message}</p>`;
                document.getElementById('form-etudiant').reset();
                chargerListeDeroulante();
            } else {
                zone.innerHTML = `<p class="text-danger">❌ ${resultat.erreur}</p>`;
            }
        } catch (erreur) {
            document.getElementById('resultat-etudiant').innerHTML = '<p class="text-danger">Erreur.</p>';
        }
    });

    // 5. Formulaire "Ajouter une note"
    document.getElementById('form-note').addEventListener('submit', async (event) => {
        event.preventDefault();
        const data = {
            etudiant_id: document.getElementById('note_etudiant_id').value,
            matiere_id: document.getElementById('note_matiere_id').value,
            note: document.getElementById('note').value
        };

        try {
            const reponse = await fetch(`${API_URL}?action=ajout_note`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const resultat = await reponse.json();
            
            const zone = document.getElementById('resultat-note');
            if (resultat.message) {
                zone.innerHTML = `<p class="text-success">✅ ${resultat.message}</p>`;
                document.getElementById('form-note').reset();
            } else {
                zone.innerHTML = `<p class="text-danger">❌ ${resultat.erreur}</p>`;
            }
        } catch (erreur) {
            document.getElementById('resultat-note').innerHTML = '<p class="text-danger">Erreur.</p>';
        }
    });

    // 6. Bouton "Enregistrer" de la modale (Modifier)
    document.getElementById('btn-save-edit').addEventListener('click', async () => {
        const data = {
            id: document.getElementById('edit_id').value,
            nom: document.getElementById('edit_nom').value,
            prenom: document.getElementById('edit_prenom').value,
            email: document.getElementById('edit_email').value
        };

        try {
            const reponse = await fetch(`${API_URL}?action=modifier_etudiant`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const resultat = await reponse.json();
            
            if (resultat.message) {
                alert(resultat.message);
                bootstrap.Modal.getInstance(document.getElementById('modifierModal')).hide();
                document.getElementById('btn-liste').click();
                chargerListeDeroulante();
            } else {
                alert(resultat.erreur);
            }
        } catch (erreur) {
            alert("Erreur lors de la modification.");
        }
    });
});