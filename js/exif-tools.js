// Load Exifr library dynamically if not already loaded by HTML script tag
// We assume the HTML includes: <script src="https://cdn.jsdelivr.net/npm/exifr@7.1.3/dist/full.umd.js"></script>

document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('exif-file');
    const resultsContainer = document.getElementById('exif-results');
    const loading = document.getElementById('exif-loading');
    const errorDiv = document.getElementById('exif-error');

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        loading.classList.remove('hidden');
        resultsContainer.classList.add('hidden');
        errorDiv.classList.add('hidden');
        resultsContainer.innerHTML = '';

        try {
            let output;

            if (file.type.startsWith('image/')) {
                output = await exifr.parse(file);
            } else if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
                // For video/audio, exifr might return limited data or require specific parsing
                // We fallback to basic metadata if exifr fails or returns null
                output = await exifr.parse(file); 
            } else {
                throw new Error('Unsupported file format.');
            }

            if (!output) {
                throw new Error('No metadata found in this file.');
            }

            renderExifData(output);
            loading.classList.add('hidden');
            resultsContainer.classList.remove('hidden');

        } catch (err) {
            loading.classList.add('hidden');
            errorDiv.textContent = err.message;
            errorDiv.classList.remove('hidden');
        }
        
        // Reset input so same file can be selected again
        fileInput.value = '';
    });
});

function renderExifData(data) {
    const container = document.getElementById('exif-results');
    
    // Define keys we care about for OSINT
    const priorityKeys = [
        'Make', 'Model', 'DateTimeOriginal', 'ModifyDate', 
        'GPSLatitude', 'GPSLongitude', 'GPSAltitude',
        'Software', 'Artist', 'Copyright', 'LensModel',
        'FNumber', 'ExposureTime', 'ISOSpeedRatings', 'FocalLength',
        'ImageWidth', 'ImageHeight', 'ResolutionUnit', 'XResolution', 'YResolution'
    ];

    let html = '';

    // Filter and sort data
    const sortedEntries = Object.entries(data).sort((a, b) => {
        // Prioritize known OSINT keys
        const aIndex = priorityKeys.indexOf(a[0]);
        const bIndex = priorityKeys.indexOf(b[0]);
        
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return a[0].localeCompare(b[0]);
    });

    sortedEntries.forEach(([key, value]) => {
        if (value === undefined || value === null) return;

        // Format GPS coordinates nicely
        let displayValue = value;
        if (key === 'GPSLatitude' || key === 'GPSLongitude') {
            displayValue = formatGPS(value);
        } else if (key === 'DateTimeOriginal' || key === 'ModifyDate') {
            displayValue = value; // Usually already formatted by exifr
        } else if (typeof value === 'object') {
            displayValue = JSON.stringify(value);
        }

        html += `<div class="exif-row">
                    <span class="exif-key">${formatKey(key)}</span>
                    <span class="exif-val">${escapeHtml(String(displayValue))}</span>
                 </div>`;
    });

    container.innerHTML = html;
}

function formatGPS(coordArray) {
    if (!coordArray || coordArray.length < 3) return '-';
    const d = coordArray[0];
    const m = coordArray[1];
    const s = coordArray[2];
    return `${d}° ${m}' ${s}"`;
}

function formatKey(key) {
    // Convert CamelCase to Title Case with spaces
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
