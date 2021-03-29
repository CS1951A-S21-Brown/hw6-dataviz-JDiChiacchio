function barChart(width, height, data) {

    let svg = d3.select("#graph1")
        .style('max-height', `${graph_1_height}px`)
        .append("svg")
        .attr('width', graph_1_width)
        .attr('height', 3 * graph_1_height)
        .attr('transform', "scale(-1,1)")
        .append("g")
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

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
    let bars = svg.append("g")
        .attr("class", "bars")
        .selectAll("rect").data(data);
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

}

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
    return genre_counts;
}