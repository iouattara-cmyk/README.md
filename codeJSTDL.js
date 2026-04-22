function getUsers() {
    return JSON.parse(localStorage.getItem("users") || "[]");
}

// Sauvegarde la liste des utilisateurs
function saveUsers(users) {
    localStorage.setItem("users", JSON.stringify(users));
}

// Retourne l'utilisateur actuellement connecté
function getCurrentUser() {
    return JSON.parse(localStorage.getItem("currentUser") || "null");
}

// Retourne toutes les tâches (de tous les utilisateurs)
function getAllTasks() {
    return JSON.parse(localStorage.getItem("tasks") || "[]");
}

// Sauvegarde toutes les tâches
function saveAllTasks(tasks) {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Retourne les tâches de l'utilisateur connecté
function getUserTasks() {
    const user = getCurrentUser();
    if (!user) return [];
    return getAllTasks().filter(t => t.owner === user.email);
}

// Retourne le dernier historique
function getHistory() {
    return JSON.parse(localStorage.getItem("history") || '{"added": null, "deleted": null}');
}

function saveHistory(history) {
    localStorage.setItem("history", JSON.stringify(history));
}


/* ============================================================
   AUTHENTIFICATION
   ============================================================ */

// Bascule entre les onglets connexion / inscription
function switchTab(tab) {
    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
    document.querySelectorAll(".auth-form").forEach(form => form.classList.remove("active"));

    if (tab === "login") {
        document.querySelectorAll(".tab-btn")[0].classList.add("active");
        document.getElementById("loginForm").classList.add("active");
    } else {
        document.querySelectorAll(".tab-btn")[1].classList.add("active");
        document.getElementById("registerForm").classList.add("active");
    }

    // Effacer les messages d'erreur
    document.getElementById("loginError").textContent = "";
    document.getElementById("registerError").textContent = "";
    document.getElementById("registerSuccess").textContent = "";
}

// Inscription d'un nouvel utilisateur
function register() {
    const name     = document.getElementById("registerName").value.trim();
    const email    = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value.trim();
    const errorEl  = document.getElementById("registerError");
    const successEl = document.getElementById("registerSuccess");

    errorEl.textContent = "";
    successEl.textContent = "";

    // Vérification des champs
    if (!name || !email || !password) {
        errorEl.textContent = "Veuillez remplir tous les champs.";
        return;
    }

    if (!isValidEmail(email)) {
        errorEl.textContent = "Adresse email invalide.";
        return;
    }

    if (password.length < 4) {
        errorEl.textContent = "Le mot de passe doit contenir au moins 4 caractères.";
        return;
    }

    // Vérifier si l'email est déjà utilisé
    const users = getUsers();
    if (users.find(u => u.email === email)) {
        errorEl.textContent = "Cette adresse email est déjà utilisée.";
        return;
    }

    // Enregistrement
    users.push({ name, email, password });
    saveUsers(users);

    successEl.textContent = "Compte créé avec succès ! Vous pouvez vous connecter.";

    // Vider les champs
    document.getElementById("registerName").value = "";
    document.getElementById("registerEmail").value = "";
    document.getElementById("registerPassword").value = "";

    // Basculer vers connexion après 1.5s
    setTimeout(() => switchTab("login"), 1500);
}

// Connexion d'un utilisateur existant
function login() {
    const email    = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();
    const errorEl  = document.getElementById("loginError");

    errorEl.textContent = "";

    if (!email || !password) {
        errorEl.textContent = "Veuillez remplir tous les champs.";
        return;
    }

    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
        errorEl.textContent = "Email ou mot de passe incorrect.";
        return;
    }

    // Enregistrer la session
    localStorage.setItem("currentUser", JSON.stringify(user));

    // Afficher l'application
    showApp();
}

// Déconnexion
function logout() {
    localStorage.removeItem("currentUser");
    document.getElementById("authPage").classList.remove("hidden");
    document.getElementById("appPage").classList.add("hidden");
    document.getElementById("loginEmail").value = "";
    document.getElementById("loginPassword").value = "";
    document.getElementById("loginError").textContent = "";
}


/* ============================================================
   AFFICHAGE DE L'APPLICATION
   ============================================================ */

function showApp() {
    const user = getCurrentUser();
    if (!user) return;

    document.getElementById("authPage").classList.add("hidden");
    document.getElementById("appPage").classList.remove("hidden");

    // Message de bienvenue personnalisé
    document.getElementById("welcomeMsg").textContent = "Bonjour " + user.name + " 👋";

    // Date du jour
    const now = new Date();
    const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    document.getElementById("currentDate").textContent = now.toLocaleDateString("fr-FR", options);

    // Appliquer le mode sombre sauvegardé
    const darkPref = localStorage.getItem("darkMode_" + user.email);
    if (darkPref === "true") {
        document.body.classList.add("dark-mode");
        document.getElementById("darkModeBtn").textContent = "☀️";
    } else {
        document.body.classList.remove("dark-mode");
        document.getElementById("darkModeBtn").textContent = "🌙";
    }

    // Afficher les tâches
    displayTasks();
    updateHistory();
}


function addTask() {
    const name  = document.getElementById("taskName").value.trim();
    const desc  = document.getElementById("taskDesc").value.trim();
    const prio  = document.getElementById("taskPriority").value;
    const user  = getCurrentUser();

    if (!name) {
        alert("Veuillez entrer un titre de tâche !");
        return;
    }

    const task = {
        id: Date.now(),
        title: name,
        description: desc,
        done: false,
        priority: prio,
        date: new Date().toLocaleDateString("fr-FR"),
        owner: user.email
    };

    const allTasks = getAllTasks();
    allTasks.push(task);
    saveAllTasks(allTasks);

    // Mettre à jour l'historique
    const history = getHistory();
    history.added = name;
    saveHistory(history);

    // Vider les champs
    document.getElementById("taskName").value = "";
    document.getElementById("taskDesc").value = "";
    document.getElementById("taskPriority").value = "";

    displayTasks();
    updateHistory();
}

function displayTasks() {
    const listEl      = document.getElementById("taskList");
    const emptyEl     = document.getElementById("emptyMsg");
    const searchVal   = document.getElementById("searchInput").value.toLowerCase();
    const filterStatus = document.getElementById("filterStatus").value;

    listEl.innerHTML = "";

    let tasks = getUserTasks();

    // Filtre recherche (Bonus 3)
    if (searchVal) {
        tasks = tasks.filter(t =>
            t.title.toLowerCase().includes(searchVal) ||
            (t.description && t.description.toLowerCase().includes(searchVal))
        );
    }

    // Filtre statut (Bonus 3)
    if (filterStatus === "done")    tasks = tasks.filter(t => t.done);
    if (filterStatus === "pending") tasks = tasks.filter(t => !t.done);

    // Affichage liste vide
    if (tasks.length === 0) {
        emptyEl.classList.remove("hidden");
    } else {
        emptyEl.classList.add("hidden");
    }

    let doneCount = 0;

    tasks.forEach(task => {
        if (task.done) doneCount++;

        const isUrgent = task.title.toLowerCase().includes("urgent");

        const li = document.createElement("li");
        li.className = "task-item" +
            (task.done ? " done" : "") +
            (isUrgent ? " urgent" : "");

        const checkClass = task.done ? "task-check checked" : "task-check";
        const checkIcon  = task.done ? "✓" : "";

        const priorityTag = task.priority
            ? `<span class="priority-tag priority-${task.priority}">${task.priority}</span>`
            : "";

        const urgentTag = isUrgent
            ? `<span class="urgent-tag">!! URGENT !!</span>`
            : "";

        const descHtml = task.description
            ? `<p class="task-desc">${task.description}</p>`
            : "";

        li.innerHTML = `
            <div class="${checkClass}" onclick="toggleDone(${task.id})">${checkIcon}</div>
            <div class="task-body">
                <div class="task-title">${task.title}</div>
                ${descHtml}
                <div class="task-meta">
                    <span class="task-date">📅 ${task.date}</span>
                    ${priorityTag}
                    ${urgentTag}
                </div>
            </div>
            <div class="task-actions">
                <button onclick="modifyTask(${task.id})" title="Modifier">✏️</button>
                <button class="btn-delete" onclick="deleteTask(${task.id})" title="Supprimer">🗑️</button>
            </div>
        `;

        listEl.appendChild(li);
    });

    // Mettre à jour les compteurs avec les tâches TOTALES de l'utilisateur (pas juste filtrées)
    const allUserTasks = getUserTasks();
    const allDone = allUserTasks.filter(t => t.done).length;
    document.getElementById("taskCount").textContent     = allUserTasks.length;
    document.getElementById("taskDone").textContent      = allDone;
    document.getElementById("taskRemaining").textContent = allUserTasks.length - allDone;
}

function toggleDone(id) {
    const allTasks = getAllTasks();
    const idx = allTasks.findIndex(t => t.id === id);
    if (idx !== -1) {
        allTasks[idx].done = !allTasks[idx].done;
        saveAllTasks(allTasks);
        displayTasks();
    }
}

function modifyTask(id) {
    const allTasks = getAllTasks();
    const task = allTasks.find(t => t.id === id);
    if (!task) return;

    const newTitle = prompt("Modifier le titre :", task.title);
    if (newTitle === null) return; // annulé
    if (!newTitle.trim()) { alert("Le titre ne peut pas être vide."); return; }

    const newDesc  = prompt("Modifier la description :", task.description || "");
    const newPrio  = prompt("Modifier la priorité (Haute / Moyenne / Basse) :", task.priority || "");

    task.title       = newTitle.trim();
    task.description = newDesc !== null ? newDesc.trim() : task.description;
    task.priority    = (newPrio && ["Haute","Moyenne","Basse"].includes(newPrio)) ? newPrio : task.priority;

    saveAllTasks(allTasks);
    displayTasks();
}

function deleteTask(id) {
    const allTasks = getAllTasks();
    const task = allTasks.find(t => t.id === id);
    if (!task) return;

    if (!confirm("Supprimer la tâche « " + task.title + " » ?")) return;

    // Sauvegarder dans l'historique (Bonus 2)
    const history = getHistory();
    history.deleted = task.title;
    saveHistory(history);

    const newTasks = allTasks.filter(t => t.id !== id);
    saveAllTasks(newTasks);

    displayTasks();
    updateHistory();
}


/* ============================================================
   BONUS 1 : MODE SOMBRE
   ============================================================ */

function toggleDarkMode() {
    const user = getCurrentUser();
    const isNowDark = document.body.classList.toggle("dark-mode");
    document.getElementById("darkModeBtn").textContent = isNowDark ? "☀️" : "🌙";
    if (user) {
        localStorage.setItem("darkMode_" + user.email, isNowDark);
    }
}


/* ============================================================
   BONUS 2 : HISTORIQUE DES ACTIONS
   ============================================================ */

function updateHistory() {
    const history = getHistory();
    const addedEl   = document.getElementById("lastAdded");
    const deletedEl = document.getElementById("lastDeleted");

    addedEl.textContent   = history.added   ? "➕ Dernière ajoutée : " + history.added   : "➕ Aucune tâche ajoutée";
    deletedEl.textContent = history.deleted ? "🗑️ Dernière supprimée : " + history.deleted : "🗑️ Aucune tâche supprimée";
}


/* ============================================================
   UTILITAIRES
   ============================================================ */

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


/* ============================================================
   INITIALISATION AU CHARGEMENT
   ============================================================ */

window.addEventListener("DOMContentLoaded", () => {
    const user = getCurrentUser();
    if (user) {
        // Déjà connecté → afficher directement l'appli
        showApp();
    } else {
        document.getElementById("authPage").classList.remove("hidden");
        document.getElementById("appPage").classList.add("hidden");
    }
});