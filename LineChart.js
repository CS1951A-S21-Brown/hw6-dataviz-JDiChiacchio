function LineChart(width, height, data) {
    data = getAvgReleaseDates(data, x => x["type"] == "Movie");
    const margin = { top: 40, right: 40, bottom: 40, left: 75 };
    const internal_width = width - margin.left - margin.right;
    const internal_height = height - margin.top - margin.bottom;

    // Zoom function (evil)
    var zoomer = d3.zoom()
        .scaleExtent([1, 8])
        .on("zoom", function () {
            let t = d3.event.transform;
            if (t.invertX(0) < 0) {
                t.x = 0;
            }
            if (t.invertX(internal_width) > internal_width) {
                t.x = x(x.domain()[1]) - internal_width * t.k
            }
            // Rescale
            x.range([0, internal_width].map(d => t.applyX(d)));
            //update axis
            svg.selectAll(".x-axis").call(function (old_axis) {
                old_axis
                    .attr("transform", `translate(0, ${height - margin.top - margin.bottom})`)
                    .call(d3.axisBottom(x).ticks(d3.timeYear.every(5)).tickSizeInner(1));
            });
            // Update points
            svg.selectAll(".points circle")
                .attr("cx", d => x(d["date"]));

        })

    let svg = d3.select("#graph2")
        .append("svg")
        .attr('width', width)
        .attr('height', height)
        .call(zoomer)
        .append("g")
        .attr("class", "margin-shift")
        .attr('transform', `translate(${margin.left}, ${margin.top})`);


    // Mask for zoom overflow
    d3.selectAll("svg")
        .append("defs")
        .append("clipPath")
        .attr("id", "cut_margin")
        .append("rect")
        .attr("x", -5) // Small offset to make clipping less visible
        .attr("y", -5)
        .attr("width", internal_width + 50) // Small offset to make clipping less visible
        .attr("height", internal_height);


    // Time scale for year
    var x = d3.scaleTime()
        .domain(d3.extent(data, function (d) { return d.date; }))
        .range([0, internal_width]);
    // Linear scale for avg duration
    let y = d3.scaleLinear()
        .domain([0, d3.max(data, val => val["avg_dur"])])
        .range([internal_height, 0]);

    // labels
    svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y).tickSize(5).tickPadding(10));
    svg.append("g")
        .attr("class", "x-axis")
        .attr("clip-path", "url(#cut_margin)")
        .attr("transform", `translate(0, ${internal_height})`)
        .call(d3.axisBottom(x).ticks(d3.timeYear.every(5)));

    // Points
    svg
        .append("g")
        .attr("class", "points")
        .attr("clip-path", "url(#cut_margin)")
        .selectAll("dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", function (d) { return x(d.date) })
        .attr("cy", function (d) { return y(d["avg_dur"]) })
        .attr("r", 5)
        .attr("fill", "#69b3a2")

    d3.select("#graph2 > svg").append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", margin.left / 2 - 20)
        .attr("x", -(height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Runtime (min)");
    d3.select("#graph2 > svg").append("text")
        .attr("x", width / 2)
        .attr("y", height - (margin.bottom / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Release Year");
}

function getAvgReleaseDates(data, filt) {
    if (!(filt === undefined)) {
        data = data.filter(filt);
    }
    let result = data.reduce(function (acc, cur) {
        let date = parseInt(cur["release_year"], 10);
        let duration = parseInt(cur["duration"], 10);
        let ind = acc.findIndex(x => x.date == date);
        if (ind == -1) {
            acc.push({ "date": date, "avg_dur": [duration] })
        }
        else {
            acc[ind]["avg_dur"].push(duration);
        }
        return acc;
    }, []);
    result.forEach(function (x) {
        x["date"] = d3.timeParse("%Y")(x["date"]);
        x["avg_dur"] = d3.mean(x["avg_dur"])
    });
    return result;
}