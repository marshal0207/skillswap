// Global Variables
let currentUser = null;
let allUsers = [];

// Utility Functions
function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" aria-label="Close notification">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add styles if not already added
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 100px;
                right: 20px;
                background: white;
                padding: 1rem 1.5rem;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                display: flex;
                align-items: center;
                gap: 0.5rem;
                z-index: 10000;
                max-width: 400px;
                animation: slideInRight 0.3s ease;
                border-left: 4px solid #667eea;
            }
            .notification-success { border-left-color: #48bb78; }
            .notification-error { border-left-color: #f56565; }
            .notification button {
                background: none;
                border: none;
                cursor: pointer;
                margin-left: auto;
                padding: 0.25rem;
                color: #718096;
            }
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @media (max-width: 768px) {
                .notification {
                    right: 10px;
                    left: 10px;
                    max-width: none;
                }
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Mobile Menu Toggle
function toggleMobileMenu() {
    const navMenu = document.getElementById('navMenu');
    const toggle = document.querySelector('.mobile-menu-toggle');
    
    navMenu.classList.toggle('active');
    toggle.classList.toggle('active');
}

// Navigation Functions
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionId).classList.add('active');
    
    // Update navigation buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Close mobile menu
    document.getElementById('navMenu').classList.remove('active');
    document.querySelector('.mobile-menu-toggle').classList.remove('active');
    
    // Load section-specific data
    switch(sectionId) {
        case 'home':
            loadHomeStats();
            break;
        case 'browse':
            loadBrowseSection();
            break;
        case 'swaps':
            loadSwapsSection();
            break;
        case 'profile':
            loadProfileSection();
            break;
        case 'admin':
            // Admin section loads on demand
            break;
    }
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Profile Management
function loadProfileSection() {
    const profile = getStoredProfile();
    if (profile) {
        document.getElementById('name').value = profile.name || '';
        document.getElementById('location').value = profile.location || '';
        document.getElementById('photo').value = profile.photo || '';
        document.getElementById('skillsOffered').value = profile.skillsOffered?.join(', ') || '';
        document.getElementById('skillsWanted').value = profile.skillsWanted?.join(', ') || '';
        document.getElementById('availability').value = profile.availability || 'Flexible';
        document.getElementById('isPublic').checked = profile.isPublic !== false;
    }
}

function getStoredProfile() {
    try {
        return JSON.parse(localStorage.getItem('myProfile')) || null;
    } catch (e) {
        console.error('Error parsing stored profile:', e);
        return null;
    }
}

async function saveProfile(profileData) {
    try {
        console.log('Saving profile to database:', profileData);
        
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(profileData)
        });
        
        if (response.ok) {
            const savedUser = await response.json();
            localStorage.setItem('myProfile', JSON.stringify(savedUser));
            currentUser = savedUser;
            console.log('Profile saved successfully:', savedUser);
            return true;
        } else {
            console.error('Error saving profile:', response.statusText);
            return false;
        }
    } catch (e) {
        console.error('Error saving profile:', e);
        return false;
    }
}

async function getAllUsers() {
    try {
        const response = await fetch('/api/users');
        if (response.ok) {
            return await response.json();
        } else {
            console.error('Error fetching users:', response.statusText);
            return [];
        }
    } catch (e) {
        console.error('Error fetching users:', e);
        return [];
    }
}

// Profile Form Handler
document.getElementById('profileForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    console.log('Profile form submitted');
    showLoading();
    
    const formData = new FormData(e.target);
    const profile = {
        name: formData.get('name').trim(),
        location: formData.get('location').trim(),
        photo: formData.get('photo').trim(),
        skillsOffered: formData.get('skillsOffered').split(',').map(s => s.trim()).filter(s => s),
        skillsWanted: formData.get('skillsWanted').split(',').map(s => s.trim()).filter(s => s),
        availability: formData.get('availability'),
        isPublic: formData.get('isPublic') === 'on'
    };
    
    console.log('Profile data:', profile);
    
    try {
        const success = await saveProfile(profile);
        hideLoading();
        if (success) {
            showNotification('Profile saved successfully!', 'success');
            loadHomeStats();
        } else {
            showNotification('Error saving profile. Please try again.', 'error');
        }
    } catch (error) {
        hideLoading();
        showNotification('Error saving profile. Please try again.', 'error');
        console.error('Profile save error:', error);
    }
});

// Home Section
async function loadHomeStats() {
    try {
        const users = await getAllUsers();
        const validUsers = users.filter(u => !u.banned);
        
        document.getElementById('userCount').textContent = validUsers.length;
        
        const totalSkills = validUsers.reduce((sum, user) => {
            return sum + (user.skillsOffered?.length || 0);
        }, 0);
        document.getElementById('skillCount').textContent = totalSkills;
        
        // Load announcement
        const announcementResponse = await fetch('/api/announcements');
        const announcementData = await announcementResponse.json();
        document.getElementById('announcementBar').innerHTML = `
            <i class="fas fa-megaphone"></i>
            <span>${announcementData.message}</span>
        `;
        
        // Load featured users
        loadFeaturedUsers();
        
        // Load swap count from database
        loadSwapStats();
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadSwapStats() {
    try {
        const response = await fetch('/api/admin/data');
        if (response.ok) {
            const data = await response.json();
            document.getElementById('swapCount').textContent = data.totalSwaps || 0;
        }
    } catch (error) {
        console.error('Error loading swap stats:', error);
        document.getElementById('swapCount').textContent = 0;
    }
}

async function loadFeaturedUsers() {
    try {
        const users = await getAllUsers();
        const publicUsers = users.filter(u => u.isPublic && !u.banned && u.name !== currentUser?.name);
        const featured = publicUsers.sort(() => 0.5 - Math.random()).slice(0, 3);
        
        const container = document.getElementById('featuredUsers');
        container.innerHTML = '';
        
        if (featured.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <h3>No featured members yet</h3>
                    <p>Be the first to create a public profile!</p>
                </div>
            `;
            return;
        }
        
        featured.forEach(user => {
            const userCard = document.createElement('div');
            userCard.className = 'feature';
            userCard.innerHTML = `
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                    ${user.photo ? 
                        `<img src="${user.photo}" alt="Profile Photo" class="profile-photo" style="width: 50px; height: 50px;">` : 
                        `<div style="width: 50px; height: 50px; background: #667eea; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">${user.name.charAt(0)}</div>`
                    }
                    <div>
                        <h4 style="margin: 0; color: #2d3748;">${user.name}</h4>
                        <p style="margin: 0; color: #718096; font-size: 0.9rem;">${user.location || 'Location not specified'}</p>
                    </div>
                </div>
                <p><strong>Offers:</strong> ${user.skillsOffered?.join(', ') || 'No skills listed'}</p>
                <p><strong>Wants:</strong> ${user.skillsWanted?.join(', ') || 'No skills listed'}</p>
                <p><strong>Available:</strong> ${user.availability || 'Not specified'}</p>
            `;
            container.appendChild(userCard);
        });
    } catch (error) {
        console.error('Error loading featured users:', error);
    }
}

// Browse Section
async function loadBrowseSection() {
    await renderBrowseList();
    
    // Set up search listener
    const searchInput = document.getElementById('browseSearch');
    searchInput.addEventListener('input', function(e) {
        renderBrowseList(e.target.value);
    });
}

function filterSkill(skill) {
    document.getElementById('browseSearch').value = skill;
    renderBrowseList(skill);
}

function clearSearch() {
    document.getElementById('browseSearch').value = '';
    renderBrowseList();
}

async function renderBrowseList(query = '') {
    try {
        const container = document.getElementById('browseList');
        const users = await getAllUsers();
        const currentProfile = getStoredProfile();
        const lowerQuery = query.toLowerCase();
        
        // Filter users
        const filteredUsers = users.filter(user => {
            if (user.banned || !user.isPublic || user.name === currentProfile?.name) {
                return false;
            }
            
            if (!query) return true;
            
            return (
                user.name.toLowerCase().includes(lowerQuery) ||
                user.location?.toLowerCase().includes(lowerQuery) ||
                user.skillsOffered?.some(skill => skill.toLowerCase().includes(lowerQuery)) ||
                user.skillsWanted?.some(skill => skill.toLowerCase().includes(lowerQuery))
            );
        });
        
        container.innerHTML = '';
        
        if (filteredUsers.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>${query ? 'No matching users found' : 'No users available'}</h3>
                    <p>${query ? 'Try adjusting your search terms' : 'Be the first to create a public profile!'}</p>
                </div>
            `;
            return;
        }
        
        filteredUsers.forEach(user => {
            const userCard = document.createElement('div');
            userCard.className = 'user-card';
            userCard.innerHTML = `
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                    ${user.photo ? 
                        `<img src="${user.photo}" alt="Profile Photo" class="profile-photo">` : 
                        `<div style="width: 60px; height: 60px; background: #667eea; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.2rem;">${user.name.charAt(0)}</div>`
                    }
                    <div>
                        <h4 style="margin: 0 0 0.25rem 0; color: #2d3748;">${user.name}</h4>
                        <p style="margin: 0; color: #718096;">${user.location || 'Location not specified'}</p>
                    </div>
                </div>
                <div style="margin-bottom: 1rem;">
                    <p style="margin: 0.25rem 0;"><strong>Offers:</strong> ${user.skillsOffered?.join(', ') || 'No skills listed'}</p>
                    <p style="margin: 0.25rem 0;"><strong>Wants:</strong> ${user.skillsWanted?.join(', ') || 'No skills listed'}</p>
                    <p style="margin: 0.25rem 0;"><strong>Available:</strong> ${user.availability || 'Not specified'}</p>
                </div>
                <button class="btn-secondary" onclick="requestSwap('${user.name}')" style="width: 100%;">
                    <i class="fas fa-handshake"></i>
                    Request Swap
                </button>
            `;
            container.appendChild(userCard);
        });
    } catch (error) {
        console.error('Error rendering browse list:', error);
    }
}

// Swap Management
async function requestSwap(toUserName) {
    const currentProfile = getStoredProfile();
    if (!currentProfile) {
        showNotification('Please create your profile first!', 'error');
        showSection('profile');
        return;
    }
    
    const note = prompt('Add a message for your swap request (optional):');
    if (note === null) return; // User cancelled
    
    try {
        const response = await fetch('/api/swaps', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: currentProfile.name,
                to: toUserName,
                note: note || ''
            })
        });
        
        if (response.ok) {
            showNotification(`Swap request sent to ${toUserName}!`, 'success');
        } else if (response.status === 400) {
            showNotification('You already have a pending swap request with this user.', 'error');
        } else {
            showNotification('Error sending swap request. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error requesting swap:', error);
        showNotification('Error sending swap request. Please try again.', 'error');
    }
}

// Swaps Section
async function loadSwapsSection() {
    await showSwaps();
    updateSwapCounts();
}

function toggleSwapView(type) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.swap-list').forEach(list => list.classList.remove('active'));
    
    if (type === 'incoming') {
        document.getElementById('incomingTab').classList.add('active');
        document.getElementById('incomingSwaps').classList.add('active');
    } else {
        document.getElementById('outgoingTab').classList.add('active');
        document.getElementById('outgoingSwaps').classList.add('active');
    }
    
    filterSwaps();
}

function filterSwaps() {
    showSwaps();
}

async function showSwaps() {
    const currentProfile = getStoredProfile();
    if (!currentProfile) {
        document.getElementById('incomingSwaps').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-plus"></i>
                <h3>Create your profile first</h3>
                <p>You need to create a profile to manage swap requests.</p>
            </div>
        `;
        document.getElementById('outgoingSwaps').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-plus"></i>
                <h3>Create your profile first</h3>
                <p>You need to create a profile to send swap requests.</p>
            </div>
        `;
        return;
    }
    
    try {
        const response = await fetch(`/api/swaps?user=${currentProfile.name}`);
        const allSwaps = await response.json();
        
        const statusFilter = document.getElementById('swapStatusFilter')?.value || 'all';
        const searchTerm = document.getElementById('swapSearch')?.value.toLowerCase() || '';
        
        const incomingContainer = document.getElementById('incomingSwaps');
        const outgoingContainer = document.getElementById('outgoingSwaps');
        
        incomingContainer.innerHTML = '';
        outgoingContainer.innerHTML = '';
        
        // Filter incoming swaps
        const incomingSwaps = allSwaps.filter(swap => {
            return swap.to === currentProfile.name &&
                   (statusFilter === 'all' || swap.status.toLowerCase() === statusFilter) &&
                   (searchTerm === '' || 
                    swap.from.toLowerCase().includes(searchTerm) ||
                    swap.fromSkills?.some(skill => skill.toLowerCase().includes(searchTerm)));
        });
        
        // Filter outgoing swaps
        const outgoingSwaps = allSwaps.filter(swap => {
            return swap.from === currentProfile.name &&
                   (statusFilter === 'all' || swap.status.toLowerCase() === statusFilter) &&
                   (searchTerm === '' || 
                    swap.to.toLowerCase().includes(searchTerm) ||
                    swap.toSkills?.some(skill => skill.toLowerCase().includes(searchTerm)));
        });
        
        // Render incoming swaps
        if (incomingSwaps.length === 0) {
            incomingContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <h3>No incoming requests</h3>
                    <p>No one has requested a swap with you yet.</p>
                </div>
            `;
        } else {
            incomingSwaps.forEach(swap => {
                const swapCard = createSwapCard(swap, 'incoming');
                incomingContainer.appendChild(swapCard);
            });
        }
        
        // Render outgoing swaps
        if (outgoingSwaps.length === 0) {
            outgoingContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-paper-plane"></i>
                    <h3>No outgoing requests</h3>
                    <p>You haven't sent any swap requests yet.</p>
                </div>
            `;
        } else {
            outgoingSwaps.forEach(swap => {
                const swapCard = createSwapCard(swap, 'outgoing');
                outgoingContainer.appendChild(swapCard);
            });
        }
        
        updateSwapCounts();
    } catch (error) {
        console.error('Error loading swaps:', error);
    }
}

function createSwapCard(swap, type) {
    const card = document.createElement('div');
    card.className = 'swap-card';
    
    const isIncoming = type === 'incoming';
    const otherUser = isIncoming ? swap.from : swap.to;
    const skills = isIncoming ? swap.fromSkills : swap.toSkills;
    
    card.innerHTML = `
        <div style="margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                <h4 style="margin: 0; color: #2d3748;">${isIncoming ? 'From' : 'To'}: ${otherUser}</h4>
                <span class="swap-status ${swap.status.toLowerCase()}">${swap.status}</span>
            </div>
            <p style="margin: 0.25rem 0;"><strong>Skills ${isIncoming ? 'Offered' : 'Requested'}:</strong> ${skills?.join(', ') || 'None specified'}</p>
            ${swap.note ? `<p style="margin: 0.25rem 0;"><strong>Message:</strong> ${swap.note}</p>` : ''}
            <p style="margin: 0.25rem 0; color: #718096; font-size: 0.9rem;"><strong>Requested:</strong> ${new Date(swap.timestamp).toLocaleDateString()}</p>
        </div>
        <div class="swap-actions">
            ${getSwapActions(swap, type)}
        </div>
    `;
    
    return card;
}

function getSwapActions(swap, type) {
    const isIncoming = type === 'incoming';
    
    if (swap.status === 'Pending') {
        if (isIncoming) {
            return `
                <button class="accept" onclick="respondToSwap('${swap.from}', '${swap.id}', 'Accepted')">
                    <i class="fas fa-check"></i> Accept
                </button>
                <button class="decline" onclick="respondToSwap('${swap.from}', '${swap.id}', 'Rejected')">
                    <i class="fas fa-times"></i> Reject
                </button>
            `;
        } else {
            return `
                <button class="decline" onclick="cancelSwap('${swap.to}', '${swap.id}')">
                    <i class="fas fa-trash"></i> Cancel
                </button>
            `;
        }
    } else if (swap.status === 'Accepted' && !swap.feedbackGiven) {
        return `
            <button class="btn-secondary" onclick="giveFeedback('${isIncoming ? swap.from : swap.to}', '${swap.id}')">
                <i class="fas fa-star"></i> Give Feedback
            </button>
        `;
    } else if (swap.feedbackGiven) {
        return `<p style="color: #48bb78; margin: 0;"><i class="fas fa-check-circle"></i> Feedback sent</p>`;
    }
    
    return '';
}

async function respondToSwap(fromUser, swapId, response) {
    try {
        const updateResponse = await fetch(`/api/swaps/${fromUser}/${getStoredProfile().name}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: response })
        });
        
        if (updateResponse.ok) {
            showNotification(`Swap request ${response.toLowerCase()}!`, 'success');
            await showSwaps();
        } else {
            showNotification('Error updating swap request. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error responding to swap:', error);
        showNotification('Error updating swap request. Please try again.', 'error');
    }
}

async function cancelSwap(toUser, swapId) {
    if (!confirm('Are you sure you want to cancel this swap request?')) {
        return;
    }
    
    try {
        const deleteResponse = await fetch(`/api/swaps/${getStoredProfile().name}/${toUser}`, {
            method: 'DELETE'
        });
        
        if (deleteResponse.ok) {
            showNotification('Swap request cancelled!', 'success');
            await showSwaps();
        } else {
            showNotification('Error cancelling swap request. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error cancelling swap:', error);
        showNotification('Error cancelling swap request. Please try again.', 'error');
    }
}

function giveFeedback(otherUser, swapId) {
    const feedback = prompt(`Leave feedback for ${otherUser}:`);
    if (feedback === null) return;
    
    const users = getAllUsers();
    const currentProfile = getStoredProfile();
    
    const updatedUsers = users.map(user => {
        if (user.swaps) {
            user.swaps = user.swaps.map(swap => {
                if (swap.id == swapId) {
                    return { ...swap, feedbackGiven: true, feedback: feedback || 'Positive experience' };
                }
                return swap;
            });
        }
        return user;
    });
    
    const updatedProfile = {
        ...currentProfile,
        swaps: currentProfile.swaps?.map(swap => 
            swap.id == swapId ? { ...swap, feedbackGiven: true, feedback: feedback || 'Positive experience' } : swap
        ) || []
    };
    
    localStorage.setItem('userDB', JSON.stringify(updatedUsers));
    localStorage.setItem('myProfile', JSON.stringify(updatedProfile));
    currentUser = updatedProfile;
    
    showNotification('Thank you for your feedback!', 'success');
    showSwaps();
}

async function updateSwapCounts() {
    const currentProfile = getStoredProfile();
    if (!currentProfile) return;
    
    try {
        const response = await fetch(`/api/swaps?user=${currentProfile.name}`);
        const swaps = await response.json();
        
        const incomingCount = swaps.filter(swap => 
            swap.to === currentProfile.name && swap.status === 'Pending'
        ).length;
        
        const outgoingCount = swaps.filter(swap => 
            swap.from === currentProfile.name && swap.status === 'Pending'
        ).length;
        
        document.getElementById('incomingCount').textContent = incomingCount;
        document.getElementById('outgoingCount').textContent = outgoingCount;
    } catch (error) {
        console.error('Error updating swap counts:', error);
    }
}

// Admin Functions
function enableAdmin() {
    const password = document.getElementById('adminPass').value;
    if (password === 'admin123') {
        document.getElementById('adminPanel').style.display = 'block';
        showAdminData();
        showNotification('Admin access granted!', 'success');
    } else {
        showNotification('Incorrect admin password!', 'error');
    }
}

async function showAdminData() {
    try {
        const response = await fetch('/api/admin/data');
        const data = await response.json();
        const users = data.users;
        const output = document.getElementById('adminOutput');
        
        if (users.length === 0) {
            output.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-database"></i>
                    <h3>No user data</h3>
                    <p>No users have registered yet.</p>
                </div>
            `;
            return;
        }
        
        output.innerHTML = `
            <h3 style="margin-bottom: 1.5rem; color: #2d3748;">User Management</h3>
            <div style="display: grid; gap: 1rem;">
                ${users.map(user => `
                    <div class="user-card" style="position: relative;">
                        ${user.banned ? '<div style="position: absolute; top: 1rem; right: 1rem; background: #f56565; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem; font-weight: bold;">BANNED</div>' : ''}
                        <div style="margin-bottom: 1rem;">
                            <h4 style="margin: 0 0 0.5rem 0; color: #2d3748;">${user.name}</h4>
                            <p style="margin: 0.25rem 0; color: #718096;"><strong>Location:</strong> ${user.location || 'Not specified'}</p>
                            <p style="margin: 0.25rem 0;"><strong>Skills Offered:</strong> ${user.skillsOffered?.join(', ') || 'None'}</p>
                            <p style="margin: 0.25rem 0;"><strong>Skills Wanted:</strong> ${user.skillsWanted?.join(', ') || 'None'}</p>
                            <p style="margin: 0.25rem 0;"><strong>Swaps:</strong> ${user.swaps?.length || 0}</p>
                            <p style="margin: 0.25rem 0;"><strong>Profile:</strong> ${user.isPublic ? 'Public' : 'Private'}</p>
                        </div>
                        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                            <button class="btn-secondary" onclick="banUser('${user.name}')" ${user.banned ? 'disabled' : ''}>
                                <i class="fas fa-ban"></i>
                                ${user.banned ? 'Already Banned' : 'Ban User'}
                            </button>
                            <button class="btn-secondary" onclick="moderateSkills('${user.name}')">
                                <i class="fas fa-edit"></i>
                                Moderate Skills
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (error) {
        console.error('Error loading admin data:', error);
    }
}

async function banUser(userName) {
    if (!confirm(`Are you sure you want to ban ${userName}? This action cannot be easily undone.`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/users/${userName}/ban`, {
            method: 'POST'
        });
        
        if (response.ok) {
            showNotification(`${userName} has been banned.`, 'success');
            await showAdminData();
        } else {
            showNotification('Error banning user. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error banning user:', error);
        showNotification('Error banning user. Please try again.', 'error');
    }
}

async function moderateSkills(userName) {
    if (!confirm(`Are you sure you want to reject all skills for ${userName}?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/users/${userName}/moderate-skills`, {
            method: 'POST'
        });
        
        if (response.ok) {
            showNotification(`Skills for ${userName} have been rejected.`, 'success');
            await showAdminData();
        } else {
            showNotification('Error moderating skills. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error moderating skills:', error);
        showNotification('Error moderating skills. Please try again.', 'error');
    }
}

async function sendAnnouncement() {
    const message = prompt('Enter announcement message:');
    if (!message) return;
    
    try {
        const response = await fetch('/api/announcements', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message })
        });
        
        if (response.ok) {
            showNotification('Announcement sent to all users!', 'success');
            loadHomeStats();
        } else {
            showNotification('Error sending announcement. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error sending announcement:', error);
        showNotification('Error sending announcement. Please try again.', 'error');
    }
}

function downloadData() {
    const users = getAllUsers();
    const currentProfile = getStoredProfile();
    
    const reportData = {
        generatedAt: new Date().toISOString(),
        totalUsers: users.length,
        publicProfiles: users.filter(u => u.isPublic).length,
        bannedUsers: users.filter(u => u.banned).length,
        totalSwaps: users.reduce((sum, u) => sum + (u.swaps?.length || 0), 0),
        pendingSwaps: users.reduce((sum, u) => sum + (u.swaps?.filter(s => s.status === 'Pending').length || 0), 0),
        acceptedSwaps: users.reduce((sum, u) => sum + (u.swaps?.filter(s => s.status === 'Accepted').length || 0), 0),
        users: users.map(user => ({
            ...user,
            // Remove sensitive data if needed
            id: undefined
        })),
        currentUser: currentProfile
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skillswap-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Report downloaded successfully!', 'success');
}

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    // Load current user profile
    currentUser = getStoredProfile();
    
    // Load home stats by default
    loadHomeStats();
    
    // Set up keyboard navigation
    document.addEventListener('keydown', function(e) {
        // ESC key closes mobile menu
        if (e.key === 'Escape') {
            document.getElementById('navMenu').classList.remove('active');
            document.querySelector('.mobile-menu-toggle').classList.remove('active');
        }
    });
    
    // Handle click outside mobile menu
    document.addEventListener('click', function(e) {
        const navMenu = document.getElementById('navMenu');
        const toggle = document.querySelector('.mobile-menu-toggle');
        
        if (!navMenu.contains(e.target) && !toggle.contains(e.target) && navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            toggle.classList.remove('active');
        }
    });
    
    // Make action cards keyboard accessible
    document.querySelectorAll('.action-card[tabindex="0"]').forEach(card => {
        card.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                card.click();
            }
        });
    });
    
    console.log('SkillSwap Platform initialized successfully!');
});

// Service Worker Registration (Optional - for offline functionality)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        // Register service worker when available
        // navigator.serviceWorker.register('/sw.js');
    });
}
