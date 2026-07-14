// State Management
let notes = JSON.parse(localStorage.getItem('notevault_notes')) || [];
let currentEditingId = null;

// DOM Elements
const notesGrid = document.getElementById('notesGrid');
const noteModal = document.getElementById('noteModal');
const noteForm = document.getElementById('noteForm');
const modalTitle = document.getElementById('modalTitle');
const noteTitleInput = document.getElementById('noteTitle');
const noteBodyInput = document.getElementById('noteBody');
const noteCountBadge = document.getElementById('note-count');
const searchInput = document.getElementById('searchInput');

// Event Listeners for modal control
document.getElementById('openModalBtn').addEventListener('click', () => openModal());
document.getElementById('closeModalBtn').addEventListener('click', closeModal);
document.getElementById('cancelBtn').addEventListener('click', closeModal);
document.getElementById('noteForm').addEventListener('submit', handleFormSubmit);
searchInput.addEventListener('input', (e) => renderNotes(e.target.value));

// Init application view
renderNotes();

// UI Rendering Utility
function renderNotes(searchTerm = '') {
    notesGrid.innerHTML = '';
    
    // Filter logic based on user searching
    const filteredNotes = notes.filter(note => 
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        note.body.toLowerCase().includes(searchTerm.toLowerCase())
    );

    noteCountBadge.textContent = filteredNotes.length;

    if (filteredNotes.length === 0) {
        notesGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
                <i class="fa-solid fa-folder-open" style="font-size: 3rem; margin-bottom: 12px; display: block; color: var(--accent-color)"></i>
                <p>No notes found. Create one to get started!</p>
            </div>`;
        return;
    }

    filteredNotes.forEach(note => {
        const noteCard = document.createElement('div');
        noteCard.className = 'note-card';
        noteCard.innerHTML = `
            <div>
                <div class="note-card-header">
                    <h4 class="note-card-title">${escapeHTML(note.title)}</h4>
                </div>
                <p class="note-card-body">${escapeHTML(note.body).replace(/\n/g, '<br>')}</p>
            </div>
            <div class="note-card-footer">
                <span class="note-date">${note.date}</span>
                <div class="note-actions">
                    <button class="action-btn" onclick="editNote('${note.id}')" title="Edit Note">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteNote('${note.id}')" title="Delete Note">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        notesGrid.appendChild(noteCard);
    });
}

// Modal Toggle Functions
function openModal(editId = null) {
    if (editId) {
        currentEditingId = editId;
        const note = notes.find(n => n.id === editId);
        modalTitle.textContent = "Edit Note";
        noteTitleInput.value = note.title;
        noteBodyInput.value = note.body;
    } else {
        currentEditingId = null;
        modalTitle.textContent = "Create New Note";
        noteForm.reset();
    }
    noteModal.classList.add('active');
}

function closeModal() {
    noteModal.classList.remove('active');
    noteForm.reset();
}

// Form Submission Event handler
function handleFormSubmit(e) {
    e.preventDefault();
    const title = noteTitleInput.value.trim();
    const body = noteBodyInput.value.trim();
    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    if (currentEditingId) {
        // Edit existing
        notes = notes.map(n => n.id === currentEditingId ? { ...n, title, body, date } : n);
    } else {
        // Create new
        const newNote = {
            id: Date.now().toString(),
            title,
            body,
            date
        };
        notes.unshift(newNote);
    }

    saveAndRefresh();
    closeModal();
}

// Delete Note Action
function deleteNote(id) {
    if (confirm("Are you sure you want to delete this note?")) {
        notes = notes.filter(n => n.id !== id);
        saveAndRefresh();
    }
}

// Edit Note Action trigger
window.editNote = function(id) {
    openModal(id);
};

window.deleteNote = function(id) {
    deleteNote(id);
};

// State persistence utility
function saveAndRefresh() {
    localStorage.setItem('notevault_notes', JSON.stringify(notes));
    renderNotes(searchInput.value);
}

// Security sanitization helper
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}
