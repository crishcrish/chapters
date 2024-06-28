// script.js

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDjtFmm1d8hYivwtv0M94y8rL3ESxAm_U4",
    authDomain: "calendarionivaria.firebaseapp.com",
    projectId: "calendarionivaria",
    storageBucket: "calendarionivaria.appspot.com",
    messagingSenderId: "788433381501",
    appId: "1:788433381501:web:399cf04f3c47dae758a914",
    measurementId: "G-X015D733W4"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

document.addEventListener('DOMContentLoaded', function() {
    const calendar = document.getElementById('calendar');
    const addChapterButton = document.getElementById('add-chapter-button');
    const modal = document.getElementById('questionnaire-modal');
    const closeButton = document.querySelector('.close-button');
    const form = document.getElementById('questionnaire-form');
    const timeUnitSelect = document.getElementById('time-unit');
    const timeValueInput = document.getElementById('time-value');
    const seasonNumberInput = document.getElementById('season-number');

    // Configurar Flatpickr para el campo de fecha
    flatpickr(timeValueInput, {
        enableTime: false,
        dateFormat: "Y-m-d",
        minDate: null
    });

    // Load saved chapters from Firestore
    function loadChapters() {
        calendar.innerHTML = '';

        db.collection('chapters').get()
            .then((querySnapshot) => {
                const seasons = {};

                querySnapshot.forEach((doc) => {
                    const chapter = doc.data();
                    const index = doc.id;

                    if (!seasons[chapter.season]) {
                        seasons[chapter.season] = [];
                    }

                    seasons[chapter.season].push({ id: index, ...chapter });
                });

                displayChapters(seasons);
            })
            .catch((error) => {
                console.error('Error loading chapters: ', error);
            });
    }

    function displayChapters(seasons) {
        // Mostrar capítulos agrupados por temporadas
        Object.keys(seasons).forEach(seasonNumber => {
            const seasonDiv = document.createElement('div');
            seasonDiv.className = 'season';
            seasonDiv.innerHTML = `<h3>Temporada ${seasonNumber}</h3>`;

            seasons[seasonNumber].forEach(item => {
                addTimeElement(seasonDiv, item);
            });

            calendar.appendChild(seasonDiv);
        });
    }

    // Function to format date as YYYYMMDD
    function formatDate(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    }

    // Function to add chapter to Firestore
    function addChapter(chapterName, timeUnit, timeValue, seasonNumber) {
        let displayDate = '';
        let docId = '';

        if (timeUnit === 'week') {
            const selectedDate = new Date(timeValue);
            const startOfWeek = new Date(selectedDate);
            startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
            const endOfWeek = new Date(selectedDate);
            endOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay() + 6);
            displayDate = `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`;
            docId = `${seasonNumber}-${formatDate(startOfWeek)}`;
        } else {
            const selectedDate = new Date(timeValue);
            displayDate = selectedDate.toLocaleDateString();
            docId = `${seasonNumber}-${formatDate(selectedDate)}`;
        }

        const chapterData = {
            name: chapterName,
            date: displayDate,
            season: seasonNumber,
            type: timeUnit
        };

        db.collection('chapters').doc(docId).set(chapterData)
            .then(() => {
                console.log('Chapter added successfully');
                loadChapters(); // Reload chapters after addition
            })
            .catch((error) => {
                console.error('Error adding chapter: ', error);
            });
    }

    // Function to add time element to calendar
    // Function to add time element to calendar
function addTimeElement(container, chapter) {
    const timeDiv = document.createElement('div');
    timeDiv.textContent = chapter.name;
    
    const dateDiv = document.createElement('div');
    dateDiv.textContent = chapter.date;

    const elementDiv = document.createElement('div');
    elementDiv.appendChild(timeDiv);
    elementDiv.appendChild(dateDiv);

    if (chapter.type === 'week') {
        elementDiv.className = 'week';
    } else {
        elementDiv.className = 'day';
    }

    elementDiv.dataset.index = chapter.id;
    elementDiv.addEventListener('click', () => renameChapter(chapter.id));

    container.appendChild(elementDiv);
}


    // Function to rename chapter in Firestore

    // Show modal on button click
    addChapterButton.addEventListener('click', () => {
        modal.style.display = 'block';
    });

    // Close modal on close button click
    closeButton.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Handle form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const chapterName = form['chapter-name'].value;
        const timeUnit = form['time-unit'].value;
        const timeValue = timeValueInput.value;
        const seasonNumber = seasonNumberInput.value;

        addChapter(chapterName, timeUnit, timeValue, seasonNumber);

        form.reset();
        modal.style.display = 'none';
    });

    // Close modal when clicking outside of it
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Load initial chapters
    loadChapters();
});
