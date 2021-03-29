// Add your JavaScript code here
const MAX_WIDTH = Math.max(1080, window.innerWidth);
const MAX_HEIGHT = 720;
const margin = { top: 40, right: 100, bottom: 40, left: 175 };

// Assumes the same graph width, height dimensions as the example dashboard. Feel free to change these if you'd like
let graph_1_width = MAX_WIDTH, graph_1_height = 720;
let graph_2_width = (MAX_WIDTH / 2) - 10, graph_2_height = 275;
let graph_3_width = MAX_WIDTH / 2, graph_3_height = 575;



// Graph 1
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

let svg = d3.select("#graph1")
    .append("svg")
    .attr('width', graph_1_width)
    .attr('height', graph_1_height)
    .call(d3.zoom().on("zoom", function () {
        svg.attr("transform", d3.event.transform);
    }))
    .append("g")
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

d3.csv("data/netflix.csv").then(function (data) {
    data = getActorNetwork(data, x => x.type == "TV Show");
    console.log(d3.max(data.links, v => v.weight));

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
        .attr("r", 5)
        .style("fill", "#1019c4")
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave)
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    // Let's list the force we wanna apply on the network
    var simulation = d3.forceSimulation(data.nodes)                 // Force algorithm is applied to data.nodes
        .force("link", d3.forceLink()                               // This force provides links between nodes
            .id(function (d) { return d.id; })                     // This provide  the id of a node
            .links(data.links)                                    // and this the list of links
        )
        .force("charge", d3.forceManyBody().strength(-150))         // This adds repulsion between nodes. Play with the -400 for the repulsion strength
        .force("center", d3.forceCenter(graph_1_width / 2, graph_1_height / 2))     // This force attracts nodes to the center of the svg area
        .on("tick", ticked);

    function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    // This function is run at each iteration of the force algorithm, updating the nodes position.
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




    // A function that change this tooltip when the user hover a point.
    // Its opacity is set to 1: we can now see it. Plus it set the text and position of tooltip depending on the datapoint (d)
    function mouseover(d) {
        tooltip
            .style("opacity", 1)
            .html(`Big Boi: ${d.name}`)
    }
    function mousemove(d) {
        var bodyRect = document.body.getBoundingClientRect(),
            elemRect = this.getBoundingClientRect(),
            offsety = elemRect.top - bodyRect.top,
            offsetx = elemRect.left - bodyRect.left;
        console.log(offsetx, offsety);
        tooltip
            .style("top", `${offsety}px`)
            .style("left", `${offsetx}px`);
    }
    // A function that change this tooltip when the leaves a point: just need to set opacity to 0 again
    function mouseleave(d) {
        tooltip
            .transition()
            .duration(200)
            .style("opacity", 0)
    }
});

function getActorNetwork(data, filt) {
    if (!(filt === undefined)) {
        data = data.filter(filt);
    }
    let nodes = []
    let links = []
    id_map = getTopActors(data, 100)
    for (n = 0; n < id_map.length; n++) {
        nodes.push({ "name": id_map[n], "id": n });
    }
    console.log(id_map);
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
}


function getTopActors(data, keepcount) {
    let actorsall = data.flatMap(x => x["cast"].split(",").map(str => str.trim()));
    let keys = Array.from(new Set(actorsall));
    actor_counts = keys.map(function (actor) {
        return { "actor": actor, "count": actorsall.filter(x => x == actor && x != "").length };
    });
    // sort and truncate
    actor_counts.sort((x, y) => x.count < y.count);
    actor_counts.length = Math.min(data.length, keepcount);
    return actor_counts.map(x => x.actor);
}