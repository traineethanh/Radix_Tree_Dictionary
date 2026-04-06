
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const resultsEl = document.getElementById('results');

function getPartOfSpeechClass(pos) {
    const classes = {
        'noun': 'pos-noun',
        'verb': 'pos-verb',
        'adjective': 'pos-adjective',
        'adverb': 'pos-adverb',
        'pronoun': 'pos-pronoun',
        'preposition': 'pos-preposition',
        'conjunction': 'pos-conjunction',
        'interjection': 'pos-interjection'
    };
    return classes[pos.toLowerCase()] || 'pos-noun';
}

function playAudio(audioUrl) {
    const audio = new Audio(audioUrl);
    audio.play();
}

async function handleSearch(e) {
    e.preventDefault();
    const word = searchInput.value.trim();

    if (!word) return;

    loadingEl.classList.remove('hidden');
    errorEl.classList.add('hidden');
    resultsEl.classList.add('hidden');

    try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);

        if (!response.ok) {
            throw new Error('Word not found');
        }

        const data = await response.json();
        displayResults(data[0]);
    } catch (err) {
        errorEl.textContent = err.message || 'Failed to fetch word definition';
        errorEl.classList.remove('hidden');
    } finally {
        loadingEl.classList.add('hidden');
    }
}

function displayResults(wordData) {
    const audioPhonetic = wordData.phonetics?.find(p => p.audio);

    let html = '<div class="word-card">';
    html += '<div class="word-header">';
    html += '<div>';
    html += `<h2>${wordData.word}</h2>`;
    if (wordData.phonetic) {
        html += `<p class="phonetic">${wordData.phonetic}</p>`;
    }
    html += '</div>';

    if (audioPhonetic?.audio) {
        html += `<button class="audio-button" onclick="playAudio('${audioPhonetic.audio}')">`;
        html += '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">';
        html += '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>';
        html += '<path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>';
        html += '</svg>';
        html += '</button>';
    }

    html += '</div>';

    wordData.meanings.forEach(meaning => {
        html += '<div class="meaning-section">';
        html += `<div class="pos-badge ${getPartOfSpeechClass(meaning.partOfSpeech)}">${meaning.partOfSpeech}</div>`;

        meaning.definitions.forEach(def => {
            html += '<div class="definition">';
            html += `<p class="definition-text">${def.definition}</p>`;
            if (def.example) {
                html += `<span class="example">"${def.example}"</span>`;
            }
            html += '</div>';
        });

        if (meaning.synonyms && meaning.synonyms.length > 0) {
            html += '<div class="synonyms-section">';
            html += '<span class="synonyms-label">Similar:</span>';
            meaning.synonyms.slice(0, 5).forEach(syn => {
                html += `<button class="synonym-button" onclick="searchInput.value='${syn}'; searchForm.dispatchEvent(new Event('submit'))">${syn}</button>`;
            });
            html += '</div>';
        }

        html += '</div>';
    });

    html += '</div>';

    resultsEl.innerHTML = html;
    resultsEl.classList.remove('hidden');
}

searchForm.addEventListener('submit', handleSearch);