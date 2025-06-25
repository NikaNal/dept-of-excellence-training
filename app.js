// Configuration - Replace with your published Google Sheets URLs
const CONFIG = {
    schoolsSheet: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR3kIrCkdjXU_XDesNznSNYikt3HnQT75aXwfGmFGEzCDzq2WzYh5SF0rmnH3QyLXpCraf-Wodiq6It/pub?gid=1690303579&single=true&output=csv',
    rpSheet: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR3kIrCkdjXU_XDesNznSNYikt3HnQT75aXwfGmFGEzCDzq2WzYh5SF0rmnH3QyLXpCraf-Wodiq6It/pub?gid=0&single=true&output=csv',
    topicsSheet: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR3kIrCkdjXU_XDesNznSNYikt3HnQT75aXwfGmFGEzCDzq2WzYh5SF0rmnH3QyLXpCraf-Wodiq6It/pub?gid=858133414&single=true&output=csv'
};

// Global variables
let schools = [];
let resourcePersons = [];
let topics = [];
let selectedSchool = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Initialize date picker
    flatpickr("#trainingDate", {
        minDate: "today",
        dateFormat: "Y-m-d",
        disable: [
            function(date) {
                // Disable weekends
                return (date.getDay() === 0 || date.getDay() === 6);
            }
        ]
    });
    
    // Load data
    loadData();
    
    // School code lookup
    document.getElementById('schoolCode').addEventListener('change', function() {
        const code = this.value.trim();
        if (code) {
            lookupSchool(code);
        }
    });
    
    // Form submission
    document.getElementById('submitBtn').addEventListener('click', submitRequest);
    
    // New request button
    document.getElementById('newRequestBtn').addEventListener('click', resetForm);
});

// Load data from Google Sheets
async function loadData() {
    try {
        // Load schools
        const schoolsResponse = await fetchCsv(CONFIG.schoolsSheet);
        schools = parseSchoolsData(schoolsResponse);
        
        // Load resource persons
        const rpResponse = await fetchCsv(CONFIG.rpSheet);
        resourcePersons = parseRPData(rpResponse);
        
        // Load topics
        const topicsResponse = await fetchCsv(CONFIG.topicsSheet);
        topics = parseTopicsData(topicsResponse);
        
        // Populate topics dropdown
        populateTopicsDropdown();
        
    } catch (error) {
        console.error('Error loading data:', error);
        alert('Error loading data. Please try again later.');
    }
}

// Fetch CSV data
async function fetchCsv(url) {
    const response = await fetch(url);
    return await response.text();
}

// Parse schools data
function parseSchoolsData(csv) {
    const lines = csv.split('\n');
    const headers = lines[0].split(',');
    const result = [];
    
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i]) continue;
        
        const obj = {};
        const currentline = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        
        for (let j = 0; j < headers.length; j++) {
            let value = currentline[j];
            if (value && value.startsWith('"') && value.endsWith('"')) {
                value = value.substring(1, value.length - 1);
            }
            obj[headers[j].trim().replace(/"/g, '')] = value ? value.trim().replace(/"/g, '') : '';
        }
        
        result.push(obj);
    }
    
    return result;
}

// Parse resource persons data
function parseRPData(csv) {
    // Similar to parseSchoolsData but for RPs
    const lines = csv.split('\n');
    const headers = lines[0].split(',');
    const result = [];
    
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i]) continue;
        
        const obj = {};
        const currentline = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        
        for (let j = 0; j < headers.length; j++) {
            let value = currentline[j];
            if (value && value.startsWith('"') && value.endsWith('"')) {
                value = value.substring(1, value.length - 1);
            }
            obj[headers[j].trim().replace(/"/g, '')] = value ? value.trim().replace(/"/g, '') : '';
        }
        
        result.push(obj);
    }
    
    return result;
}

// Parse topics data
function parseTopicsData(csv) {
    const lines = csv.split('\n');
    const result = [];
    
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim()) {
            result.push(lines[i].trim().replace(/"/g, ''));
        }
    }
    
    return result;
}

// Populate topics dropdown
function populateTopicsDropdown() {
    const select = document.getElementById('trainingTopic');
    
    // Clear existing options except the first one
    while (select.options.length > 1) {
        select.remove(1);
    }
    
    // Add topics
    topics.forEach(topic => {
        const option = document.createElement('option');
        option.value = topic;
        option.textContent = topic;
        select.appendChild(option);
    });
}

// Lookup school by code
function lookupSchool(code) {
    selectedSchool = schools.find(school =>      school.SCH_CODE.trim().toLowerCase() === code.trim().toLowerCase() );
    
    if (selectedSchool) {
        document.getElementById('schoolName').textContent = selectedSchool.SCHOOL_NAME;
        document.getElementById('schoolDistrict').textContent = `District: ${selectedSchool.distt}`;
        document.getElementById('schoolLocation').textContent = 
            `Location: ${selectedSchool.lat}, ${selectedSchool.lng}`;
        document.getElementById('schoolDetails').style.display = 'block';
    } else {
        alert('School not found. Please check the code.');
        document.getElementById('schoolDetails').style.display = 'none';
    }
}

// Submit training request
function submitRequest() {
    // Validate form
    if (!validateForm()) return;
    
    // Show loading
    document.getElementById('submitBtn').disabled = true;
    document.getElementById('loading').style.display = 'block';
    
    // Simulate API call with timeout (in real app, this would be a fetch call)
    setTimeout(() => {
        // Assign resource persons
        const assignments = assignResourcePersons();
        
        // Show confirmation
        showConfirmation(assignments);
        
        // Hide loading
        document.getElementById('loading').style.display = 'none';
    }, 1500);
}

// Validate form
function validateForm() {
    if (!selectedSchool) {
        alert('Please enter a valid school code');
        return false;
    }
    
    const date = document.getElementById('trainingDate').value;
    if (!date) {
        alert('Please select a training date');
        return false;
    }
    
    const topic = document.getElementById('trainingTopic').value;
    if (!topic) {
        alert('Please select a training topic');
        return false;
    }
    
    return true;
}

// Assign resource persons based on criteria
function assignResourcePersons() {
    const topic = document.getElementById('trainingTopic').value;
    const district = selectedSchool.distt;
    
    // Find main RP (conducted training) in same district
    let mainRP = resourcePersons.find(rp => 
        rp.TOPIC === topic && 
        rp.TRAINING_STATUS.toLowerCase().includes('conducted') && 
        rp.DIST === district
    );
    
    // If not found, find nearest in other districts
    if (!mainRP) {
        const candidates = resourcePersons.filter(rp => 
            rp.TOPIC === topic && 
            rp.TRAINING_STATUS.toLowerCase().includes('conducted')
        );
        mainRP = findNearestRP(candidates);
    }
    
    // Find secondary RP (attended training) in same district
    let secondaryRP = resourcePersons.find(rp => 
        rp.TOPIC === topic && 
        rp.TRAINING_STATUS.toLowerCase().includes('attended') && 
        rp.DIST === district
    );
    
    // If not found, find nearest in other districts
    if (!secondaryRP) {
        const candidates = resourcePersons.filter(rp => 
            rp.TOPIC === topic && 
            rp.TRAINING_STATUS.toLowerCase().includes('attended')
        );
        secondaryRP = findNearestRP(candidates);
    }
    
    return {
        mainRP: mainRP || { RP_NAME: 'Not available', DIST: 'N/A', MOBILE_NO: '', EMAIL: '' },
        secondaryRP: secondaryRP || { RP_NAME: 'Not available', DIST: 'N/A', MOBILE_NO: '', EMAIL: '' }
    };
}

// Find nearest RP based on school location
function findNearestRP(candidates) {
    if (candidates.length === 0) return null;
    
    // In a real app, we would use Google Maps API to calculate distances
    // For this demo, we'll just return the first candidate
    return candidates[0];
}

// Show confirmation with assigned RPs
function showConfirmation(assignments) {
    const date = document.getElementById('trainingDate').value;
    const topic = document.getElementById('trainingTopic').selectedOptions[0].text;
    
    document.getElementById('confirmationDetails').innerHTML = `
        <p><strong>School:</strong> ${selectedSchool.SCHOOL_NAME}</p>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Topic:</strong> ${topic}</p>
        <div class="mt-3">
            <h6>Assigned Trainers:</h6>
            <div class="card mb-2">
                <div class="card-body py-2">
                    <h6 class="card-title mb-1">Main Trainer</h6>
                    <p class="card-text mb-1">${assignments.mainRP.RP_NAME} (${assignments.mainRP.DIST})</p>
                    <p class="card-text small text-muted mb-0">${assignments.mainRP.MOBILE_NO} | ${assignments.mainRP.EMAIL}</p>
                </div>
            </div>
            <div class="card">
                <div class="card-body py-2">
                    <h6 class="card-title mb-1">Secondary Trainer</h6>
                    <p class="card-text mb-1">${assignments.secondaryRP.RP_NAME} (${assignments.secondaryRP.DIST})</p>
                    <p class="card-text small text-muted mb-0">${assignments.secondaryRP.MOBILE_NO} | ${assignments.secondaryRP.EMAIL}</p>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('confirmation').style.display = 'block';
    document.getElementById('submitBtn').disabled = false;
}

// Reset form for new request
function resetForm() {
    document.getElementById('schoolCode').value = '';
    document.getElementById('trainingDate').value = '';
    document.getElementById('trainingTopic').selectedIndex = 0;
    document.getElementById('schoolDetails').style.display = 'none';
    document.getElementById('confirmation').style.display = 'none';
    selectedSchool = null;
}
async function loadData() {
    try {
        const schoolsResponse = await fetchCsv(CONFIG.schoolsSheet);
        schools = parseSchoolsData(schoolsResponse);
        console.log('Loaded schools:', schools); // 👈 Add this line
        // ...
    }
}
