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
                const seasons = [];

                querySnapshot.forEach((doc) => {
                    const chapter = doc.data();
                    const index = doc.id;

                    // Agrupar capítulos por temporada
                    const seasonIndex = seasons.findIndex(season => season.id === chapter.season);
                    if (seasonIndex === -1) {
                        seasons.push({ id: chapter.season, chapters: [{ id: index, ...chapter }] });
                    } else {
                        seasons[seasonIndex].chapters.push({ id: index, ...chapter });
                    }
                });

                // Ordenar temporadas por su ID numérico
                seasons.sort((a, b) => a.id - b.id);

                displayChapters(seasons);
            })
            .catch((error) => {
                console.error('Error loading chapters: ', error);
            });
    }

    function displayChapters(seasons) {
        // Mostrar capítulos agrupados por temporadas
        seasons.forEach(season => {
            const seasonDiv = document.createElement('div');
            seasonDiv.className = 'season';
            seasonDiv.innerHTML = `<h3>Temporada ${season.id}</h3>`;

            season.chapters.forEach(chapter => {
                addTimeElement(seasonDiv, chapter);
            });

            calendar.appendChild(seasonDiv);
        });
    }

    function formatDate(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    }
    // Function to add chapter to Firestore
    function addChapter(timeUnit, timeValue, seasonNumber) {
        let displayDate = '';
        let chapterName = '';

        if (timeUnit === 'week') {
            const selectedDate = new Date(timeValue);
            const startOfWeek = new Date(selectedDate);
            startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
            const endOfWeek = new Date(selectedDate);
            endOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay() + 6);
            displayDate = `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`;
            chapterName = `${seasonNumber}-${formatDate(startOfWeek)}`;
        } else {
            const selectedDate = new Date(timeValue);
            displayDate = selectedDate.toLocaleDateString();
            chapterName = `${seasonNumber}-${formatDate(selectedDate)}`;
        }

        const chapterData = {
            name: chapterName,
            date: displayDate,
            season: seasonNumber,
            type: timeUnit
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
    function addTimeElement(container, chapter) {
        const timeDiv = document.createElement('div');
        timeDiv.className = chapter.type === 'week' ? 'week' : 'day';
        timeDiv.textContent = chapter.name;
        
        const dateDiv = document.createElement('div');
        dateDiv.textContent = chapter.date;
        
        const wrapperDiv = document.createElement('div');
        wrapperDiv.appendChild(timeDiv);
        wrapperDiv.appendChild(dateDiv);
        
        wrapperDiv.dataset.index = chapter.id;
        wrapperDiv.addEventListener('click', () => renameChapter(chapter.id));
        
        container.appendChild(wrapperDiv);
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
