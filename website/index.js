function defaultErrHandler(btn) {
    function handler(err) {
        console.log("Default error handler was called", err);
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
function createSpinner(parent) {
    var spinner = createElement("div", { class: "spinner" });
    parent.appendChild(spinner);
    return spinner;
}
function createTitleBanner(innerHTML, elementType) {
    if (elementType === void 0) { elementType = "h1"; }
    return createElement(elementType, { innerHTML: innerHTML, class: "bgwf p-2 mb-1" });
}
function hideElement(elem) {
    elem.style.display = 'none';
}
function makeClickable(btn, onClick) {
    function listener(ev) {
        btn.setAttribute("disabled", "");
        btn.innerText = "";
        createSpinner(btn);
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
    RequestClient.prototype.getAirports = function (callback) {
        $.ajax({
            method: "GET",
            url: "/airports",
            success: function (response) { return callback(JSON.parse(response)); },
            error: defaultErrHandler(),
        });
    };
    RequestClient.prototype.getReputation = function (airline_id, callback) {
        $.ajax({
            method: "GET",
            url: "/reputation/".concat(airline_id),
            success: function (response) { return callback(JSON.parse(response)); },
            error: defaultErrHandler(),
        });
    };
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
                var _a = JSON.parse(response), cash = _a.cash, transaction = _a.transaction;
                gameEngine.airline.cash = cash;
                gameEngine.airline.addTransaction(transaction);
                gameEngine.airline.updateStats();
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
                var jresponse = JSON.parse(response);
                displayInfo(jresponse.msg);
                if (jresponse.incident) {
                    displayInfo(jresponse.incident);
                    airline.incidents.push(jresponse.incident);
                }
                airline.addTransaction(jresponse.transaction);
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
        div.appendChild(createElement("h2", { innerText: this.name }));
        div.appendChild(createElement("h4", { innerText: "Hub: ".concat(this.hub.code) }));
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
    Airline.prototype.addTransaction = function (t) {
        this.transactions.push(t);
    };
    Airline.prototype.statsHtml = function () {
        var div = createElement("div", { class: "m-2 p-3 bgwf secondary-card" });
        var dl = dataLabels([
            ["Cash", prettyCashString(this.cash)],
            ["Planes", String(this.planes.length)],
            ["Routes", String(this.routes.length)],
            ["Popularity", String(this.popularity)],
            ["Rank", this.rank],
            ["Joined", this.joined.toLocaleDateString()],
        ]);
        div.appendChild(dl);
        return div;
    };
    Airline.prototype.getFleetDisplay = function () {
        var header = document.getElementById("fleet-header");
        header.innerHTML = "";
        var owned_tbody = document.getElementById("owned-planes");
        var offered_tbody = document.getElementById("offered-planes");
        owned_tbody.innerHTML = "";
        offered_tbody.innerHTML = "";
        header.appendChild(createTitleBanner("Your Fleet"));
        this.planes.forEach(function (plane) {
            owned_tbody.appendChild(plane.purchasedCardHtml());
        });
        header.appendChild(createElement("p", { innerText: "You have ".concat(this.planes.length, " planes in your fleet"), class: "m-2 p-3 bgwf secondary-card" }));
        var airline = this;
        $.ajax({
            method: "GET",
            url: "/offered_planes",
            data: {
                airline_id: airline.id
            },
            success: function (response) {
                JSON.parse(response).map(function (p) {
                    var tr = createElement("tr", { class: "bg-offered" });
                    var plane = new Plane(p);
                    var airplaneCost = plane.cost;
                    var btn = createElement("button", { innerHTML: "Buy plane for ".concat(prettyCashString(airplaneCost).toLocaleString()) });
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
        console.log('getReputationDisplay');
        var container = document.createElement("div");
        var heading = createTitleBanner("Reputation and Reviews");
        container.appendChild(heading);
        var div = createElement("div", { class: "m-2 p-3 bgwf secondary-card" });
        var airline = this;
        var spinner = createSpinner(div);
        container.appendChild(div);
        var callback = function (response) {
            console.log('getReputationDisplay callback', response);
            spinner.remove();
            for (var i = 0; i < 5; i++) {
                var span = document.createElement("span");
                span.className = "fa fa-star";
                if (i < response.num_stars) {
                    span.classList.add("checked");
                }
                div.appendChild(span);
            }
            var p = createElement("p", { class: "", innerText: response.airline_reputation });
            div.appendChild(p);
        };
        client.getReputation(airline.id, callback);
        console.log('getReputationDisplay returning container');
        return container;
    };
    Airline.prototype.getFinanceDisplay = function () {
        var div = document.createElement("div");
        var heading = createTitleBanner("Finances");
        div.appendChild(heading);
        var tbl = createElement("table", { class: "table w-100" });
        var thead = createElement("thead", {});
        var theadrow = createElement("tr", {});
        theadrow.appendChild(createElement("th", { innerText: "Time" }));
        theadrow.appendChild(createElement("th", { innerText: "Cash Balance" }));
        theadrow.appendChild(createElement("th", { innerText: "Cash in" }));
        theadrow.appendChild(createElement("th", { innerText: "Cash out" }));
        theadrow.appendChild(createElement("th", { innerText: "Description" }));
        thead.appendChild(theadrow);
        tbl.appendChild(thead);
        var tbody = createElement("tbody", {});
        this.transactions.forEach(function (t) {
            var tr = createElement("tr", { class: "bgw" });
            var td = createElement("td", { innerText: t.ts, class: "text-left" });
            tr.appendChild(td);
            var td = createElement("td", { innerText: prettyCashString(t.starting_cash), class: "text-right" });
            tr.appendChild(td);
            var td = createElement("td", { innerText: t.amount > 0 ? prettyCashString(t.amount) : "", class: "text-right" });
            tr.appendChild(td);
            var td = createElement("td", { innerText: t.amount > 0 ? "" : prettyCashString(t.amount), class: "text-right" });
            tr.appendChild(td);
            var td = createElement("td", { innerText: t.description, class: "text-left" });
            tr.appendChild(td);
            tbody.appendChild(tr);
        });
        tbl.appendChild(tbody);
        div.appendChild(tbl);
        return div;
    };
    Airline.prototype.getAccidentsDisplay = function () {
        var div = document.createElement("div");
        var heading = createTitleBanner("Accidents");
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
        var heading = createTitleBanner(airline.name);
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
        $.ajax({
            method: "GET",
            url: "/offered_routes",
            data: {
                airline_id: airline.id,
            },
            success: function (response) {
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
        var main = document.getElementById("main-upgrades");
        main.innerHTML = "";
        $.ajax({
            method: "GET",
            url: "/upgrades",
            data: {
                airline_id: airline.id,
            },
            success: function (response) {
                var parentContainer = createElement("div", { class: "" });
                var upgradeCategories = JSON.parse(response).forEach(function (category) {
                    var categoryContainer = createElement("div", { class: "m-2 p-3 bgwf secondary-card" });
                    categoryContainer.appendChild(createElement("h2", { innerText: category["title"], class: "mb-1" }));
                    categoryContainer.appendChild(createElement("p", { innerText: "Level ".concat(category["current_level"]) }));
                    categoryContainer.appendChild(createElement("p", { innerText: category["description"] }));
                    categoryContainer.appendChild(createElement("p", { innerText: category["upgrade_description"] }));
                    var btn_class = category["upgrade_enabled"] ? "" : "disabled";
                    var btn = createElement("button", { innerText: category["button_text"], class: btn_class });
                    if (category["upgrade_enabled"]) {
                        makeClickable(btn, function (ev) {
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
    GameEngine.prototype.createTopMenu = function () {
        var topMenu = document.getElementById("topmenu");
        var buttons = [
            createElement("button", { id: "viewCompany", class: "screen-btn flex-grow dark", innerText: "Overview" }),
            createElement("button", { id: "viewFleet", class: "screen-btn flex-grow dark", innerText: "Fleet" }),
            createElement("button", { id: "viewRoutes", class: "screen-btn flex-grow dark", innerText: "Routes" }),
            createElement("button", { id: "viewUpgrades", class: "screen-btn flex-grow dark", innerText: "Upgrades" }),
            createElement("button", { id: "viewReputation", class: "screen-btn flex-grow dark", innerText: "Reputation" }),
            createElement("button", { id: "viewFinance", class: "screen-btn flex-grow dark", innerText: "Finance" }),
            createElement("button", { id: "viewAccidents", class: "screen-btn flex-grow dark", innerText: "Accidents" }),
        ];
        buttons.forEach(function (b) { return topMenu.appendChild(b); });
        return buttons;
    };
    GameEngine.prototype.createSideMenu = function (airline) {
        var sideMenu = document.getElementById("sidemenu");
        var buttons = [
            createElement("button", { id: "viewCompany", class: "screen-btn flex-grow dark", innerText: "Overview of ".concat(airline.name) }),
            createElement("button", { id: "viewFleet", class: "screen-btn flex-grow dark", innerText: "Overview of Fleet" }),
            createElement("button", { id: "viewRoutes", class: "screen-btn flex-grow dark", innerText: "Overview of Routes" }),
            createElement("button", { id: "viewUpgrades", class: "screen-btn flex-grow dark", innerText: "Overview of Upgrades" }),
            createElement("button", { id: "viewReputation", class: "screen-btn flex-grow dark", innerText: "Overview of Reputation" }),
            createElement("button", { id: "viewFinance", class: "screen-btn flex-grow dark", innerText: "Overview of Finance" }),
            createElement("button", { id: "viewAccidents", class: "screen-btn flex-grow dark", innerText: "Overview of Accidents" }),
        ];
        buttons.forEach(function (b) { return sideMenu.appendChild(b); });
        return buttons;
    };
    return GameEngine;
}());
var gameEngine = new GameEngine();
var client = new RequestClient(gameEngine);
function loadGameScreen(airline) {
    var homeHeader = document.getElementById("homeHeader");
    var gameHeader = document.getElementById("gameHeader");
    hideElement(homeHeader);
    gameHeader.style.display = "flex";
    var buttons = gameEngine.createTopMenu();
    loadMenuButtons(buttons);
    airline.updateTitle();
    airline.updateStats();
}
function loadMenuButtons(buttons) {
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
    });
}
var renderSignupForm = function () {
    var form = document.getElementById("SignUp");
    var nameRow = document.createElement("div");
    var nameLabel = createElement("label", { innerText: "Airline name" });
    nameLabel.setAttribute("for", "businessName");
    var nameInput = document.createElement("input");
    nameInput.setAttribute("type", "text");
    nameInput.setAttribute("name", "businessName");
    nameInput.setAttribute("required", "");
    nameRow.appendChild(nameLabel);
    nameRow.appendChild(nameInput);
    var passwordRow = createElement("div", {});
    var passwordLabel = createElement("label", { innerText: "Password" });
    passwordLabel.setAttribute("for", "password");
    var passwordinput = document.createElement("input");
    passwordinput.setAttribute("type", "text");
    passwordinput.setAttribute("name", "password");
    passwordinput.setAttribute("required", "");
    passwordRow.appendChild(passwordLabel);
    passwordRow.appendChild(passwordinput);
    var hubRow = createElement("div", { id: "hubRow" });
    var hubLabel = document.createElement("label");
    hubLabel.setAttribute("for", "hub");
    hubLabel.textContent = "Choose your hub";
    hubRow.appendChild(hubLabel);
    var playBtn = createElement("button", { id: "playBtn", class: "primary" });
    playBtn.setAttribute("disabled", "");
    playBtn.setAttribute("type", "submit");
    createSpinner(playBtn);
    form.innerHTML = "";
    form.appendChild(createElement("h3", { innerText: "Sign Up", class: "text-center" }));
    form.appendChild(createElement("p", { innerText: "Create your airline", class: "" }));
    form.appendChild(nameRow);
    form.appendChild(passwordRow);
    form.appendChild(hubRow);
    form.appendChild(playBtn);
    nameInput.setAttribute("value", randomBusinessName());
    form.addEventListener("submit", function (e) {
        e.preventDefault();
        var businessName = nameInput.value;
        if (!businessName) {
            displayError("Please provide a name for your airline");
            return;
        }
        var hub = document.getElementById("hubSelect").value;
        if (!hub) {
            displayError("Please select a hub for your airline");
            return;
        }
        var password = passwordinput.value;
        if (!password) {
            displayError("Please provide a password");
            return;
        }
        $.ajax({
            method: "POST",
            url: "/signup",
            data: {
                businessName: businessName,
                hub: hub,
                password: password,
            },
            error: defaultErrHandler(),
            success: function (response) {
                hideElement(document.getElementById("landing"));
                var airline = new Airline(JSON.parse(response));
                displayInfo(airline.name + " joins the aviation industry!");
                gameEngine.registerAirline(airline);
                loadGameScreen(airline);
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
    var passwordRow = createElement("div", {});
    var passwordLabel = createElement("label", { innerText: "Password" });
    passwordLabel.setAttribute("for", "password");
    var passwordinput = document.createElement("input");
    passwordinput.setAttribute("type", "text");
    passwordinput.setAttribute("name", "password");
    passwordinput.setAttribute("required", "");
    passwordRow.appendChild(passwordLabel);
    passwordRow.appendChild(passwordinput);
    var playBtn = createElement("button", { class: "primary", innerText: "Login" });
    playBtn.setAttribute("type", "submit");
    form.innerHTML = "";
    var heading = createElement("h3", { innerText: "Log In", class: "text-center" });
    form.appendChild(heading);
    form.appendChild(createElement("p", { innerText: "Welcome back!" }));
    form.appendChild(nameRow);
    form.appendChild(passwordRow);
    form.appendChild(playBtn);
    nameInput.setAttribute("value", randomBusinessName());
    form.addEventListener("submit", function (e) {
        var hubSelect = document.getElementById("hubSelect");
        e.preventDefault();
        $.ajax({
            method: "POST",
            url: "/login",
            data: {
                businessName: nameInput.value,
                password: passwordinput.value,
            },
            error: defaultErrHandler(),
            success: function (response) {
                hideElement(document.getElementById("landing"));
                var airline = new Airline(JSON.parse(response));
                displayInfo("Welcome back " + airline.name + "!");
                gameEngine.registerAirline(airline);
                loadGameScreen(airline);
                $("#logo").show();
            }
        });
    });
};
window.onload = function () {
    renderSignupForm();
    renderLoginForm();
    client.getAirports(function (airports) {
        console.log('callback', airports);
        var hubSelect = createElement("select", { id: "hubSelect" });
        hubSelect.setAttribute("name", "hub");
        airports.forEach(function (airport) {
            var opt = createElement("option", { innerText: "".concat(airport.name, " (").concat(airport.code, ")") });
            opt.setAttribute("value", airport.code);
            hubSelect.appendChild(opt);
        });
        var hubRow = document.getElementById("hubRow");
        hubRow.appendChild(hubSelect);
        var playBtn = document.getElementById("playBtn");
        playBtn.removeAttribute("disabled");
        playBtn.innerHTML = "Create Airline";
    });
    gameEngine.hideTabs("");
    var logoImg = document.getElementById("logo");
    logoImg.addEventListener("click", function () {
        var oldSrc = logoImg.src;
        var newSrc = prompt("Enter URL of your logo", oldSrc);
        if (newSrc) {
            logoImg.src = newSrc;
        }
    });
    $.ajax({
        method: "GET",
        url: "/meta",
        success: function (response) {
            var _a = JSON.parse(response), total = _a.total, online = _a.online;
            var div = document.getElementById("placeholder");
            div.appendChild(createElement("p", { innerText: "Compete with ".concat(total, " other airlines!") }));
            div.appendChild(createElement("p", { innerText: "".concat(online, " players currently online!") }));
        },
        error: defaultErrHandler(),
    });
    $.ajax({
        method: "GET",
        url: "/news",
        success: function (response) {
            var articles = JSON.parse(response);
            var div = document.getElementById("news");
            articles.forEach(function (article) {
                var p = createElement("div", { class: "bgwf secondary-card p-2 text-center w-100" });
                var anchor = createElement("a", { innerText: article["title"] });
                anchor.setAttribute("href", article["url"]);
                p.appendChild(anchor);
                div.appendChild(p);
            });
        },
        error: defaultErrHandler(),
    });
};
