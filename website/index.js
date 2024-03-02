function defaultErrHandler(btn) {
    function handler(err) {
        unsetLoader();
        displayError(err.responseText);
        if (btn) {
            btn.removeAttribute("disabled");
        }
    }
    return handler;
}
function randomBusinessName() {
    var adjectives = ["Easy", "Budget", "Trusty", "Speedy", "Enigmatic", "Fly", "Golden", "Sturdy", "Graceful", "Rapid", "Robust", "American", "British", "Asian", "European", "Indian", "Italian", "Australian", "Chinese", "Russian", "Nordic", "Southern", "Northern", "Southwest", "Paper", "Malaysian", "Thai", "Smile", ""];
    var nouns = ["Airways", "Skies", "Air", "Airlines", "Flyers", "Jets", "Pilots", "Air Transport", "Helicopters", "Cargo", "Regional", "Express"];
    var name = "".concat(randomChoice(adjectives), " ").concat(randomChoice(nouns));
    if (Math.random() < 0.3) {
        var name = randomChoice(adjectives) + ' ' + name;
    }
    return name;
}
function prettyCashString(cash) {
    return "$" + cash.toLocaleString("en-gb", { maximumFractionDigits: 0, currency: "usd" });
}
function randomChoice(things) {
    return things[Math.floor(Math.random() * things.length)];
}
function displayInfo(message) {
    var div = document.getElementById("info");
    var span = document.createElement("span");
    span.classList.add("fade-in");
    span.innerHTML = message;
    setTimeout(function () {
        span.classList.add("fade-out");
        setTimeout(function () {
            span.remove();
        }, 1000);
    }, 5000);
    div.appendChild(span);
}
function displayError(message) {
    var div = document.getElementById("error");
    var span = document.createElement("span");
    span.classList.add("fade-in");
    span.innerHTML = message;
    setTimeout(function () {
        span.classList.add("fade-out");
        setTimeout(function () {
            span.remove();
        }, 1000);
    }, 5000);
    div.appendChild(span);
}
function dataLabels(rows) {
    var elem = document.createElement("dl");
    rows.forEach(function (r) {
        var dt = document.createElement("dt");
        dt.innerHTML = r[0];
        var dd = document.createElement("dd");
        dd.innerHTML = r[1];
        elem.appendChild(dt);
        elem.appendChild(dd);
    });
    return elem;
}
function listLabels(rows) {
    var elem = document.createElement("ul");
    rows.forEach(function (r) {
        var li = document.createElement("li");
        li.innerHTML = "<strong>".concat(r[0], ":</strong>").concat(r[1]);
        elem.appendChild(li);
    });
    return elem;
}
function createElement(elementType, options) {
    var e = document.createElement(elementType);
    if (options.id) {
        e.setAttribute("id", options.id);
    }
    if (options.class) {
        e.setAttribute("class", options.class);
    }
    if (options.innerText) {
        e.innerText = options.innerText;
    }
    if (options.innerHTML) {
        e.innerHTML = options.innerHTML;
    }
    return e;
}
function createTitle(innerHTML, elementType) {
    if (elementType === void 0) { elementType = "h1"; }
    return createElement(elementType, { innerHTML: innerHTML });
}
function createParagraph(text) {
    var p = document.createElement("p");
    p.innerText = text;
    return p;
}
function hideElement(elem) {
    elem.style.display = 'none';
}
var inflight = 0;
function setLoader() {
    inflight += 1;
    $("#loader").show();
}
function unsetLoader() {
    $("#loader").hide();
    inflight -= 1;
    if (inflight === 0) {
        $("#loader").hide();
    }
}
function makeClickable(btn, onClick) {
    function listener(ev) {
        btn.setAttribute("disabled", "");
        btn.innerHTML = "...";
        onClick(ev);
        return this;
    }
    btn.addEventListener("click", listener);
}
function addPolylineToMap(map, startinglat, startinglon, endinglat, endinglon) {
    var lineString = new H.geo.LineString();
    lineString.pushPoint({ lat: startinglat, lng: startinglon });
    lineString.pushPoint({ lat: endinglat, lng: endinglon });
    map.addObject(new H.map.Polyline(lineString, { style: { lineWidth: 4 } }));
}
var RequestClient = (function () {
    function RequestClient(engine) {
        this.engine = engine;
    }
    RequestClient.prototype.purchaseRoute = function (airline_id, route_id, onSuccess, onError) {
        console.log('PR ajaxing', onSuccess);
        $.ajax({
            method: "POST",
            url: "/purchase_route",
            data: {
                airline_id: airline_id,
                route_id: route_id,
            },
            success: onSuccess,
            error: onError,
        });
    };
    RequestClient.prototype.purchasePlane = function (airline_id, plane_id, onSuccess, onError) {
        $.ajax({
            method: "POST",
            url: "purchase_plane",
            data: {
                airline_id: airline_id,
                plane_id: plane_id,
            },
            success: onSuccess,
            error: onError,
        });
    };
    RequestClient.prototype.fixPlane = function (airline_id, plane_id, onSuccess, onError) {
        $.ajax({
            method: "POST",
            url: "/plane/fix",
            data: {
                airline_id: airline_id,
                plane_id: plane_id,
            },
            success: onSuccess,
            error: onError,
        });
    };
    RequestClient.prototype.scrapPlane = function (airline_id, plane_id, onSuccess, onError) {
        $.ajax({
            method: "POST",
            url: "/plane/scrap",
            data: {
                airline_id: airline_id,
                plane_id: plane_id,
            },
            success: onSuccess,
            error: onError,
        });
    };
    RequestClient.prototype.upgradeFuelEfficiency = function (airline_id, from_level) {
        var engine = this.engine;
        $.ajax({
            method: "POST",
            url: "/upgrade_fuel_efficiency",
            data: {
                airline_id: airline_id,
                from_level: from_level,
            },
            success: function (response) {
                engine.displayUpgradesTab();
            },
            error: defaultErrHandler(),
        });
    };
    return RequestClient;
}());
var Airport = (function () {
    function Airport(data) {
        var code = data.code, name = data.name, country = data.country, lat = data.lat, lon = data.lon, popularity = data.popularity;
        this.code = code;
        this.name = name;
        this.country = country;
        this.lat = lat;
        this.lon = lon;
        this.popularity = popularity;
    }
    return Airport;
}());
var OfferedRoute = (function () {
    function OfferedRoute(data) {
        var id = data.id, distance = data.distance, origin = data.origin, destination = data.destination, popularity = data.popularity, cost = data.cost;
        this.id = id;
        this.distance = distance;
        this.fromAirport = origin;
        this.toAirport = destination;
        this.popularity = popularity;
        this.purchaseCost = cost;
    }
    OfferedRoute.prototype.trHtml = function () {
        var tr = createElement("tr", { class: "bg-offered" });
        tr.appendChild(createElement("td", { innerHTML: "".concat(this.fromAirport.code, " <-> ").concat(this.toAirport.code) }));
        tr.appendChild(createElement("td", { innerHTML: "".concat(this.distance.toLocaleString("en-gb", { maximumFractionDigits: 0 }), "km") }));
        tr.appendChild(createElement("td", { innerHTML: this.popularity.toLocaleString("en-gb") }));
        tr.appendChild(createElement("td", { innerHTML: this.purchaseCost.toLocaleString("en-gb") }));
        tr.appendChild(createElement("td", {}));
        var btn = createElement("button", { innerText: "Purchase" });
        var btnCell = document.createElement("td");
        var route_id = this.id;
        var onSuccess = function (response) {
            var airline = gameEngine.airline;
            unsetLoader();
            var jresponse = JSON.parse(response);
            var route = new Route(jresponse.route);
            airline.routes.push(route);
            airline.cash = jresponse.cash;
            airline.addTransaction(jresponse.transaction);
            displayInfo(jresponse.msg);
            airline.getRoutesDisplay();
            airline.updateStats();
            gameEngine.displayRoutesTab();
        };
        function onClick(ev) {
            var airline = gameEngine.airline;
            setLoader();
            client.purchaseRoute(airline.id, route_id, onSuccess, defaultErrHandler(btn));
        }
        makeClickable(btn, onClick);
        btnCell.appendChild(btn);
        tr.appendChild(btnCell);
        return tr;
    };
    return OfferedRoute;
}());
var Route = (function () {
    function Route(data) {
        var id = data.id, distance = data.distance, origin = data.origin, destination = data.destination, popularity = data.popularity, cost = data.cost, last_run_at = data.last_run_at, last_resulted_at = data.last_resulted_at, next_available_at = data.next_available_at, status = data.status;
        this.id = id;
        console.log('created route id', this.id);
        this.fromAirport = origin;
        this.toAirport = destination;
        this.distance = distance;
        this.popularity = popularity;
        this.purchaseCost = cost;
        this.lastRunAt = last_run_at ? new Date(last_run_at) : null;
        this.lastResultedAt = last_resulted_at ? new Date(last_resulted_at) : null;
        this.nextAvailableAt = next_available_at ? new Date(next_available_at) : null;
        this.status = status || "ready";
        console.log("Created Route", this.status, data);
    }
    Route.prototype.timeRemaining = function () {
        if (!this.nextAvailableAt) {
            return 0;
        }
        var now = new Date();
        var secondsTilNextAvailable = Math.ceil((+this.nextAvailableAt + -now) / 1000);
        return Math.max(0, secondsTilNextAvailable);
    };
    Route.prototype.run = function (btn) {
        var airline = gameEngine.airline;
        var route = this;
        console.log("Route.run route=", route);
        setLoader();
        $.ajax({
            method: "POST",
            url: "/fly_route",
            data: {
                airline_id: airline.id,
                route_id: this.id,
            },
            error: function (x) {
                defaultErrHandler(btn)(x);
                route.updatePurchasedCardContent();
            },
            success: function (response) {
                unsetLoader();
                var jresponse = JSON.parse(response);
                route.status = jresponse.status;
                route.lastRunAt = new Date(jresponse.last_run_at);
                route.nextAvailableAt = new Date(jresponse.next_available_at);
                airline.planes = jresponse.planes.map(function (p) { return new Plane(p); });
                airline.updateStats();
                route.updatePurchasedCardContent();
                displayInfo(jresponse.msg);
            }
        });
        return true;
    };
    Route.prototype.getResults = function (btn) {
        var airline = gameEngine.airline;
        var route = this;
        setLoader();
        $.ajax({
            method: "POST",
            url: "/collect",
            data: {
                airline_id: airline.id,
                route_id: this.id,
            },
            error: function (x) {
                defaultErrHandler(btn)(x);
                route.updatePurchasedCardContent();
            },
            success: function (response) {
                unsetLoader();
                var jresponse = JSON.parse(response);
                displayInfo(jresponse.msg);
                if (jresponse.incident) {
                    displayInfo(jresponse.incident);
                    airline.incidents.push(jresponse.incident);
                }
                route.status = jresponse.status;
                airline.planes = jresponse.planes.map(function (p) { return new Plane(p); });
                airline.popularity = jresponse.popularity;
                airline.updateStats(jresponse.cash);
                route.updatePurchasedCardContent();
            }
        });
    };
    Route.prototype.updatePurchasedCardContent = function () {
        var _this = this;
        var div = document.getElementById("owned-route-".concat(this.id));
        if (!div) {
            console.log("Failed to find element", "owned-route-".concat(this.id));
            setTimeout(function () { return _this.updatePurchasedCardContent(); }, 1000);
            return;
        }
        div.innerHTML = "";
        var titleCell = document.createElement("td");
        titleCell.innerHTML = "".concat(this.fromAirport.code, " <-> ").concat(this.toAirport.code);
        div.appendChild(titleCell);
        var distanceCell = document.createElement("td");
        distanceCell.innerHTML = "".concat(this.distance.toLocaleString("en-gb", { maximumFractionDigits: 0 }), "km");
        div.appendChild(distanceCell);
        var popularityCell = document.createElement("td");
        popularityCell.innerHTML = this.popularity.toLocaleString("en-gb");
        div.appendChild(popularityCell);
        var costCell = document.createElement("td");
        costCell.innerHTML = "$".concat(this.purchaseCost.toLocaleString("en-gb"));
        div.appendChild(costCell);
        var actionButton = document.createElement("button");
        actionButton.className = "text-center w-100";
        var statusText = "";
        console.log('updatePurchasedCardContent', this.status);
        if (this.timeRemaining()) {
            actionButton.setAttribute("disabled", "");
            actionButton.innerHTML = "Collect Results";
            statusText = "Current route running, ready in ".concat(this.timeRemaining(), " seconds");
            setTimeout(function () { return _this.updatePurchasedCardContent(); }, 1000);
        }
        else if (this.status === "ready") {
            statusText = "Ready to run!";
            makeClickable(actionButton, function (ev) { return _this.run(actionButton); });
            actionButton.innerHTML = "Run Route";
        }
        else if (this.status === "landed") {
            statusText = "Landed at ".concat(this.toAirport.code, "!");
            makeClickable(actionButton, function (ev) { return _this.getResults(actionButton); });
            actionButton.innerHTML = "Collect Route";
            actionButton.classList.add("collectable");
        }
        else {
            statusText = "Retrieving status...";
            actionButton.innerHTML = "";
            var route = this;
            $.ajax({
                method: "GET",
                url: "/route/".concat(this.id),
                data: {},
                error: defaultErrHandler(actionButton),
                success: function (response) {
                    var jresponse = JSON.parse(response);
                    route.status = jresponse.status;
                    route.updatePurchasedCardContent();
                }
            });
            return;
        }
        var statusDiv = createElement("td", { id: "route-status-".concat(this.id), class: "text-center" });
        statusDiv.innerText = statusText;
        div.appendChild(statusDiv);
        var actionButtonCell = document.createElement("td");
        actionButtonCell.appendChild(actionButton);
        div.appendChild(actionButtonCell);
    };
    Route.prototype.createPurchasedCardHtml = function () {
        var _this = this;
        var tr = createElement("tr", { id: "owned-route-".concat(this.id) });
        var domIcon = new H.map.DomIcon(tr, {
            onAttach: function (clonedElement, domIcon, domMarker) {
                var bubble = new H.ui.InfoBubble({ lng: this.toAirport.lon, lat: this.toAirport.lat }, {
                    content: "<b>Route from ".concat(this.fromAirport.name, " to ").concat(this.toAirport.name, "</b>")
                });
                gameEngine.ui.addBubble(bubble);
            },
            onDetach: function (clonedElement, domIcon, domMarker) {
            }
        });
        var marker = new H.map.Marker({ lat: this.toAirport.lat, lng: this.toAirport.lon });
        gameEngine.routeMap.addObject(marker);
        addPolylineToMap(gameEngine.routeMap, this.fromAirport.lat, this.fromAirport.lon, this.toAirport.lat, this.toAirport.lon);
        setTimeout(function () { return _this.updatePurchasedCardContent(); }, 100);
        return tr;
    };
    return Route;
}());
var Plane = (function () {
    function Plane(data) {
        var id = data.id, name = data.name, status = data.status, health = data.health, max_distance = data.max_distance, cost = data.cost, requires_fix = data.requires_fix, fix_cost = data.fix_cost, scrap_value = data.scrap_value;
        this.id = id;
        this.name = name;
        this.status = status;
        this.health = health;
        this.maxDistance = max_distance;
        this.cost = cost;
        this.requiresFix = requires_fix;
        this.fixCost = fix_cost;
        this.scrapValue = scrap_value;
    }
    Plane.prototype.purchasedCardHtml = function () {
        var tr = createElement("tr", { class: "bgw" });
        tr.appendChild(createElement("td", { innerHTML: this.name }));
        tr.appendChild(createElement("td", { innerHTML: this.maxDistance.toLocaleString("en-gb", { maximumFractionDigits: 0 }) + "km" }));
        tr.appendChild(createElement("td", { innerHTML: prettyCashString(this.cost) }));
        tr.appendChild(createElement("td", { innerHTML: this.status }));
        tr.appendChild(createElement("td", { innerHTML: this.health.toLocaleString("en-gb") }));
        var td = createElement("td", {});
        if (this.requiresFix) {
            td.appendChild(this.maintenanceHtml());
        }
        tr.appendChild(td);
        return tr;
    };
    Plane.prototype.maintenanceHtml = function () {
        var _this = this;
        var airline = gameEngine.airline;
        var div = createElement("div", { class: "flex" });
        var btn = createElement("button", { innerText: "Fix for ".concat(prettyCashString(this.fixCost)) });
        div.appendChild(btn);
        function onFixSuccess(response) {
            var jresponse = JSON.parse(response);
            airline.planes = jresponse.planes.map(function (p) { return new Plane(p); });
            airline.cash = jresponse.cash;
            airline.addTransaction(jresponse.transaction);
            displayInfo(jresponse.msg);
            gameEngine.displayFleetTab();
            airline.updateStats();
        }
        makeClickable(btn, function (ev) {
            client.fixPlane(airline.id, _this.id, onFixSuccess, defaultErrHandler(btn));
        });
        var btn = createElement("button", { innerText: "Sell to  Mojave scrapyard for ".concat(prettyCashString(this.scrapValue)) });
        div.appendChild(btn);
        function onScrapSuccess(response) {
            var jresponse = JSON.parse(response);
            airline.planes = jresponse.planes.map(function (p) { return new Plane(p); });
            airline.addTransaction(jresponse.transaction);
            airline.cash = jresponse.cash;
            displayInfo(jresponse.msg);
            gameEngine.displayFleetTab();
            airline.updateStats();
        }
        makeClickable(btn, function (ev) {
            client.scrapPlane(airline.id, _this.id, onScrapSuccess, defaultErrHandler(btn));
        });
        return div;
    };
    return Plane;
}());
var Airline = (function () {
    function Airline(data) {
        this.planes = [];
        this.routes = [];
        this.transactions = [];
        this.incidents = [];
        var id = data.id, name = data.name, hub = data.hub, joined_at = data.joined_at, cash = data.cash, rank = data.rank, planes = data.planes, routes = data.routes, popularity = data.popularity, transactions = data.transactions, incidents = data.incidents;
        this.id = id;
        this.name = name;
        this.hub = hub;
        console.log('joined', joined_at);
        this.joined = new Date(joined_at);
        this.cash = cash;
        this.rank = rank;
        this.planes = (planes || []).map(function (p) { return new Plane(p); });
        this.routes = (routes || []).map(function (r) { return new Route(r); });
        this.popularity = popularity;
        this.transactions = transactions || [];
        this.incidents = incidents || [];
    }
    Airline.prototype.updateTitle = function () {
        var div = document.getElementById("airlineTitle");
        div.appendChild(this.titleHtml());
    };
    Airline.prototype.updateStats = function (cash) {
        if (cash === void 0) { cash = null; }
        if (cash !== null) {
            this.cash = cash;
        }
        var placeholder = document.getElementById("airlineStats");
        placeholder.innerHTML = "";
        placeholder.appendChild(dataLabels([
            ["Cash", prettyCashString(this.cash)],
            ["Popularity", String(this.popularity)],
        ]));
    };
    Airline.prototype.addTransaction = function (msg) {
        this.transactions.push("".concat(new Date(), " ").concat(prettyCashString(this.cash), " ").concat(msg));
    };
    Airline.prototype.titleHtml = function () {
        return createTitle("".concat(this.name, "<strong>Hub: ").concat(this.hub.code, "</strong>"), "h2");
    };
    Airline.prototype.statsHtml = function () {
        var dl = dataLabels([
            ["Cash", prettyCashString(this.cash)],
            ["Planes", String(this.planes.length)],
            ["Routes", String(this.routes.length)],
            ["Popularity", String(this.popularity)],
            ["Rank", this.rank],
            ["Joined", this.joined.toLocaleDateString()],
        ]);
        return dl;
    };
    Airline.prototype.getFleetDisplay = function () {
        var header = document.getElementById("fleet-header");
        header.innerHTML = "";
        var owned_tbody = document.getElementById("owned-planes");
        var offered_tbody = document.getElementById("offered-planes");
        owned_tbody.innerHTML = "";
        offered_tbody.innerHTML = "";
        header.appendChild(createTitle("Your Fleet"));
        this.planes.forEach(function (plane) {
            owned_tbody.appendChild(plane.purchasedCardHtml());
        });
        header.appendChild(createParagraph("You have ".concat(this.planes.length, " planes in your fleet")));
        var airline = this;
        setLoader();
        $.ajax({
            method: "GET",
            url: "/offered_planes",
            data: {
                airline_id: airline.id
            },
            success: function (response) {
                JSON.parse(response).map(function (p) {
                    unsetLoader();
                    var tr = createElement("tr", { class: "bg-offered" });
                    var plane = new Plane(p);
                    var btn = document.createElement("button");
                    btn.setAttribute("style", "margin: 0.5rem");
                    var airplaneCost = plane.cost;
                    btn.innerHTML = "Buy plane for ".concat(prettyCashString(airplaneCost).toLocaleString());
                    function onSuccess(response) {
                        var r = JSON.parse(response);
                        displayInfo(r.msg);
                        airline.addTransaction(r.transaction);
                        airline.planes.push(new Plane(r.plane));
                        airline.updateStats(r.cash);
                        gameEngine.displayFleetTab();
                    }
                    makeClickable(btn, function (ev) {
                        client.purchasePlane(airline.id, plane.id, onSuccess, defaultErrHandler(btn));
                    });
                    tr.appendChild(createElement("td", { innerHTML: plane.name }));
                    var maxDistanceString = plane.maxDistance.toLocaleString("en-gb", { maximumFractionDigits: 0 }) + "km";
                    tr.appendChild(createElement("td", { innerHTML: maxDistanceString }));
                    tr.appendChild(createElement("td", { innerHTML: prettyCashString(airplaneCost) }));
                    tr.appendChild(createElement("td", { innerHTML: "" }));
                    tr.appendChild(createElement("td", { innerHTML: "" }));
                    var td = createElement("td", {});
                    td.appendChild(btn);
                    tr.appendChild(td);
                    offered_tbody.appendChild(tr);
                });
            },
            error: defaultErrHandler()
        });
    };
    Airline.prototype.getRoutesDisplay = function () {
        var routesContainer = document.getElementById("owned-routes");
        this.getMap();
        this.routes.forEach(function (route) {
            var div = document.getElementById("owned-route-".concat(route.id));
            if (!div) {
                routesContainer.appendChild(route.createPurchasedCardHtml());
            }
        });
        return routesContainer;
    };
    Airline.prototype.getReputationDisplay = function () {
        var div = document.createElement("div");
        var heading = createTitle("Reputation and Reviews");
        div.appendChild(heading);
        var p = createElement("p", { class: "p-3" });
        var numStars = 0;
        if (this.popularity > 89) {
            p.innerText = "Customers favorite airline in ".concat(this.hub.country, "!");
            numStars = 5;
        }
        else if (this.popularity > 69) {
            p.innerText = "Very reputable airline";
            numStars = 4;
        }
        else if (this.popularity > 49) {
            p.innerText = "Distinctly average";
            numStars = 3;
        }
        else if (this.popularity > 39) {
            p.innerText = "Poor reputation";
            numStars = 2;
        }
        else {
            p.innerText = "Customers least favorite choice";
            numStars = 1;
        }
        for (var i = 0; i < 5; i++) {
            var span = document.createElement("span");
            span.className = "fa fa-star";
            if (i < numStars) {
                span.classList.add("checked");
            }
            div.appendChild(span);
        }
        div.appendChild(p);
        return div;
    };
    Airline.prototype.getFinanceDisplay = function () {
        var div = document.createElement("div");
        var heading = createTitle("Finances");
        div.appendChild(heading);
        var tbl = createElement("table", {});
        var tbody = createElement("tbody", {});
        this.transactions.forEach(function (t) {
            var tr = createElement("tr", { class: "bgw" });
            var td = createElement("td", { innerText: t, class: "text-left" });
            tr.appendChild(td);
            tbody.appendChild(tr);
        });
        tbl.appendChild(tbody);
        div.appendChild(tbl);
        return div;
    };
    Airline.prototype.getAccidentsDisplay = function () {
        var div = document.createElement("div");
        var heading = createTitle("Accidents");
        div.appendChild(heading);
        var tbl = createElement("table", {});
        var tbody = createElement("tbody", {});
        this.incidents.forEach(function (t) {
            var tr = createElement("tr", { class: "bgw" });
            var td = createElement("td", { innerText: t, class: "text-left" });
            tr.appendChild(td);
            tbody.appendChild(tr);
        });
        tbl.appendChild(tbody);
        div.appendChild(tbl);
        return div;
    };
    Airline.prototype.getMap = function () {
        var _this = this;
        if (!gameEngine.routeMap) {
            var platform = new H.service.Platform({
                'apikey': 'neEmKYaMLvpsoM_LWP-j9qFEtsMLiBeDI9Ajqxu99Js'
            });
            var defaultLayers = platform.createDefaultLayers();
            var map = new H.Map(document.getElementById('map'), defaultLayers.vector.normal.map, {
                center: { lat: this.hub.lat, lng: this.hub.lon },
                zoom: 3,
                pixelRatio: window.devicePixelRatio || 1
            });
            gameEngine.ui = H.ui.UI.createDefault(map, defaultLayers);
            map.setBaseLayer(defaultLayers.raster.satellite.map);
            var behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
            window.addEventListener('resize', function () { return map.getViewPort().resize(); });
            gameEngine.routeMap = map;
            setTimeout(function () {
                var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path fill="#f28bc1" d="M1.9 32c0 13.1 8.4 24.2 20 28.3V3.7C10.3 7.8 1.9 18.9 1.9 32z"/><path fill="#ed4c5c" d="M61.9 32c0-13.1-8.3-24.2-20-28.3v56.6c11.7-4.1 20-15.2 20-28.3"/><path fill="#fff" d="M21.9 60.3c3.1 1.1 6.5 1.7 10 1.7s6.9-.6 10-1.7V3.7C38.8 2.6 35.5 2 31.9 2s-6.9.6-10 1.7v56.6"/></svg>';
                var marker = new H.map.Marker({
                    lat: _this.hub.lat,
                    lng: _this.hub.lon,
                }, {});
                map.addObject(marker);
            }, 3000);
        }
        return gameEngine.routeMap;
    };
    return Airline;
}());
var GameEngine = (function () {
    function GameEngine() {
        this.airports = [];
        this.routes = [];
        this.days = 0;
        this.today = new Date();
    }
    GameEngine.prototype.registerAirline = function (airline) {
        this.airline = airline;
        displayInfo("Please Choose your new route.");
        this.displayRoutesTab();
    };
    GameEngine.prototype.loadAirports = function () {
        if (this.airports.length === 0) {
            var airs = this.airports;
            var ge = this;
            setLoader();
            $.ajax({
                url: "/airports",
                success: function (response) {
                    unsetLoader();
                    airs = JSON.parse(response).map(function (a) { return new Airport(a); });
                    ge.airports = airs;
                    loadHubSelect(airs);
                },
                error: defaultErrHandler()
            });
        }
    };
    GameEngine.prototype.hideTabs = function (except) {
        ["overview", "fleet", "routes", "reputation", "finance", "accidents", "upgrades"].forEach(function (k) {
            if (k === except) {
                $("#main-".concat(k)).show();
            }
            else {
                $("#main-".concat(k)).hide();
            }
        });
    };
    GameEngine.prototype.displaySummaryTab = function () {
        this.hideTabs("overview");
        var main = document.getElementById("main-overview");
        main.innerHTML = "";
        var airline = this.airline;
        var heading = createTitle(airline.name);
        main.appendChild(heading);
        main.appendChild(airline.statsHtml());
        main.appendChild(airline.getReputationDisplay());
        main.appendChild(airline.getAccidentsDisplay());
        airline.getMap();
    };
    GameEngine.prototype.displayFleetTab = function () {
        this.hideTabs("fleet");
        var airline = this.airline;
        airline.getFleetDisplay();
    };
    GameEngine.prototype.displayRoutesTab = function () {
        this.hideTabs("routes");
        var airline = this.airline;
        airline.getRoutesDisplay();
        var offered = document.getElementById("offered-routes");
        setLoader();
        $.ajax({
            method: "GET",
            url: "/offered_routes",
            data: {
                airline_id: airline.id,
            },
            success: function (response) {
                unsetLoader();
                offered.innerHTML = "";
                var routesToDisplay = JSON.parse(response).map(function (r) { return new OfferedRoute(r); });
                routesToDisplay.forEach(function (r) { return offered.appendChild(r.trHtml()); });
            },
            error: defaultErrHandler(),
        });
    };
    GameEngine.prototype.displayUpgradesTab = function () {
        this.hideTabs("upgrades");
        var airline = this.airline;
        setLoader();
        var main = document.getElementById("main-upgrades");
        main.innerHTML = "";
        $.ajax({
            method: "GET",
            url: "/upgrades",
            data: {
                airline_id: airline.id,
            },
            success: function (response) {
                unsetLoader();
                var parentContainer = createElement("div", { class: "" });
                var upgradeCategories = JSON.parse(response).forEach(function (category) {
                    var categoryContainer = createElement("div", { class: "bg-light border-box p-3" });
                    categoryContainer.appendChild(createElement("h4", { innerText: category["title"], class: "mb-1" }));
                    categoryContainer.appendChild(listLabels([
                        ["Current Level", category["current_level"]],
                        ["Upgrade Cost", category["upgrade_cost"]],
                    ]));
                    var btn_class = category["upgrade_enabled"] ? "" : "disabled";
                    var btn = createElement("button", { innerText: "Upgrade", class: btn_class });
                    if (category["upgrade_enabled"]) {
                        btn.addEventListener("click", function () {
                            btn.setAttribute("disabled", "");
                            btn.innerHTML = "...";
                            client.upgradeFuelEfficiency(airline.id, category["fuel_efficiency_level"]);
                        });
                    }
                    else {
                        btn.setAttribute("disabled", "");
                    }
                    categoryContainer.appendChild(btn);
                    parentContainer.appendChild(categoryContainer);
                });
                main.appendChild(parentContainer);
            },
            error: defaultErrHandler()
        });
    };
    GameEngine.prototype.displayReputationTab = function () {
        this.hideTabs("reputation");
        var main = document.getElementById("main-reputation");
        main.innerHTML = "";
        var airline = this.airline;
        main.appendChild(airline.getReputationDisplay());
    };
    GameEngine.prototype.displayFinanceTab = function () {
        this.hideTabs("finance");
        var main = document.getElementById("main-finance");
        main.innerHTML = "";
        var airline = this.airline;
        main.appendChild(airline.getFinanceDisplay());
    };
    GameEngine.prototype.displayAccidentsTab = function () {
        this.hideTabs("accidents");
        var main = document.getElementById("main-accidents");
        main.innerHTML = "";
        var airline = this.airline;
        main.appendChild(airline.getAccidentsDisplay());
    };
    GameEngine.prototype.gameOver = function () {
        var main = document.getElementById("main");
        main.innerHTML = "<h1 style='color:red;'>GAMEOVER</h1>";
    };
    GameEngine.prototype.createSideMenu = function () {
        var sideMenu = document.getElementById("sidemenu");
        var buttons = [
            createElement("button", { id: "viewCompany", class: "flex-grow dark", innerText: "Overview of ".concat(this.airline.name) }),
            createElement("button", { id: "viewFleet", class: "flex-grow dark", innerText: "Overview of Fleet" }),
            createElement("button", { id: "viewRoutes", class: "flex-grow dark", innerText: "Overview of Routes" }),
            createElement("button", { id: "viewUpgrades", class: "flex-grow dark", innerText: "Overview of Upgrades" }),
            createElement("button", { id: "viewReputation", class: "flex-grow dark", innerText: "Overview of Reputation" }),
            createElement("button", { id: "viewFinance", class: "flex-grow dark", innerText: "Overview of Finance" }),
            createElement("button", { id: "viewAccidents", class: "flex-grow dark", innerText: "Overview of Accidents" }),
        ];
        var setScreen = function (buttonId) {
            buttons.forEach(function (b) {
                if (b.id === buttonId) {
                    b.classList.add("light");
                }
                else {
                    b.classList.remove("light");
                }
            });
            switch (buttonId) {
                case "viewCompany":
                    gameEngine.displaySummaryTab();
                    break;
                case "viewFleet":
                    gameEngine.displayFleetTab();
                    break;
                case "viewRoutes":
                    gameEngine.displayRoutesTab();
                    break;
                case "viewUpgrades":
                    gameEngine.displayUpgradesTab();
                    break;
                case "viewReputation":
                    gameEngine.displayReputationTab();
                    break;
                case "viewFinance":
                    gameEngine.displayFinanceTab();
                    break;
                case "viewAccidents":
                    gameEngine.displayAccidentsTab();
                    break;
                default:
                    console.error("Unexpected buttonId:", buttonId);
            }
        };
        buttons.forEach(function (b) {
            b.addEventListener("click", function () { return setScreen(b.id); });
            sideMenu.appendChild(b);
        });
    };
    return GameEngine;
}());
var gameEngine = new GameEngine();
var client = new RequestClient(gameEngine);
function loadHubSelect(airports) {
    var hubRow = document.getElementById("hubRow");
    var hubLabel = document.createElement("label");
    hubLabel.setAttribute("for", "hub");
    hubLabel.textContent = "Choose your hub";
    var hubSelect = document.createElement("select");
    hubSelect.setAttribute("id", "hubSelect");
    hubSelect.setAttribute("name", "hub");
    airports.map(function (airport) {
        var opt = document.createElement("option");
        opt.setAttribute("value", airport.code);
        opt.textContent = "".concat(airport.name, " (").concat(airport.code, ")");
        hubSelect.appendChild(opt);
        return opt;
    });
    hubRow.appendChild(hubLabel);
    hubRow.appendChild(hubSelect);
}
var renderSignupForm = function () {
    var form = document.getElementById("SignUp");
    var nameRow = document.createElement("div");
    var nameLabel = createElement("label", { innerText: "What do you want your airline to be called?" });
    nameLabel.setAttribute("for", "businessName");
    var nameInput = document.createElement("input");
    nameInput.setAttribute("type", "text");
    nameInput.setAttribute("name", "businessName");
    nameInput.setAttribute("required", "");
    nameRow.appendChild(nameLabel);
    nameRow.appendChild(nameInput);
    var passwordinput = document.createElement("input");
    passwordinput.setAttribute("type", "text");
    passwordinput.setAttribute("name", "password");
    passwordinput.setAttribute("required", "");
    var hubRow = createElement("div", { id: "hubRow" });
    var playBtn = createElement("button", { class: "primary", innerText: "Create" });
    playBtn.setAttribute("type", "submit");
    form.innerHTML = "";
    form.appendChild(nameRow);
    form.appendChild(passwordinput);
    form.appendChild(hubRow);
    form.appendChild(playBtn);
    nameInput.setAttribute("value", randomBusinessName());
    form.addEventListener("submit", function (e) {
        var hubSelect = document.getElementById("hubSelect");
        e.preventDefault();
        setLoader();
        $.ajax({
            method: "POST",
            url: "/signup",
            data: {
                businessName: nameInput.value,
                hub: hubSelect.value,
                password: passwordinput.value,
            },
            error: defaultErrHandler(),
            success: function (response) {
                hideElement(document.getElementById("Login"));
                hideElement(document.getElementById("SignUp"));
                unsetLoader();
                var airline = new Airline(JSON.parse(response));
                displayInfo(airline.name + " joins the aviation industry!");
                gameEngine.registerAirline(airline);
                var header = document.getElementsByTagName("header")[0];
                header === null || header === void 0 ? void 0 : header.classList.remove("justify-content-center");
                header === null || header === void 0 ? void 0 : header.classList.remove("flex-column");
                header === null || header === void 0 ? void 0 : header.classList.add("justify-content-between");
                gameEngine.createSideMenu();
                airline.updateTitle();
                airline.updateStats();
                $("#logo").show();
            }
        });
    });
};
var renderLoginForm = function () {
    var form = document.getElementById("Login");
    var nameRow = document.createElement("div");
    var nameLabel = createElement("label", { innerText: "Please Enter Your Airline Name." });
    nameLabel.setAttribute("for", "businessName");
    var nameInput = document.createElement("input");
    nameInput.setAttribute("type", "text");
    nameInput.setAttribute("name", "businessName");
    nameInput.setAttribute("required", "");
    nameRow.appendChild(nameLabel);
    nameRow.appendChild(nameInput);
    var passwordinput = document.createElement("input");
    passwordinput.setAttribute("type", "text");
    passwordinput.setAttribute("name", "password");
    passwordinput.setAttribute("required", "");
    var playBtn = createElement("button", { class: "primary", innerText: "Login" });
    playBtn.setAttribute("type", "submit");
    form.innerHTML = "";
    form.appendChild(nameRow);
    form.appendChild(passwordinput);
    form.appendChild(playBtn);
    nameInput.setAttribute("value", randomBusinessName());
    form.addEventListener("submit", function (e) {
        var hubSelect = document.getElementById("hubSelect");
        e.preventDefault();
        setLoader();
        $.ajax({
            method: "POST",
            url: "/login",
            data: {
                businessName: nameInput.value,
                password: passwordinput.value,
            },
            error: defaultErrHandler(),
            success: function (response) {
                hideElement(document.getElementById("Login"));
                hideElement(document.getElementById("SignUp"));
                unsetLoader();
                var airline = new Airline(JSON.parse(response));
                displayInfo("Welcome back " + airline.name + "!");
                gameEngine.registerAirline(airline);
                var header = document.getElementsByTagName("header")[0];
                header === null || header === void 0 ? void 0 : header.classList.remove("justify-content-center");
                header === null || header === void 0 ? void 0 : header.classList.remove("flex-column");
                header === null || header === void 0 ? void 0 : header.classList.add("justify-content-between");
                gameEngine.createSideMenu();
                airline.updateTitle();
                airline.updateStats();
                $("#logo").show();
            }
        });
    });
};
window.onload = function () {
    renderSignupForm();
    renderLoginForm();
    gameEngine.loadAirports();
    gameEngine.hideTabs("");
    var logoImg = document.getElementById("logo");
    logoImg.addEventListener("click", function () {
        var oldSrc = logoImg.src;
        var newSrc = prompt("Enter URL of your logo", oldSrc);
        if (newSrc) {
            logoImg.src = newSrc;
        }
    });
};
