// State management
let currentUser = null;
let profiles = [];
let groups = [];
let currentView = 'all';
let currentGroup = null;
let currentTab = 'people';

// DOM Elements
const userNameElement = document.getElementById('userName');
const logoutBtn = document.getElementById('logoutBtn');
const addProfileBtn = document.getElementById('addProfileBtn');
const addGroupBtn = document.getElementById('addGroupBtn');
const searchInput = document.getElementById('searchInput');
const profileCount = document.getElementById('profileCount');
const groupCount = document.getElementById('groupCount');
const currentViewElement = document.getElementById('currentView');
const profilesGrid = document.getElementById('profilesGrid');
const collectionsList = document.getElementById('collectionsList');
const groupsList = document.getElementById('groupsList');

// Modal Elements
const profileModal = document.getElementById('profileModal');
const groupModal = document.getElementById('groupModal');
const addToGroupModal = document.getElementById('addToGroupModal');
const closeButtons = document.querySelectorAll('.close');

// Form Elements
const profileForm = document.getElementById('profileForm');
const groupForm = document.getElementById('groupForm');
const addToGroupForm = document.getElementById('addToGroupForm');

// Tab Elements
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Firebase Auth State Check
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        userNameElement.textContent = user.displayName || user.email;
        loadData();
    } else {
        window.location.href = 'login.html';
    }
});

// Load Data from Firestore
async function loadData() {
    try {
        // Load profiles
        const profilesSnapshot = await db.collection('profiles')
            .where('userId', '==', currentUser.uid)
            .get();
        profiles = profilesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Load groups
        const groupsSnapshot = await db.collection('groups')
            .where('userId', '==', currentUser.uid)
            .get();
        groups = groupsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        updateStats();
        renderProfiles();
        renderGroups();
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Update Stats
function updateStats() {
    profileCount.textContent = `${profiles.length} people`;
    groupCount.textContent = `${groups.length} groups`;
}

// Render Profiles
function renderProfiles() {
    profilesGrid.innerHTML = '';
    const filteredProfiles = currentGroup 
        ? profiles.filter(profile => currentGroup.memberIds.includes(profile.id))
        : profiles;

    filteredProfiles.forEach(profile => {
        const card = document.createElement('div');
        card.className = 'profile-card';
        card.innerHTML = `
            <h3>${profile.name}</h3>
            <div class="role">${profile.role}</div>
            <div class="organization">${profile.organization}</div>
            <div class="bio">${profile.bio || ''}</div>
            <div class="tags">
                ${(profile.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
            <div class="profile-links">
                ${profile.linkedin ? `<a href="${profile.linkedin}" target="_blank"><i class="fab fa-linkedin"></i></a>` : ''}
                ${profile.email ? `<a href="mailto:${profile.email}"><i class="fas fa-envelope"></i></a>` : ''}
                <button class="btn btn-secondary add-to-group-btn" data-profile-id="${profile.id}">
                    <i class="fas fa-users"></i> Add to Group
                </button>
            </div>
        `;
        profilesGrid.appendChild(card);
    });

    // Add event listeners to "Add to Group" buttons
    document.querySelectorAll('.add-to-group-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const profileId = btn.dataset.profileId;
            showAddToGroupModal(profileId);
        });
    });
}

// Render Groups
function renderGroups() {
    groupsList.innerHTML = '';
    groups.forEach(group => {
        const item = document.createElement('div');
        item.className = 'collection-item';
        item.innerHTML = `
            <i class="fas fa-layer-group"></i>
            <span>${group.name}</span>
            <span class="member-count">${group.memberIds.length} members</span>
        `;
        item.addEventListener('click', () => {
            currentGroup = group;
            currentView = 'group';
            currentViewElement.textContent = group.name;
            renderProfiles();
            updateActiveTab('people');
        });
        groupsList.appendChild(item);
    });
}

// Show Add to Group Modal
function showAddToGroupModal(profileId) {
    const availableGroups = document.getElementById('availableGroups');
    availableGroups.innerHTML = '';
    
    groups.forEach(group => {
        const isMember = group.memberIds.includes(profileId);
        const checkbox = document.createElement('div');
        checkbox.className = 'profile-checkbox';
        checkbox.innerHTML = `
            <input type="checkbox" id="group-${group.id}" 
                ${isMember ? 'checked' : ''} 
                data-group-id="${group.id}">
            <label for="group-${group.id}">${group.name}</label>
        `;
        availableGroups.appendChild(checkbox);
    });

    addToGroupModal.style.display = 'block';
    addToGroupForm.dataset.profileId = profileId;
}

// Event Listeners
logoutBtn.addEventListener('click', () => {
    auth.signOut();
    window.location.href = 'login.html';
});

addProfileBtn.addEventListener('click', () => {
    profileModal.style.display = 'block';
    profileForm.reset();
});

addGroupBtn.addEventListener('click', () => {
    const groupProfiles = document.getElementById('groupProfiles');
    groupProfiles.innerHTML = '';
    
    profiles.forEach(profile => {
        const checkbox = document.createElement('div');
        checkbox.className = 'profile-checkbox';
        checkbox.innerHTML = `
            <input type="checkbox" id="profile-${profile.id}" 
                data-profile-id="${profile.id}">
            <label for="profile-${profile.id}">${profile.name}</label>
        `;
        groupProfiles.appendChild(checkbox);
    });

    groupModal.style.display = 'block';
    groupForm.reset();
});

closeButtons.forEach(button => {
    button.addEventListener('click', () => {
        profileModal.style.display = 'none';
        groupModal.style.display = 'none';
        addToGroupModal.style.display = 'none';
    });
});

// Tab Switching
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const tab = button.dataset.tab;
        updateActiveTab(tab);
    });
});

function updateActiveTab(tab) {
    currentTab = tab;
    tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    tabContents.forEach(content => {
        content.classList.toggle('active', content.id === `${tab}Tab`);
    });
}

// Form Submissions
profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const profileData = {
        userId: currentUser.uid,
        name: document.getElementById('name').value,
        role: document.getElementById('role').value,
        organization: document.getElementById('organization').value,
        bio: document.getElementById('bio').value,
        tags: document.getElementById('tags').value.split(',').map(tag => tag.trim()),
        linkedin: document.getElementById('linkedin').value,
        email: document.getElementById('email').value,
        createdAt: new Date()
    };

    try {
        await db.collection('profiles').add(profileData);
        profileModal.style.display = 'none';
        loadData();
    } catch (error) {
        console.error('Error adding profile:', error);
    }
});

groupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const selectedProfiles = Array.from(document.querySelectorAll('#groupProfiles input:checked'))
        .map(input => input.dataset.profileId);

    const groupData = {
        userId: currentUser.uid,
        name: document.getElementById('groupName').value,
        description: document.getElementById('groupDescription').value,
        memberIds: selectedProfiles,
        createdAt: new Date()
    };

    try {
        await db.collection('groups').add(groupData);
        groupModal.style.display = 'none';
        loadData();
    } catch (error) {
        console.error('Error adding group:', error);
    }
});

addToGroupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const profileId = addToGroupForm.dataset.profileId;
    const selectedGroups = Array.from(document.querySelectorAll('#availableGroups input:checked'))
        .map(input => input.dataset.groupId);

    try {
        const batch = db.batch();
        
        // Update each selected group
        for (const groupId of selectedGroups) {
            const groupRef = db.collection('groups').doc(groupId);
            const group = groups.find(g => g.id === groupId);
            
            if (!group.memberIds.includes(profileId)) {
                batch.update(groupRef, {
                    memberIds: [...group.memberIds, profileId]
                });
            }
        }

        // Remove from unselected groups
        for (const groupId of groups.map(g => g.id)) {
            if (!selectedGroups.includes(groupId)) {
                const groupRef = db.collection('groups').doc(groupId);
                const group = groups.find(g => g.id === groupId);
                
                if (group.memberIds.includes(profileId)) {
                    batch.update(groupRef, {
                        memberIds: group.memberIds.filter(id => id !== profileId)
                    });
                }
            }
        }

        await batch.commit();
        addToGroupModal.style.display = 'none';
        loadData();
    } catch (error) {
        console.error('Error updating groups:', error);
    }
});

// Search functionality
let searchTimeout;
searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const query = e.target.value.toLowerCase();
        const filteredProfiles = profiles.filter(profile => 
            profile.name.toLowerCase().includes(query) ||
            profile.role.toLowerCase().includes(query) ||
            profile.organization.toLowerCase().includes(query) ||
            (profile.tags && profile.tags.some(tag => tag.toLowerCase().includes(query)))
        );
        renderFilteredProfiles(filteredProfiles);
    }, 300);
});

function renderFilteredProfiles(filteredProfiles) {
    profilesGrid.innerHTML = '';
    filteredProfiles.forEach(profile => {
        const card = document.createElement('div');
        card.className = 'profile-card';
        card.innerHTML = `
            <h3>${profile.name}</h3>
            <div class="role">${profile.role}</div>
            <div class="organization">${profile.organization}</div>
            <div class="bio">${profile.bio || ''}</div>
            <div class="tags">
                ${(profile.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
            <div class="profile-links">
                ${profile.linkedin ? `<a href="${profile.linkedin}" target="_blank"><i class="fab fa-linkedin"></i></a>` : ''}
                ${profile.email ? `<a href="mailto:${profile.email}"><i class="fas fa-envelope"></i></a>` : ''}
                <button class="btn btn-secondary add-to-group-btn" data-profile-id="${profile.id}">
                    <i class="fas fa-users"></i> Add to Group
                </button>
            </div>
        `;
        profilesGrid.appendChild(card);
    });
}

// View toggle
document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        profilesGrid.classList.toggle('list', btn.dataset.view === 'list');
    });
}); 