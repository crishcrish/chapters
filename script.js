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
        minDate: "today"
    });

    // Load saved chapters from Firestore
    function loadChapters() {
        calendar.innerHTML = '';

        db.collection('chapters').get()
            .then((querySnapshot) => {
                const savedChapters = {
                    weeks: {},
                    days: {}
                };

                querySnapshot.forEach((doc) => {
                    const chapter = doc.data();
                    const index = doc.id;

                    if (chapter.date.includes('-')) {
                        savedChapters.weeks[index] = chapter;
                    } else {
                        savedChapters.days[index] = chapter;
                    }
                });

                displayChapters(savedChapters);
            })
            .catch((error) => {
                console.error('Error loading chapters: ', error);
            });
    }

    function displayChapters(savedChapters) {
        // Agrupar capítulos por temporadas
        const seasons = {};
        Object.keys(savedChapters.weeks).forEach(index => {
            const chapter = savedChapters.weeks[index];
            if (!seasons[chapter.season]) {
                seasons[chapter.season] = [];
            }
            seasons[chapter.season].push({ type: 'week', index, data: chapter });
        });
        Object.keys(savedChapters.days).forEach(index => {
            const chapter = savedChapters.days[index];
            if (!seasons[chapter.season]) {
                seasons[chapter.season] = [];
            }
            seasons[chapter.season].push({ type: 'day', index, data: chapter });
        });

        // Mostrar capítulos agrupados por temporadas
        Object.keys(seasons).forEach(seasonNumber => {
            const seasonDiv = document.createElement('div');
            seasonDiv.className = 'season';
            seasonDiv.innerHTML = `<h3>Temporada ${seasonNumber}</h3>`;
            
            seasons[seasonNumber].forEach(item => {
                addTimeElement(seasonDiv, item.type, item.index, item.data);
            });

            calendar.appendChild(seasonDiv);
        });
    }

    // Function to add chapter to Firestore
    function addChapter(chapterName, timeUnit, timeValue, seasonNumber) {
        let displayDate = '';
        if (timeUnit === 'week') {
            const selectedDate = new Date(timeValue);
            const startOfWeek = new Date(selectedDate);
            startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
            const endOfWeek = new Date(selectedDate);
            endOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay() + 6);
            displayDate = `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`;
        } else {
            displayDate = new Date(timeValue).toLocaleDateString();
        }

        const chapterData = {
            name: chapterName,
            date: displayDate,
            season: seasonNumber
        };

        db.collection('chapters').add(chapterData)
            .then(() => {
                console.log('Chapter added successfully');
                loadChapters(); // Reload chapters after addition
            })
            .catch((error) => {
                console.error('Error adding chapter: ', error);
            });
    }

    // Function to add time element to calendar
    function addTimeElement(container, type, index, chapterData) {
        const timeDiv = document.createElement('div');
        timeDiv.className = type;
        timeDiv.textContent = `${chapterData.name} - ${chapterData.date}`;
        timeDiv.dataset.index = index;
        timeDiv.addEventListener('click', () => renameChapter(index));
        container.appendChild(timeDiv);
    }

    // Function to rename chapter in Firestore
    function renameChapter(id) {
        const newName = prompt("Enter a new name for this chapter:");
        if (newName) {
            db.collection('chapters').doc(id).update({ name: newName })
                .then(() => {
                    console.log('Chapter renamed successfully');
                    loadChapters(); // Reload chapters after renaming
                })
                .catch((error) => {
                    console.error('Error renaming chapter: ', error);
                });
        }
    }

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
