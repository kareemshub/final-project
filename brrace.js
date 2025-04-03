const width = 800;
const height = 600;
const n = 12; // Top N countries to display

async function loadData() {
    try {
        d3.csv('us_foreign_aid_complete.csv').then(data => {
            console.log(data); // Check if data is loading correctly
            processData(data); // Call function to process the data
        }).catch(error => {
            console.error("Error loading data:", error);
        });
        
        // Parse and clean the data
        const parsedData = data.map(d => {
            let aidAmount = +d['Constant Dollar Amount'] || +d['Current Dollar Amount'] || 0;
            if (isNaN(aidAmount)) aidAmount = 0;

            let fiscalYear = +d['Fiscal Year'];
            if (isNaN(fiscalYear)) {
                console.warn('Missing fiscal year for:', d['Country Name']);
                fiscalYear = 0;
            }

            return {
                country: d['Country Name'] || 'Unknown Country',
                fiscalYear: fiscalYear,
                aidAmount: aidAmount
            };
        }).filter(d => d.country && !isNaN(d.fiscalYear));

        const yearCountryAid = d3.rollup(
            parsedData.filter(d => d.aidAmount > 0), 
            v => d3.sum(v, d => d.aidAmount),
            d => d.fiscalYear,
            d => d.country
        );

        // Prepare data for visualization
        const dateValues = Array.from(yearCountryAid, ([year, countries]) => {
            return [new Date(year, 0, 1), countries];
        }).sort(([a], [b]) => d3.ascending(a, b));

        // Generate keyframes for animation
        const keyframes = createKeyframes(dateValues, rank);

        // Start the visualization
        updateChart(keyframes);

    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Rank function
function rank(value) {
    const data = Array.from(value, ([name, value]) => ({ name, value }));
    data.sort((a, b) => d3.descending(a.value, b.value));
    for (let i = 0; i < data.length; ++i) data[i].rank = Math.min(n, i);
    return data;
}

// Create keyframes function
function createKeyframes(dateValues, rank) {
    const keyframes = [];
    let previousData = null;

    for (let [date, countries] of dateValues) {
        const ranked = rank(countries);
        if (previousData) {
            keyframes.push([date, ranked]);
        }
        previousData = ranked;
    }
    return keyframes;
}

// Function to update the chart
async function updateChart(keyframes) {
    // Your visualization update logic here...
}

// 🚀 Call loadData to start the process
loadData();