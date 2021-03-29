const MAX_WIDTH = Math.max(1080, window.innerWidth);
const MAX_HEIGHT = 720;
const margin = { top: 40, right: 100, bottom: 40, left: 175 };

// Assumes the same graph width, height dimensions as the example dashboard. Feel free to change these if you'd like
let graph_1_width = (MAX_WIDTH / 2) - 10, graph_1_height = 250;
let graph_2_width = (MAX_WIDTH / 2) - 10, graph_2_height = 275;
let graph_3_width = MAX_WIDTH / 2, graph_3_height = 575;



// Graph 1
let svg = d3.select("#graph1")
    .style('max-height', `${graph_1_height}px`)
    .append("svg")
    .attr('width', graph_1_width)
    .attr('height', 3 * graph_1_height)
    .attr('transform', "scale(-1,1)")
    .append("g")
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

d3.csv("data/netflix.csv").then(function (data) {
    data = getGenreBreakdown(data, x => x["type"] == "TV Show");
    // Linear scale for counts
    let x = d3.scaleLinear()
        .domain([0, d3.max(data, v => v.count)])
        .range([0, graph_1_width - margin.left - margin.right]);
    // Scale band for genre
    let y = d3.scaleBand()
        .domain(data.map(x => x.genre))
        .range([0, 3 * graph_1_height - margin.top - margin.bottom])
        .padding(0.1);

    // Genre labels
    svg.append("g")
        .call(d3.axisLeft(y).tickSize(0).tickPadding(10));
    // Count labels
    let counts = svg.append("g").selectAll("text").data(data);
    counts.enter()
        .append("text")
        .merge(counts)
        .attr("x", function (d) { return x(d.count); })
        .attr("y", function (d) { return y(d.genre) + y.bandwidth(); })
        .text(function (d) { return d.count; });

    // Bars
    let bars = svg.append("g").selectAll("rect").data(data);
    // Define color scale
    let color = d3.scaleOrdinal()
        .domain(data.map(function (d) { return d["artist"] }))
        .range(d3.quantize(d3.interpolateHcl("#66a0e2", "#81c2c3"), data.length));

    bars.enter()
        .append("rect")
        .merge(bars)
        .attr("fill", function (d) { return color(d['genre']); })
        .attr("x", x(0))
        .attr("y", function (d) { return y(d.genre); })
        .attr("width", function (d) { return x(d.count); })
        .attr("height", y.bandwidth());

});

function getGenreBreakdown(data, filt) {
    if (!(filt === undefined)) {
        data = data.filter(filt);
    }
    let allGenreListings = data.flatMap(x => x.listed_in.split(",").map(str => str.trim()));
    let keys = Array.from(new Set(allGenreListings));
    genre_counts = keys.map(function (genre) {
        return { "genre": genre, "count": allGenreListings.filter(x => x == genre).length };
    });
    genre_counts.sort((x, y) => x.count < y.count);
    console.log(genre_counts)
    return genre_counts;
}