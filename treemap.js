// Add your JavaScript code here
const MAX_WIDTH = Math.max(1080, window.innerWidth);
const MAX_HEIGHT = 720;
const margin = { top: 40, right: 100, bottom: 40, left: 175 };

// Assumes the same graph width, height dimensions as the example dashboard. Feel free to change these if you'd like
let graph_1_width = MAX_WIDTH, graph_1_height = 720;
let graph_2_width = (MAX_WIDTH / 2) - 10, graph_2_height = 275;
let graph_3_width = MAX_WIDTH / 2, graph_3_height = 575;



// Graph 1
let svg = d3.select("#graph1")
    .append("svg")
    .attr('width', graph_1_width)
    .attr('height', graph_1_height)
    .call(d3.zoom().on("zoom", function () {
        svg.attr("transform", d3.event.transform);
    }))
    .append("g")
//.attr('transform', `translate(${margin.left}, ${margin.top})`);

d3.csv("data/netflix.csv").then(function (data) {
    root = d3.hierarchy(getGenreBreakdown(data, x => x.type == "Movie"))
        .sum(function (d) { return d.value; })
        .sort(function (a, b) { return b.value - a.value; });
    // Compute the numeric value for each entity

    // Then d3.treemap computes the position of each element of the hierarchy
    // The coordinates are added to the root object above
    var treemap = d3.treemap()
        .tile(d3.treemapBinary)
        .size([graph_1_width, graph_1_height - 5])
        .padding(5);
    root = treemap(root);


    console.log(root.leaves());
    // use this information to add rectangles:
    svg
        .selectAll("rect")
        .data(root.leaves())
        .enter()
        .append("rect")
        .attr('x', function (d) { return d.x0; })
        .attr('y', function (d) { return d.y0; })
        .attr('width', function (d) { return d.x1 - d.x0; })
        .attr('height', function (d) { return d.y1 - d.y0; })
        .style("stroke", "black")
        .style("fill", "red");

    // and to add the text labels
    svg
        .selectAll("text")
        .data(root.leaves())
        .enter()
        .append("text")
        .attr("x", function (d) { return (d.x0 + d.x1) / 2 })
        .attr("y", function (d) { return (d.y0 + d.y1) / 2 })
        .attr("dx", function (d) { return `${-0.75 * (d.x1 - d.x0) / 2}px`; })
        .attr("dy", function (d) { return `${0.25 * (d.y1 - d.y0) / 2}px`; })
        .text(function (d) { return `${d.data.name}: \n${d.data.value}` })
        .attr("font-size", function (d) { return `${(d.y1 - d.y0) / 4}px`; })
        .attr("lengthAdjust", "spacingAndGlyphs")
        .attr("textLength", function (d) { return `${3 * (d.x1 - d.x0) / 4}px`; })
        .attr("fill", "white")
        .attr("font-weight", "bold");
});

function getGenreBreakdown(data, filt) {
    if (!(filt === undefined)) {
        data = data.filter(filt);
    }
    let allGenreListings = data.flatMap(x => x.listed_in.split(",").map(str => str.trim()));
    let keys = Array.from(new Set(allGenreListings));
    genre_counts = keys.map(function (genre) {
        return { "name": genre, "value": allGenreListings.filter(x => x == genre).length };
    });
    genre_counts.sort((x, y) => x.value < y.value);
    console.log(genre_counts)
    return { name: "root", "children": genre_counts };
}