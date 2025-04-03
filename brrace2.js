d3.csv('us_foreign_aid_complete.csv').then(data => {
    console.log("Raw CSV Data:", data);
    processData(data); // Process the loaded data
}).catch(error => {
    console.error("Error loading data:", error);
});

function cleanDate(dateString) {
    // Remove non-numeric characters and return a valid year or null if invalid
    const year = dateString.replace(/[^\d]/g, '');  // Removes any non-numeric characters
    return year.length === 4 ? parseInt(year, 10) : null;  // Returns the year as an integer if valid, or null if not
}

function processData(data) {
    if (!data || data.length === 0) {
        console.error("CSV file is empty or failed to load.");
        return;
    }
    
    console.log("Data loaded successfully:", data);

    // Clean the dates inside the processData function
    const cleanedData = data.map(d => {
        const cleanedDate = cleanDate(d['Fiscal Year']);
        return { ...d, cleanedDate }; // Add the cleaned date back to the record
    });

    console.log("Cleaned Data:", cleanedData);

    const parsedData = cleanedData.map(d => ({
        country: d['Country Name'] || 'Unknown Country',
        fiscalYear: isNaN(+d['Fiscal Year']) ? 0 : +d['Fiscal Year'],
        aidAmount: isNaN(+d['Constant Dollar Amount']) ? 0 : +d['Constant Dollar Amount']
    })).filter(d => d.country && !isNaN(d.fiscalYear));

    console.log("Parsed Data:", parsedData);

    const yearCountryAid = d3.rollup(
        parsedData.filter(d => d.aidAmount > 0),
        v => d3.sum(v, d => d.aidAmount),
        d => d.fiscalYear,
        d => d.country
    );

    const dateValues = Array.from(yearCountryAid, ([year, countries]) => [
        new Date(year, 0, 1), countries
    ]).sort(([a], [b]) => d3.ascending(a, b));

    console.log("Date values structured:", dateValues);

    startVisualization(dateValues);
}

function startVisualization(dateValues) {
    console.log("Starting visualization...");

    if (!document.getElementById('viz2')) {
        console.error("Element with ID 'viz2' not found. Ensure it exists in the HTML.");
        return;
    }

    const chartContainer = document.getElementById('viz2');

    const svg = d3.create("svg")
        .attr("viewBox", [0, 0, 800, 600])
        .attr("width", 800)
        .attr("height", 600)
        .attr("style", "max-width: 100%; height: auto;");

    chartContainer.appendChild(svg.node());

    const keyframes = dateValues.map(([date, countries]) => [
        date,
        Array.from(countries, ([name, value]) => ({ name, value }))
            .sort((a, b) => d3.descending(a.value, b.value))
            .map((d, i) => ({ ...d, rank: Math.min(12, i) }))
    ]);

    updateChart(svg, keyframes);
}

function updateChart(svg, keyframes) {
    keyframes.forEach(([date, data]) => {
        console.log("Updating chart for:", date, "Data:", data);
        if (!data || data.length === 0) {
            console.error("No data available for", date);
        }
        // Update logic for bars and labels...
    });
}