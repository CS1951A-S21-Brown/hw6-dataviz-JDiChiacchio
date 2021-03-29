// Add your JavaScript code here
function actornetwork(width, height, data) {

    var tooltip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "1px")
        .style("border-radius", "5px")
        .style("pointer-events", "none")
        .style("padding", "10px");

    let svg = d3.select("#graph3")
        .append("svg")
        .attr('width', width)
        .attr('height', height)
        .call(d3.zoom().on("zoom", function () {
            svg.attr("transform", d3.event.transform);
        }))
        .append("g")
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    data = getActorNetwork(data, x => x.type == "Movie");

    let weightScale = d3.scaleLinear()
        .domain([0, d3.max(data.links, v => v.weight)])
        .range([0.5, 5]);

    /* let weightScale = d3.scaleLinear()
        .domain([0, d3.max(data.links, v => v.weight)])
        .range(d3.quantize(d3.interpolateHcl("#8a3636", "#ff0000"), d3.max(data.links, v => v.weight))); */


    var link = svg
        .selectAll("line")
        .data(data.links)
        .enter()
        .append("line")
        .style("stroke", "#3db6d4")
        .style("stroke-width", edge => weightScale(edge.weight));

    // Initialize the nodes
    var node = svg
        .selectAll("circle")
        .data(data.nodes)
        .enter()
        .append("circle")
        .attr("r", 10)
        .style("fill", "#1019c4")
        .on("mouseover", mouseover)
        //.on("mousemove", mousemove)
        .on("mouseleave", mouseleave)
        .call(d3.drag()
            .on("start", function (d) {
                if (!d3.event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            })
            .on("drag", function (d) {
                d.fx = d3.event.x;
                d.fy = d3.event.y;
            })
            .on("end", function (d) {
                if (!d3.event.active) simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            }));


    var simulation = d3.forceSimulation(data.nodes)
        .force("link", d3.forceLink()
            .id(function (d) { return d.id; })
            .links(data.links)
        )
        .force("charge", d3.forceManyBody().strength(-350))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .on("tick", ticked);


    function ticked() {
        link
            .attr("x1", function (d) { return d.source.x; })
            .attr("y1", function (d) { return d.source.y; })
            .attr("x2", function (d) { return d.target.x; })
            .attr("y2", function (d) { return d.target.y; });

        node
            .attr("cx", function (d) { return d.x; })
            .attr("cy", function (d) { return d.y; });
    }


    function mouseover(d) {
        var bodyRect = document.body.getBoundingClientRect(),
            elemRect = this.getBoundingClientRect(),
            offsety = elemRect.top - bodyRect.top,
            offsetx = elemRect.left - bodyRect.left;
        tooltip
            .style("opacity", 1)
            .html(`Actor: ${d.name}`)
            .style("top", `${offsety + 30}px`)
            .style("left", `${offsetx + 5}px`);
    }
    /*     function mousemove(d) {
            var bodyRect = document.body.getBoundingClientRect(),
                elemRect = this.getBoundingClientRect(),
                offsety = elemRect.top - bodyRect.top,
                offsetx = elemRect.left - bodyRect.left;
            tooltip
                .style("top", `${offsety - 5}px`)
                .style("left", `${offsetx + 5}px`);
        } */
    function mouseleave(d) {
        tooltip
            .transition()
            .duration(200)
            .style("opacity", 0);
    }
};



function getActorNetwork(data, filt) {
    if (!(filt === undefined)) {
        data = data.filter(filt);
    }
    let nodes = []
    let links = []
    id_map = getTopActors(data, 100, 300)
    for (n = 0; n < id_map.length; n++) {
        nodes.push({ "name": id_map[n], "id": n });
    }
    for (let row of data) {
        let cast = row.cast.split(",").map(str => str.trim());
        // Map cast to ids and add new nodes to node list
        cast = cast.map(a => id_map.indexOf(a)).filter(a => a != -1);
        // Iterate over cast to get all actor pairs
        var i, j
        for (i = 0; i < cast.length; i++) {
            for (j = 0; j < i; j++) {
                // Add uniques pairs to links, maintain pair occurance counts as weights
                let place = links.findIndex(val =>
                    (val.source == cast[i] && val.target == cast[j]) ||
                    (val.source == cast[j] && val.target == cast[i]));
                if (place == -1) {
                    links.push({ "source": cast[i], "target": cast[j], "weight": 1 });
                }
                else {
                    links[place]["weight"] += 1;
                }
            }
        }

    };
    return { "nodes": nodes, "links": links };
};


function getTopActors(data, cutstart, cutend) {
    let actorsall = data.flatMap(x => x["cast"].split(",").map(str => str.trim()));
    let keys = Array.from(new Set(actorsall));
    actor_counts = keys.map(function (actor) {
        return { "actor": actor, "count": actorsall.filter(x => x == actor && x != "").length };
    });
    // sort and truncate
    actor_counts.sort((x, y) => x.count < y.count);
    return actor_counts.map(x => x.actor).slice(cutstart, cutend);
};
