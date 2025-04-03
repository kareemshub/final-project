
import * as d3 from 'd3';
import {csv} from 'd3-fetch';

const width = 800;
const height = 600;
const n = 12; // Top N countries to display

// Load the data from CSV (use the path to your local file or URL)
const data = await csv('us_foreign_aid_complete.csv');

// Parse and clean the data with NaN handling
const parsedData = data.map(d => {
    // Handle missing/NaN values for aidAmount
    let aidAmount = +d['Constant Dollar Amount'] || +d['Current Dollar Amount'] || 0;
    
    // Handle cases where conversion fails (NaN)
    if (isNaN(aidAmount)) aidAmount = 0;
    
    // Handle missing fiscal year
    let fiscalYear = +d['Fiscal Year'];
    if (isNaN(fiscalYear)) {
      console.warn('Missing fiscal year for:', d['Country Name']);
      fiscalYear = 0; // or use a default year
    }
    
    return {
      country: d['Country Name'] || 'Unknown Country',
      fiscalYear: fiscalYear,
      aidAmount: aidAmount
    };
  }).filter(d => {
    // Optional: filter out completely invalid entries
    return d.country && !isNaN(d.fiscalYear);
  });
  
  // Then in your rollup, add additional validation
  const yearCountryAid = d3.rollup(
    parsedData.filter(d => d.aidAmount > 0), // Only include positive amounts
    v => d3.sum(v, d => d.aidAmount),
    d => d.fiscalYear,
    d => d.country
  );

// Prepare data for the bar chart race
const dateValues = Array.from(yearCountryAid, ([year, countries]) => {
  return [new Date(year, 0, 1), countries];
}).sort(([a], [b]) => d3.ascending(a, b));

// Rank countries by aid received each year
function rank(value) {
  const data = Array.from(value, ([name, value]) => ({name, value}));
  data.sort((a, b) => d3.descending(a.value, b.value));
  for (let i = 0; i < data.length; ++i) data[i].rank = Math.min(n, i);
  return data;
}

// Create the SVG container
const chartContainer = document.getElementById('viz2');

const svg = d3.create('svg')
  .attr('viewBox', [0, 0, width, height])
  .attr('width', width)
  .attr('height', height)
  .attr('style', 'max-width: 100%; height: auto;');

// Set up the X and Y scales
const x = d3.scaleLinear([0, 1], [0, width - 50]);
const y = d3.scaleBand()
  .domain(d3.range(n + 1))
  .rangeRound([50, height - 50])
  .padding(0.1);

// Set up colors based on countries (could use a color scale for better differentiation)
const color = d3.scaleOrdinal(d3.schemeCategory10);

// Prepare axis and labels
const axis = svg.append("g")
  .attr("transform", `translate(0, ${height - 50})`)
  .call(d3.axisTop(x).ticks(5));

const bars = svg.append("g")
  .attr("fill-opacity", 0.6)
  .selectAll("rect");

const labels = svg.append("g")
  .style("font", "bold 12px sans-serif")
  .style("font-variant-numeric", "tabular-nums")
  .attr("text-anchor", "end")
  .selectAll("text");

chartContainer.appendChild(svg.node());  

// Set up the transition
const duration = 250;

// Function to update the chart for each frame
async function updateChart(keyframes) {
  for (const [date, data] of keyframes) {
    const transition = svg.transition().duration(duration).ease(d3.easeLinear);
    
    // Update axis
    x.domain([0, data[0].value]);

    axis.transition(transition).call(d3.axisTop(x).ticks(5));

    // Update bars
    bars.data(data.slice(0, n), d => d.name)
      .join(
        enter => enter.append("rect")
          .attr("fill", d => color(d.name))
          .attr("height", y.bandwidth())
          .attr("x", x(0))
          .attr("y", d => y(d.rank))
          .attr("width", d => x(d.value)),
        update => update,
        exit => exit.transition(transition).remove()
          .attr("y", d => y(d.rank))
          .attr("width", d => x(d.value))
      )
      .transition(transition)
      .attr("y", d => y(d.rank))
      .attr("width", d => x(d.value));

    // Update labels
    labels.data(data.slice(0, n), d => d.name)
      .join(
        enter => enter.append("text")
          .attr("x", -6)
          .attr("y", d => y(d.rank) + y.bandwidth() / 2)
          .attr("dy", "-0.25em")
          .text(d => d.name),
        update => update,
        exit => exit.transition(transition).remove()
      )
      .transition(transition)
      .attr("x", -6)
      .attr("y", d => y(d.rank) + y.bandwidth() / 2);
  }
}

// Create keyframes for animation
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

// Generate the keyframes for the bar chart race
const keyframes = createKeyframes(dateValues, rank);

// Start the animation
updateChart(keyframes);