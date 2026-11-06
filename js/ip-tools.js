async function fetchIPData() {
    const input = document.getElementById('ip-input').value.trim();
    const loading = document.getElementById('ip-loading');
    const results = document.getElementById('ip-results');
    const errorDiv = document.getElementById('ip-error');
    
    // Reset UI
    loading.classList.remove('hidden');
    results.classList.add('hidden');
    errorDiv.classList.add('hidden');
    errorDiv.textContent = '';

    try {
        // Use ipapi.co for base data (free tier is sufficient for this)
        const url = input ? `https://ipapi.co/${input}/json/` : 'https://ipapi.co/json/';
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch IP data');
        
        const data = await response.json();
        
        if (data.error) throw new Error(data.reason || 'Invalid IP address');

        // Populate Data
        document.getElementById('res-ip').textContent = data.ip || 'N/A';
        document.getElementById('res-hostname').textContent = data.hostname || 'N/A';
        document.getElementById('res-isp').textContent = data.isp || data.org || 'N/A';
        document.getElementById('res-org').textContent = data.org || 'N/A';
        document.getElementById('res-asn').textContent = data.asn ? `AS${data.asn.replace(/^AS/, '')}` : 'N/A';

        document.getElementById('res-city').textContent = data.city || 'N/A';
        document.getElementById('res-region').textContent = data.region || 'N/A';
        document.getElementById('res-country').textContent = `${data.country_name} (${data.country_code})`;
        document.getElementById('res-zip').textContent = data.postal || 'N/A';
        document.getElementById('res-coords').textContent = `${data.latitude}, ${data.longitude}`;

        // Timezone Logic
        const tz = data.timezone;
        document.getElementById('res-timezone').textContent = tz || 'N/A';
        document.getElementById('res-offset').textContent = data.utc_offset || 'N/A';

        // Calculate Local Time dynamically based on timezone offset
        const now = new Date();
        const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
        const targetDate = new Date(utcMs + (parseFloat(data.longitude || 0) * 3600000 / 360)); 
        // Note: Longitude-based time is approximate but usually matches the API's local time display better than just offset string
        
        document.getElementById('res-localtime').textContent = targetDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

        // Map Link
        const mapLink = document.getElementById('map-link');
        if(data.latitude && data.longitude) {
            mapLink.href = `https://www.google.com/maps?q=${data.latitude},${data.longitude}`;
            mapLink.style.display = 'inline-block';
        } else {
            mapLink.style.display = 'none';
        }

        loading.classList.add('hidden');
        results.classList.remove('hidden');

    } catch (err) {
        loading.classList.add('hidden');
        errorDiv.textContent = err.message;
        errorDiv.classList.remove('hidden');
    }
}
