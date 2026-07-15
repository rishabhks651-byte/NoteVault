// State Management
let notes = JSON.parse(localStorage.getItem('notevault_notes')) || [];
let currentEditingId = null;
let currentView = 'all'; // Track active view: 'all', 'favorites', or 'trash'

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

// Sidebar Navigation Tab Control
const menuItems = document.querySelectorAll('.menu-item');
menuItems.forEach(item => {
    item.addEventListener('click', () => {
        // Update active class on tab
        menuItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        // Change view state
        const text = item.textContent.trim().toLowerCase();
        if (text.includes('all')) {
            currentView = 'all';
        } else if (text.includes('favorite')) {
            currentView = 'favorites';
        } else if (text.includes('trash')) {
            currentView = 'trash';
        }
        
        renderNotes(searchInput.value);
    });
});

// Init application view
renderNotes();

// UI Rendering Utility
function renderNotes(searchTerm = '') {
    notesGrid.innerHTML = '';
    
    // Filter notes depending on Active Tab & Search Input
    const filteredNotes = notes.filter(note => {
        // Tab system filtering
        if (currentView === 'all' && note.isTrash) return false;
        if (currentView === 'favorites' && (!note.favorite || note.isTrash)) return false;
        if (currentView === 'trash' && !note.isTrash) return false;

        // Query filtering
        return note.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
               note.body.toLowerCase().includes(searchTerm.toLowerCase());
    });

    noteCountBadge.textContent = filteredNotes.length;

    if (filteredNotes.length === 0) {
        let emptyIcon = 'fa-folder-open';
        let emptyMessage = 'No notes found. Create one to get started!';
        
        if (currentView === 'favorites') {
            emptyIcon = 'fa-star';
            emptyMessage = 'No favorite notes yet. Star some to see them here!';
        } else if (currentView === 'trash') {
            emptyIcon = 'fa-trash-can';
            emptyMessage = 'Your Trash bin is currently empty.';
        }

        notesGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
                <i class="fa-solid ${emptyIcon}" style="font-size: 3rem; margin-bottom: 12px; display: block; color: var(--accent-color)"></i>
                <p>${emptyMessage}</p>
            </div>`;
        return;
    }

    filteredNotes.forEach(note => {
        const noteCard = document.createElement('div');
        noteCard.className = 'note-card';
        
        // Swap out icons/buttons depending on if the item is in the trash
        let footerActions = '';
        if (note.isTrash) {
            footerActions = `
                <div class="note-actions">
                    <button class="action-btn restore-btn" onclick="restoreNote('${note.id}')" title="Restore Note">
                        <i class="fa-solid fa-arrow-rotate-left"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="permanentDeleteNote('${note.id}')" title="Delete Permanently">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            `;
        } else {
            footerActions = `
                <div class="note-actions">
                    <button class="action-btn fav-btn ${note.favorite ? 'active' : ''}" onclick="toggleFavorite('${note.id}')" title="${note.favorite ? 'Unfavorite' : 'Favorite'}">
                        <i class="fa-${note.favorite ? 'solid' : 'regular'} fa-star"></i>
                    </button>
                    <button class="action-btn" onclick="editNote('${note.id}')" title="Edit Note">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteNote('${note.id}')" title="Move to Trash">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `;
        }

        noteCard.innerHTML = `
            <div>
                <div class="note-card-header">
                    <h4 class="note-card-title">${escapeHTML(note.title)}</h4>
                </div>
                <p class="note-card-body">${escapeHTML(note.body).replace(/\n/g, '<br>')}</p>
            </div>
            <div class="note-card-footer">
                <span class="note-date">${note.date}</span>
                ${footerActions}
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
            date,
            favorite: false,
            isTrash: false
        };
        notes.unshift(newNote);
    }

    saveAndRefresh();
    closeModal();
}

// --- Globally Exposed Window Action Functions ---

// Favorite Toggle
window.toggleFavorite = function(id) {
    notes = notes.map(n => n.id === id ? { ...n, favorite: !n.favorite } : n);
    saveAndRefresh();
};

// Soft Delete (Move to Trash)
window.deleteNote = function(id) {
    notes = notes.map(n => n.id === id ? { ...n, isTrash: true } : n);
    saveAndRefresh();
};

// Restore from Trash Bin
window.restoreNote = function(id) {
    notes = notes.map(n => n.id === id ? { ...n, isTrash: false } : n);
    saveAndRefresh();
};

// Permanent Hard Delete
window.permanentDeleteNote = function(id) {
    if (confirm("Are you sure you want to permanently delete this note? This cannot be undone.")) {
        notes = notes.filter(n => n.id !== id);
        saveAndRefresh();
    }
};

// Open edit modal trigger
window.editNote = function(id) {
    openModal(id);
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
