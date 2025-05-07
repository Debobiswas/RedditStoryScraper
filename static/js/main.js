// Socket.io connection
const socket = io({
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
});

// DOM Elements
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
const scrapeForm = document.getElementById('scrapeForm');
const videoForm = document.getElementById('videoForm');
const uploadBackgroundForm = document.getElementById('uploadBackgroundForm');
const progressSection = document.getElementById('progressSection');
const progressBar = document.getElementById('progressBar');
const statusText = document.getElementById('statusText');
const downloadButton = document.getElementById('downloadButton');
const notificationArea = document.getElementById('notificationArea');
const storyModal = document.getElementById('storyModal');
const modalTitle = document.getElementById('modalTitle');
const modalContent = document.getElementById('modalContent');
const closeModal = document.getElementById('closeModal');
const useStoryBtn = document.getElementById('useStoryBtn');
const storySelection = document.getElementById('storySelection');

// Selected stories and background
let selectedStories = [];
let availableStories = [];

let currentStory = null;

// Tab switching functionality
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons and contents
        tabButtons.forEach(btn => {
            btn.classList.remove('active', 'text-blue-600', 'border-blue-600');
            btn.classList.add('text-gray-600');
        });
        tabContents.forEach(content => content.classList.add('hidden'));
        
        // Add active class to clicked button and show corresponding content
        button.classList.add('active', 'text-blue-600', 'border-blue-600');
        button.classList.remove('text-gray-600');
        document.getElementById(button.dataset.tab).classList.remove('hidden');

        // If switching to Create Video tab, reload stories
        if (button.dataset.tab === 'create') {
            loadStoriesForSelection();
        }
        if (button.dataset.tab === 'manage') {
            loadVideos();
        }
    });
});

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `p-4 rounded-lg shadow-lg ${
        type === 'success' ? 'bg-green-500' :
        type === 'error' ? 'bg-red-500' :
        'bg-blue-500'
    } text-white`;
    notification.textContent = message;
    notificationArea.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Load background videos
async function loadBackgroundVideos() {
    try {
        console.log('Starting to load background videos...');
        const response = await fetch('/backgrounds');
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const backgrounds = await response.json();
        console.log('Received backgrounds:', backgrounds);
        
        const select = document.querySelector('select[name="background"]');
        if (!select) {
            console.error('Background select element not found in DOM');
            return;
        }
        
        if (!backgrounds || backgrounds.length === 0) {
            console.warn('No background videos found in server response');
            select.innerHTML = '<option value="">No background videos available</option>';
            return;
        }
        
        console.log('Populating select element with background options');
        select.innerHTML = backgrounds.map(bg => 
            `<option value="${bg}">${bg}</option>`
        ).join('');
        console.log('Background videos loaded successfully into dropdown');
    } catch (error) {
        console.error('Error in loadBackgroundVideos:', error);
        showNotification('Failed to load background videos: ' + error.message, 'error');
    }
}

// Render all stories with checkboxes for selection
function displayStoriesForSelection() {
    storySelection.innerHTML = '';
    
    availableStories.forEach((story, index) => {
        const isChecked = selectedStories.some(s => s.id === story.id);
        const storyElement = document.createElement('div');
        storyElement.className = 'story-item p-3 border rounded-lg flex items-center space-x-3 hover:bg-gray-50 transition duration-200';
        storyElement.innerHTML = `
            <input type="checkbox" class="select-story-checkbox" data-id="${story.id}" ${isChecked ? 'checked' : ''}>
            <div class="flex-1 cursor-pointer" onclick="showStoryModal(${JSON.stringify(story).replace(/\"/g, '&quot;')})">
                <h4 class="font-semibold">${story.title}</h4>
                <p class="text-sm text-gray-600">${story.content.substring(0, 100)}...</p>
                <div class="flex items-center space-x-2 mt-1">
                    <span class="text-xs text-gray-500">
                        <i class="fas fa-arrow-up"></i> ${story.upvotes}
                    </span>
                    <a href="${story.url}" target="_blank" class="text-xs text-blue-500 hover:text-blue-600">
                        <i class="fas fa-external-link-alt"></i> View on Reddit
                    </a>
                </div>
            </div>
            <button class="remove-story text-red-500 hover:text-red-600 ml-2" data-id="${story.id}">
                <i class="fas fa-trash"></i>
            </button>
        `;
        storySelection.appendChild(storyElement);
    });
    updateSelectedStoriesPreview();
}

// Track selected stories based on checkboxes
function updateSelectedStories() {
    const checkboxes = document.querySelectorAll('.select-story-checkbox');
    selectedStories = [];
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            const storyId = parseInt(checkbox.dataset.id);
            const story = availableStories.find(s => s.id === storyId);
            if (story) selectedStories.push(story);
        }
    });
    updateSelectedStoriesPreview();
}

// Update selected stories preview
function updateSelectedStoriesPreview() {
    const preview = document.getElementById('selectedStoriesPreview');
    if (selectedStories.length === 0) {
        preview.innerHTML = '<p class="text-gray-400">No stories selected.</p>';
        return;
    }
    preview.innerHTML = selectedStories.map((story, index) => `
        <div class="p-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition duration-200" 
             onclick="showStoryModal(${JSON.stringify(story).replace(/\"/g, '&quot;')})">
            <h4 class="font-semibold">Story ${index + 1}: ${story.title}</h4>
            <p class="text-sm text-gray-600">${story.content.substring(0, 100)}...</p>
            <div class="flex items-center space-x-2 mt-1">
                <span class="text-xs text-gray-500">
                    <i class="fas fa-arrow-up"></i> ${story.upvotes}
                </span>
                <a href="${story.url}" target="_blank" class="text-xs text-blue-500 hover:text-blue-600">
                    <i class="fas fa-external-link-alt"></i> View on Reddit
                </a>
            </div>
        </div>
    `).join('');
}

// Load stories for selection
async function loadStoriesForSelection() {
    try {
        console.log('Fetching stories from /stories...');
        const response = await fetch('/stories');
        const stories = await response.json();
        if (!Array.isArray(stories)) {
            console.error('Stories response is not an array:', stories);
            showNotification('Failed to load stories (bad data)', 'error');
            return;
        }
        availableStories = stories;
        // Keep selected stories checked if possible
        const selectedIds = selectedStories.map(s => s.id);
        selectedStories = availableStories.filter(s => selectedIds.includes(s.id));
        displayStoriesForSelection();
    } catch (error) {
        console.error('Error loading stories:', error);
        showNotification('Failed to load stories', 'error');
    }
}

// Listen for checkbox changes
// (Re-attach after rendering)
document.addEventListener('change', function(e) {
    if (e.target.classList.contains('select-story-checkbox')) {
        updateSelectedStories();
    }
});

// Handle story deletion
async function deleteStory(storyId) {
    try {
        const response = await fetch('/delete_story', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: storyId })
        });
        
        const result = await response.json();
        if (result.status === 'success') {
            showNotification('Story deleted successfully', 'success');
            loadStoriesForSelection(); // Reload stories after deletion
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        showNotification('Failed to delete story', 'error');
    }
}

// Handle scrape form submission
scrapeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(scrapeForm);
    
    try {
        const response = await fetch('/scrape', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                subreddit: formData.get('subreddit'),
                num_posts: formData.get('num_posts')
            })
        });
        
        const result = await response.json();
        if (result.status === 'success') {
            showNotification('Stories scraped and saved to stories.csv', 'success');
            loadStoriesForSelection();
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        showNotification('Failed to scrape stories', 'error');
    }
});

// Handle video form submission
videoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (selectedStories.length === 0) {
        showNotification('Please select at least one story', 'error');
        return;
    }
    const background = document.querySelector('select[name="background"]').value;
    try {
        const response = await fetch('/create_video', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                stories: selectedStories,
                background: background
            })
        });
        const result = await response.json();
        if (result.status === 'success') {
            progressSection.classList.remove('hidden');
            progressSection.scrollIntoView({ behavior: 'smooth' });
            trackProgress(result.task_id);
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        showNotification('Failed to create videos', 'error');
    }
});

// Handle background video upload
if (uploadBackgroundForm) {
    uploadBackgroundForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(uploadBackgroundForm);
        try {
            const response = await fetch('/upload_background', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            if (result.status === 'success') {
                showNotification('Background video uploaded successfully', 'success');
                loadBackgroundVideos();
            } else {
                showNotification(result.message, 'error');
            }
        } catch (error) {
            showNotification('Failed to upload background video', 'error');
        }
    });
} else {
    console.warn('uploadBackgroundForm element NOT found');
}

// Update progress step
function updateProgressStep(step) {
    const steps = ['audio', 'speed', 'background', 'final'];
    const stepElements = document.querySelectorAll('.progress-step');
    
    stepElements.forEach((element, index) => {
        const stepIcon = element.querySelector('.step-icon');
        if (index < steps.indexOf(step)) {
            // Completed steps
            stepIcon.classList.remove('bg-gray-200');
            stepIcon.classList.add('bg-green-500', 'text-white');
        } else if (index === steps.indexOf(step)) {
            // Current step
            stepIcon.classList.remove('bg-gray-200');
            stepIcon.classList.add('bg-blue-500', 'text-white');
        } else {
            // Upcoming steps
            stepIcon.classList.remove('bg-blue-500', 'bg-green-500', 'text-white');
            stepIcon.classList.add('bg-gray-200');
        }
    });
}

// Update progress details
function updateProgressDetails(step, progress) {
    const stepDetails = {
        audio: {
            title: 'Generating Audio',
            subtext: 'Converting text to speech...'
        },
        speed: {
            title: 'Speeding Up Audio',
            subtext: 'Adjusting audio speed...'
        },
        background: {
            title: 'Processing Video',
            subtext: 'Combining audio with background video...'
        },
        final: {
            title: 'Finalizing',
            subtext: 'Adding final touches...'
        }
    };

    document.getElementById('currentStep').textContent = stepDetails[step].title;
    document.getElementById('statusText').textContent = stepDetails[step].title;
    document.getElementById('statusSubtext').textContent = stepDetails[step].subtext;
    document.getElementById('progressPercent').textContent = `${progress}%`;
}

// Track video creation progress
function trackProgress(taskId) {
    const checkProgress = async () => {
        try {
            const response = await fetch(`/task_status/${taskId}`);
            const status = await response.json();
            
            if (status.status === 'completed') {
                // Update UI for completion
                updateProgressStep('final');
                updateProgressDetails('final', 100);
                progressBar.style.width = '100%';
                
                // Show success message
                document.getElementById('statusSpinner').classList.add('hidden');
                document.getElementById('statusText').textContent = 'Video created successfully!';
                document.getElementById('statusSubtext').textContent = 'Your video is ready to download.';
                
                // Show download button
                downloadButton.classList.remove('hidden');
                downloadButton.querySelector('a').href = status.video_path;
                return;
            }
            
            if (status.status === 'error') {
                progressSection.classList.add('hidden');
                showNotification(status.error, 'error');
                return;
            }
            
            // Update progress based on percentage
            const progress = status.progress;
            progressBar.style.width = `${progress}%`;
            
            // Determine current step based on progress
            let currentStep;
            if (progress < 30) {
                currentStep = 'audio';
            } else if (progress < 60) {
                currentStep = 'speed';
            } else if (progress < 90) {
                currentStep = 'background';
            } else {
                currentStep = 'final';
            }
            
            updateProgressStep(currentStep);
            updateProgressDetails(currentStep, progress);
            
            setTimeout(checkProgress, 1000);
        } catch (error) {
            showNotification('Failed to check progress', 'error');
        }
    };
    
    checkProgress();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements (now local to this block)
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const scrapeForm = document.getElementById('scrapeForm');
    const videoForm = document.getElementById('videoForm');
    const uploadBackgroundForm = document.getElementById('uploadBackgroundForm');
    const progressSection = document.getElementById('progressSection');
    const progressBar = document.getElementById('progressBar');
    const statusText = document.getElementById('statusText');
    const downloadButton = document.getElementById('downloadButton');
    const notificationArea = document.getElementById('notificationArea');
    const storyModal = document.getElementById('storyModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');
    const closeModal = document.getElementById('closeModal');
    const useStoryBtn = document.getElementById('useStoryBtn');
    const storySelection = document.getElementById('storySelection');

    // Attach modal close event listeners after DOM is loaded
    if (closeModal) {
        console.log('closeModal button found, attaching click event');
        closeModal.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('closeModal button clicked');
            closeStoryModal();
        });
    } else {
        console.error('closeModal button NOT found');
    }
    if (storyModal) {
        console.log('storyModal found, attaching overlay click event');
        storyModal.addEventListener('click', (e) => {
            if (e.target === storyModal) {
                console.log('Clicked outside modal content, closing modal');
                closeStoryModal();
            }
        });
    } else {
        console.error('storyModal NOT found');
    }
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !storyModal.classList.contains('hidden')) {
            console.log('Escape key pressed, closing modal');
            closeStoryModal();
        }
    });
    // Fallback: force close modal if open after 10 seconds (for debugging)
    setInterval(() => {
        if (!storyModal.classList.contains('hidden')) {
            console.warn('Modal still open after 10s, forcibly closing (debug)');
            // closeStoryModal(); // Uncomment for emergency debugging
        }
    }, 10000);

    // Attach storySelection click event listener
    if (storySelection) {
        storySelection.addEventListener('click', (e) => {
            if (e.target.closest('.remove-story')) {
                const storyId = parseInt(e.target.closest('.remove-story').dataset.id);
                deleteStory(storyId);
            }
        });
    } else {
        console.error('storySelection element NOT found');
    }

    // Existing initializations
    loadBackgroundVideos();
    loadStoriesForSelection();

    const uploadYoutubeBtn = document.getElementById('uploadYoutubeBtn');
    if (uploadYoutubeBtn) {
        uploadYoutubeBtn.addEventListener('click', async () => {
            uploadYoutubeBtn.disabled = true;
            uploadYoutubeBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Uploading...';
            try {
                const response = await fetch('/upload_youtube', { method: 'POST' });
                const result = await response.json();
                if (result.status === 'success') {
                    showNotification(result.message, 'success');
                    loadVideos();
                } else {
                    showNotification(result.message, 'error');
                }
            } catch (error) {
                showNotification('Failed to upload to YouTube', 'error');
            }
            uploadYoutubeBtn.disabled = false;
            uploadYoutubeBtn.innerHTML = '<i class="fab fa-youtube mr-2"></i>Upload All to YouTube';
        });
    }

    const cleanupTempAudioBtn = document.getElementById('cleanupTempAudioBtn');
    if (cleanupTempAudioBtn) {
        cleanupTempAudioBtn.addEventListener('click', async () => {
            cleanupTempAudioBtn.disabled = true;
            cleanupTempAudioBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Cleaning...';
            try {
                const response = await fetch('/cleanup_temp_audio', { method: 'POST' });
                const result = await response.json();
                if (result.status === 'success') {
                    showNotification(result.message, 'success');
                    loadVideos();
                } else {
                    showNotification(result.message, 'error');
                }
            } catch (error) {
                showNotification('Failed to clean up temp audio files', 'error');
            }
            cleanupTempAudioBtn.disabled = false;
            cleanupTempAudioBtn.innerHTML = '<i class="fas fa-broom mr-2"></i>Clean Up Temp Audio Files';
        });
    }
});

// Socket.io event handlers
socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
    showNotification('Connection error. Please refresh the page.', 'error');
});

socket.on('connect', () => {
    console.log('Connected to server');
    loadBackgroundVideos();
    loadStoriesForSelection();
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
    showNotification('Disconnected from server. Attempting to reconnect...', 'warning');
});

// Show modal with story content
function showStoryModal(story) {
    currentStory = story;
    modalTitle.textContent = story.title;
    modalContent.innerHTML = `
        <div class="prose max-w-none">
            <p class="whitespace-pre-wrap">${story.content}</p>
        </div>
    `;
    storyModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
}

// Close modal
function closeStoryModal() {
    storyModal.classList.add('hidden');
    document.body.style.overflow = ''; // Restore scrolling
    currentStory = null;
}

// Use story for video
useStoryBtn.addEventListener('click', () => {
    if (currentStory) {
        // Add story to selection if not already there
        if (!selectedStories.includes(currentStory)) {
            selectedStories.push(currentStory);
            displayStoriesForSelection();
        }
        closeStoryModal();
    }
});

// Video preview modal logic
const videoPreviewModal = document.getElementById('videoPreviewModal');
const videoPreviewPlayer = document.getElementById('videoPreviewPlayer');
const closeVideoPreview = document.getElementById('closeVideoPreview');

// Delegate click event for video cards
const videosList = document.getElementById('videosList');
if (videosList) {
    videosList.addEventListener('click', function(e) {
        const videoCard = e.target.closest('.video-preview-card');
        if (videoCard) {
            const videoSrc = videoCard.getAttribute('data-video-src');
            if (videoSrc) {
                videoPreviewPlayer.src = videoSrc;
                videoPreviewModal.classList.remove('hidden');
                document.body.style.overflow = 'hidden';
            }
        }
    });
}

if (closeVideoPreview) {
    closeVideoPreview.addEventListener('click', () => {
        videoPreviewModal.classList.add('hidden');
        videoPreviewPlayer.pause();
        videoPreviewPlayer.src = '';
        document.body.style.overflow = '';
    });
}
if (videoPreviewModal) {
    videoPreviewModal.addEventListener('click', (e) => {
        if (e.target === videoPreviewModal) {
            videoPreviewModal.classList.add('hidden');
            videoPreviewPlayer.pause();
            videoPreviewPlayer.src = '';
            document.body.style.overflow = '';
        }
    });
}

// Update loadVideos to add .video-preview-card and data-video-src
async function loadVideos() {
    try {
        const response = await fetch('/videos');
        const videos = await response.json();
        const videosList = document.getElementById('videosList');
        videosList.innerHTML = '';
        if (!Array.isArray(videos) || videos.length === 0) {
            videosList.innerHTML = '<p class="text-gray-400">No videos found.</p>';
            return;
        }
        videos.forEach(video => {
            const videoCard = document.createElement('div');
            videoCard.className = 'video-preview-card p-4 border rounded-lg flex items-center space-x-4 bg-gray-50';
            videoCard.setAttribute('data-video-src', `/videos/${video}`);
            videoCard.innerHTML = `
                <video src="/videos/${video}" class="w-32 h-20 rounded pointer-events-none"></video>
                <div class="flex-1">
                    <p class="font-semibold">${video}</p>
                    <div class="flex space-x-4">
                        <a href="/videos/${video}" download class="text-blue-500 hover:underline text-sm">Download</a>
                        <button class="delete-video text-red-500 hover:text-red-700 text-sm" data-filename="${video}">
                            <i class="fas fa-trash-alt"></i> Delete
                        </button>
                    </div>
                </div>
            `;
            videosList.appendChild(videoCard);
        });

        // Add click handlers for delete buttons
        document.querySelectorAll('.delete-video').forEach(button => {
            button.addEventListener('click', async (e) => {
                e.stopPropagation(); // Prevent video preview from opening
                const filename = button.getAttribute('data-filename');
                if (confirm(`Are you sure you want to delete ${filename}?`)) {
                    try {
                        const response = await fetch(`/delete_video/${encodeURIComponent(filename)}`, {
                            method: 'DELETE'
                        });
                        const result = await response.json();
                        if (result.status === 'success') {
                            showNotification(result.message, 'success');
                            loadVideos(); // Reload the video list
                        } else {
                            showNotification(result.message, 'error');
                        }
                    } catch (error) {
                        showNotification('Failed to delete video', 'error');
                    }
                }
            });
        });
    } catch (error) {
        const videosList = document.getElementById('videosList');
        videosList.innerHTML = '<p class="text-red-500">Failed to load videos.</p>';
    }
}

// YouTube Download Modal logic
const downloadYoutubeNavBtn = document.getElementById('downloadYoutubeNavBtn');
const youtubeDownloadModal = document.getElementById('youtubeDownloadModal');
const closeYoutubeDownloadModal = document.getElementById('closeYoutubeDownloadModal');
const startYoutubeDownloadBtn = document.getElementById('startYoutubeDownloadBtn');
const youtubeUrlInput = document.getElementById('youtubeUrlInput');

if (downloadYoutubeNavBtn && youtubeDownloadModal) {
    downloadYoutubeNavBtn.addEventListener('click', () => {
        youtubeDownloadModal.classList.remove('hidden');
        youtubeUrlInput.value = '';
        youtubeUrlInput.focus();
        document.body.style.overflow = 'hidden';
    });
}
if (closeYoutubeDownloadModal && youtubeDownloadModal) {
    closeYoutubeDownloadModal.addEventListener('click', () => {
        youtubeDownloadModal.classList.add('hidden');
        document.body.style.overflow = '';
    });
}
if (youtubeDownloadModal) {
    youtubeDownloadModal.addEventListener('click', (e) => {
        if (e.target === youtubeDownloadModal) {
            youtubeDownloadModal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    });
}
if (startYoutubeDownloadBtn && youtubeUrlInput) {
    startYoutubeDownloadBtn.addEventListener('click', async () => {
        const url = youtubeUrlInput.value.trim();
        if (!url) {
            showNotification('Please enter a YouTube URL', 'error');
            return;
        }
        startYoutubeDownloadBtn.disabled = true;
        startYoutubeDownloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Downloading...';
        try {
            const response = await fetch('/download_youtube', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });
            const result = await response.json();
            if (result.status === 'success') {
                showNotification(result.message, 'success');
                youtubeDownloadModal.classList.add('hidden');
                document.body.style.overflow = '';
            } else {
                showNotification(result.message, 'error');
            }
        } catch (error) {
            showNotification('Failed to download YouTube video', 'error');
        }
        startYoutubeDownloadBtn.disabled = false;
        startYoutubeDownloadBtn.innerHTML = '<i class="fab fa-youtube mr-2"></i>Start Download';
    });
}

// Preview background video in the Preview box
const backgroundSelect = document.querySelector('select[name="background"]');
const previewSection = document.getElementById('previewSection');

function updateVideoPreview() {
    if (!backgroundSelect || !previewSection) return;
    const selectedVideo = backgroundSelect.value;
    if (selectedVideo) {
        previewSection.innerHTML = `
            <video src="/backgrounds/${encodeURIComponent(selectedVideo)}" class="w-full h-96 rounded" muted playsinline preload="metadata" style="object-fit:cover;" poster="" onloadeddata="this.currentTime=0;this.pause();"></video>
        `;
    } else {
        previewSection.innerHTML = '<div class="bg-gray-200 rounded-lg flex items-center justify-center flex-1 h-96"><p class="text-gray-500">Video preview will appear here</p></div>';
    }
}

if (backgroundSelect) {
    backgroundSelect.addEventListener('change', updateVideoPreview);
    // Initial preview
    updateVideoPreview();
} 