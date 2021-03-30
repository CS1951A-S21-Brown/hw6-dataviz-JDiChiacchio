function barChart(width, height, data) {
    data = getGenreBreakdown(data);
    const internal_width = width - margin.left - margin.right;
    const internal_height = height - margin.top - margin.bottom;


    var zoomer = d3.zoom()
        .scaleExtent([1, 8])
        .on("zoom", function () {
            let t = d3.event.transform;
            if (t.invertY(0) < 0) {
                t.y = t.invertY(0)
                //t.y = -y(y.domain()[0]);
            }
            if (t.invertY(internal_height) > internal_height) {
                t.y = t.invertY(internal_height) - internal_height * t.k
                //t.y = -y(y.domain()[y.domain().length - 1]) + internal_height * t.k;
            }
            // Rescale
            y.range([0, internal_height].map(d => t.applyY(d)));
            //update axis
            svg.selectAll(".y-axis").call(function (old_axis) {
                old_axis
                    .call(d3.axisLeft(y));
            });
            // Update points
            svg.selectAll(".bars rect")
                .attr("y", function (d) { return y(d.genre); })
                .attr("height", y.bandwidth());
            svg.selectAll(".x-labels text")
                .attr("y", function (d) { return y(d.genre) + y.bandwidth(); })

        })
    let svg = d3.select("#graph1")
        .append("svg")
        .attr('width', width)
        .attr('height', height)
        .call(zoomer)
        .append("g")
        .attr("class", "margin-shift")
        .attr('transform', `translate(${margin.left}, ${margin.top})`);


    // Linear scale for counts
    let x = d3.scaleLinear()
        .domain([0, d3.max(data, v => v.count)])
        .range([0, internal_width]);
    // Scale band for genre
    let y = d3.scaleBand()
        .domain(data.map(x => x.genre))
        .range([0, internal_height])
        .padding(0.1);
    // Color Scale for pretty
    let color = d3.scaleOrdinal()
        .domain(data.map(function (d) { return d["artist"] }))
        .range(d3.quantize(d3.interpolateHcl("#e63217", "#e65517"), data.length));

    // Genre labels
    svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y).tickSize(0).tickPadding(10));
    // Count labels
    let counts = svg.append("g")
        .attr("class", "x-labels")
        .selectAll("text").data(data);
    counts.enter()
        .append("text")
        .merge(counts)
        .attr("x", function (d) { return x(d.count) + 2.5; })
        .attr("y", function (d) { return y(d.genre) + y.bandwidth(); })
        .text(function (d) { return d.count; });

    // Bars
    let bars = svg.append("g")
        .attr("class", "bars")
        .selectAll("rect").data(data);
    bars.enter()
        .append("rect")
        .merge(bars)
        .attr("fill", function (d) { return color(d['genre']); })
        .attr("x", x(0) + 2.5)
        .attr("y", function (d) { return y(d.genre); })
        .attr("width", function (d) { return x(d.count); })
        .attr("height", y.bandwidth());

    d3.select("svg").call(zoomer.transform, d3.zoomIdentity.scale(5)); // initial zoom for clear presentation
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