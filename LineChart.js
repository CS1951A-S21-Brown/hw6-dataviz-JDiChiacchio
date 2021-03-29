function LineChart(width, height, data) {
    const internal_width = width - margin.left - margin.right;
    const internal_height = height - margin.top - margin.bottom;

    // Zoom functon
    var zoomer = d3.zoom()
        .scaleExtent([1, 8])
        //.extent([[0, 0], [internal_width, internal_height]])
        .on("zoom", function () {
            let old_range = [0, internal_width];
            let new_range = old_range.map(d => d3.event.transform.applyX(d));
            if (old_range[0] >= new_range[0] && old_range[1] <= new_range[1]) {

                // Rescale
                x.range(new_range);
                //update axis
                svg.selectAll(".x-axis").call(function (old_axis) {
                    old_axis
                        .attr("transform", `translate(0, ${height - margin.top - margin.bottom})`)
                        .call(d3.axisBottom(x).ticks(d3.timeYear.every(5)));
                });
                // Update points
                svg.selectAll(".points circle")
                    .attr("cx", d => x(d["date"]));
            }
            else {
                svg.call(zoomer.transform, d3.zoomIdentity.translate(0, 0).scale(1));
            }
            console.log(old_range);
            console.log(new_range);
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
        .attr("x", -2.5) // Small offset to make clipping less visible
        .attr("y", 0)
        .attr("width", internal_width + 2.5) // Small offset to make clipping less visible
        .attr("height", internal_height);

    data = getAvgReleaseDates(data, x => x["type"] == "Movie");
    // Linear scale for counts
    var x = d3.scaleTime()
        .domain(d3.extent(data, function (d) { return d.date; }))
        .range([0, internal_width]);
    // Scale band for genre
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
        .attr("transform", `translate(0, ${height - margin.top - margin.bottom})`)
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