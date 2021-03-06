//////// HELPING FUNCTIONS
function errHandler(err, button) {
    unsetLoader();
    displayError(err.responseText);
    if (button) {
        button.removeAttribute("disabled");
    }
}
function randomBusinessName() {
    var adjectives = ["Blue", "Red", "Green", "Purple", "Orange", "White", "Trusty", "Speedy", "Enigmatic", "Fly", "Golden", "Sturdy", "Graceful", "Rapid", "Robust", "American", "British", "Asian", "European", "Indian", "Italian", "Australian", "Chinese", "Russian", "Nordic", "Southern", "Northern", "Southwest", "Express", "Paper", "Malaysia", "Thai"];
    var nouns = ["Planes", "Airways", "Skies", "Air", "Airlines", "Flyers", "Jets", "Pilots", "Air Transport", "Helicopters", "Cargo"];
    var name = randomChoice(adjectives) + " " + randomChoice(nouns);
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
        li.innerHTML = "<strong>" + r[0] + ":</strong>" + r[1];
        elem.appendChild(li);
    });
    return elem;
}
function createElement(elementType, elementId, className, innerText) {
    var e = document.createElement(elementType);
    if (elementId) {
        e.setAttribute("id", elementId);
    }
    if (className) {
        e.setAttribute("class", className);
    }
    if (innerText) {
        e.innerText = innerText;
    }
    return e;
}
function createTitle(text, elementType) {
    if (elementType === void 0) { elementType = "h1"; }
    var h = document.createElement(elementType);
    h.innerHTML = text;
    return h;
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
function makeClickWrapper(btn, handler) {
    // disable, show spinner until response
    console.log('buttonClickWrapper ', btn, handler);
    function completeHandler(ev) {
        console.log('completeHandler enter', this, ev);
        btn.setAttribute("disabled", "");
        btn.innerHTML = '...';
        handler();
        console.log('completeHandler exit', this, ev);
    }
    return completeHandler;
}
var Airport = /** @class */ (function () {
    function Airport(data) {
        var code = data.code, name = data.name, country = data.country, lat = data.lat, lon = data.lon, popularity = data.popularity;
        this.code = code;
        this.name = name;
        this.country = country;
        this.lat = lat;
        this.lon = lon;
        this.popularity = popularity;
    }
    Airport.prototype.cardHtml = function () {
        return dataLabels([
            ["IATA code", this.code],
            ["Country", this.country],
            ["Popularity", String(this.popularity)],
        ]);
    };
    return Airport;
}());
var OfferedRoute = /** @class */ (function () {
    function OfferedRoute(data) {
        var id = data.id, distance = data.distance, origin = data.origin, destination = data.destination, popularity = data.popularity, cost = data.cost;
        this.id = id;
        this.distance = distance;
        this.fromAirport = origin;
        this.toAirport = destination;
        this.popularity = popularity;
        this.purchaseCost = cost;
    }
    OfferedRoute.prototype.buttonHtml = function () {
        var btn = document.createElement("button");
        btn.setAttribute("style", "background-color:#ddcc44aa");
        btn.setAttribute("class", "flex-grow");
        btn.appendChild(this.cardHtml());
        var routeId = this.id;
        btn.addEventListener("click", makeClickWrapper(btn, function () {
            var airline = gameEngine.airline;
            setLoader();
            $.ajax({
                method: "POST",
                url: "/purchase_route",
                data: {
                    airlineId: airline.id,
                    routeId: routeId
                },
                error: function (x) { return errHandler(x, btn); },
                success: function (response) {
                    unsetLoader();
                    var jresponse = JSON.parse(response);
                    var route = new Route(jresponse.route);
                    airline.routes.push(route);
                    airline.cash = jresponse.cash;
                    airline.addTransaction(jresponse.transaction);
                    displayInfo(jresponse.msg);
                    airline.getRoutesDisplay();
                    airline.updateStats();
                }
            });
        }));
        return btn;
    };
    OfferedRoute.prototype.cardHtml = function () {
        var dl = dataLabels([
            ["Distance", this.distance.toLocaleString("en-gb", { maximumFractionDigits: 0 }) + "km"],
            ["Popularity", this.popularity.toLocaleString("en-gb")],
            ["Cost", "$" + this.purchaseCost.toLocaleString("en-gb")],
        ]);
        var card = document.createElement("div");
        card.className = "flex flex-column justify-content-between";
        card.innerHTML = "<h3>" + this.fromAirport.code + " <-> " + this.toAirport.code + "</h3>";
        card.appendChild(dl);
        var footer = document.createElement("div");
        var fromAirport = document.createElement("h5");
        fromAirport.innerHTML = this.fromAirport.name;
        footer.appendChild(fromAirport);
        footer.appendChild(document.createElement("hr"));
        var toAirport = document.createElement("h5");
        toAirport.innerHTML = this.toAirport.name;
        footer.appendChild(toAirport);
        card.appendChild(footer);
        return card;
    };
    return OfferedRoute;
}());
var Route = /** @class */ (function () {
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
            url: "/run-route",
            data: {
                airlineId: airline.id,
                routeId: this.id
            },
            error: function (x) {
                errHandler(x, btn);
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
                airlineId: airline.id,
                routeId: this.id
            },
            error: function (x) {
                errHandler(x, btn);
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
        var div = document.getElementById("owned-route-" + this.id);
        if (!div) {
            console.log("Failed to find element", "owned-route-" + this.id);
            setTimeout(function () { return _this.updatePurchasedCardContent(); }, 1000);
            return;
        }
        div.innerHTML = "";
        div.appendChild(this.cardHtml());
        var actionButton = document.createElement("button");
        var statusText = "";
        if (this.timeRemaining()) {
            actionButton.setAttribute("disabled", "");
            actionButton.innerHTML = "Collect Results";
            statusText = "Current route running, ready in " + this.timeRemaining() + " seconds";
            setTimeout(function () { return _this.updatePurchasedCardContent(); }, 1000);
        }
        else if (this.status === "ready") {
            statusText = "Ready to run!";
            actionButton.addEventListener("click", makeClickWrapper(actionButton, function () { return _this.run(actionButton); }));
            actionButton.innerHTML = "Run Route";
        }
        else if (this.status === "landed") {
            statusText = "Landed at " + this.toAirport.code + "!";
            actionButton.addEventListener("click", makeClickWrapper(actionButton, function () { return _this.getResults(actionButton); }));
            actionButton.innerHTML = "Collect Route";
        }
        else {
            statusText = "Retrieving status...";
            actionButton.innerHTML = "";
            var route = this;
            $.ajax({
                method: "GET",
                url: "/route/" + this.id,
                data: {},
                error: function (x) { return errHandler(x); },
                success: function (response) {
                    var jresponse = JSON.parse(response);
                    route.status = jresponse.status;
                    route.updatePurchasedCardContent();
                }
            });
            return;
        }
        var statusDiv = createElement("div", "route-status-" + this.id, "p-3 text-center");
        statusDiv.innerText = statusText;
        actionButton.className = "p-3 text-center w-100";
        div.appendChild(statusDiv);
        div.appendChild(actionButton);
    };
    Route.prototype.createPurchasedCardHtml = function () {
        var _this = this;
        var div = createElement("div", "owned-route-" + this.id);
        div.className = "bg-light border-box";
        setTimeout(function () { return _this.updatePurchasedCardContent(); }, 100);
        return div;
    };
    Route.prototype.cardHtml = function () {
        var dl = dataLabels([
            ["Distance", this.distance.toLocaleString("en-gb", { maximumFractionDigits: 0 }) + "km"],
            ["Popularity", this.popularity.toLocaleString("en-gb")],
            ["Cost", "$" + this.purchaseCost.toLocaleString("en-gb")],
        ]);
        var card = document.createElement("div");
        card.className = "flex flex-column justify-content-between";
        card.innerHTML = "<h3>" + this.fromAirport.code + " <-> " + this.toAirport.code + "</h3>";
        card.appendChild(dl);
        var footer = document.createElement("div");
        var fromAirport = document.createElement("h5");
        fromAirport.innerHTML = this.fromAirport.name;
        footer.appendChild(fromAirport);
        footer.appendChild(document.createElement("hr"));
        var toAirport = document.createElement("h5");
        toAirport.innerHTML = this.toAirport.name;
        footer.appendChild(toAirport);
        card.appendChild(footer);
        return card;
    };
    return Route;
}());
var Plane = /** @class */ (function () {
    function Plane(data) {
        var id = data.id, name = data.name, status = data.status, health = data.health, max_distance = data.max_distance, cost = data.cost;
        this.id = id;
        this.name = name;
        this.status = status;
        this.health = health;
        this.maxDistance = max_distance;
        this.cost = cost;
    }
    Plane.prototype.purchasedCardHtml = function () {
        var div = document.createElement("div");
        div.className = "bg-light border-box";
        var dl = dataLabels([
            ["Name", "" + this.name],
            ["Status", "" + this.status],
            ["Max distance", "" + this.maxDistance],
            ["Health", this.health.toLocaleString("en-gb")],
        ]);
        var card = document.createElement("div");
        card.innerHTML = "<h3>" + this.name + " </h3>";
        card.appendChild(dl);
        div.appendChild(card);
        if (this.status.indexOf("aintenance") > -1) {
            card.appendChild(this.maintenanceHtml());
        }
        card.className = "flex flex-column justify-content-between " + this.status;
        card.appendChild(createParagraph(this.status));
        return div;
    };
    Plane.prototype.displayHtml = function () {
        var div = document.createElement("div");
        div.className = "flex";
        div.appendChild(dataLabels([
            ["id", String(this.id)],
            ["name", this.name],
            ["health", String(this.health)],
            ["maxDistance", String(this.maxDistance)],
        ]));
        return div;
    };
    Plane.prototype.maintenanceHtml = function () {
        var _this = this;
        var airline = gameEngine.airline;
        var div = this.displayHtml();
        var btn = document.createElement("button");
        btn.innerText = "Fix for $100,000";
        div.appendChild(btn);
        btn.addEventListener("click", makeClickWrapper(btn, function () {
            $.ajax({
                method: "POST",
                url: "/plane/fix",
                data: {
                    airlineId: airline.id,
                    planeId: _this.id
                },
                error: function (x) { return errHandler(x, btn); },
                success: function (response) {
                    var jresponse = JSON.parse(response);
                    airline.planes = jresponse.planes.map(function (p) { return new Plane(p); });
                    airline.cash = jresponse.cash;
                    airline.addTransaction(jresponse.transaction);
                    displayInfo(jresponse.msg);
                    gameEngine.displayFleetTab();
                    airline.updateStats();
                }
            });
        }));
        var btn = document.createElement("button");
        btn.innerText = "Sell to  Mojave scrapyard for $10,000";
        div.appendChild(btn);
        btn.addEventListener("click", makeClickWrapper(btn, function () {
            $.ajax({
                method: "POST",
                url: "/plane/scrap",
                data: {
                    airlineId: airline.id,
                    planeId: _this.id
                },
                error: function (x) { return errHandler(x, btn); },
                success: function (response) {
                    var jresponse = JSON.parse(response);
                    airline.planes = jresponse.planes.map(function (p) { return new Plane(p); });
                    airline.addTransaction(jresponse.transaction);
                    airline.cash = jresponse.cash;
                    displayInfo(jresponse.msg);
                    gameEngine.displayFleetTab();
                    airline.updateStats();
                }
            });
        }));
        return div;
    };
    return Plane;
}());
var Airline = /** @class */ (function () {
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
        placeholder.appendChild(this.statsHtml());
    };
    Airline.prototype.addTransaction = function (msg) {
        this.transactions.push(new Date() + " " + prettyCashString(this.cash) + " " + msg);
    };
    Airline.prototype.titleHtml = function () {
        return createTitle(this.name + "<strong>Hub: " + this.hub.code + "</strong> <strong> Joined: " + this.joined.toLocaleDateString() + " </strong>", "h2");
    };
    Airline.prototype.statsHtml = function () {
        var dl = dataLabels([
            ["Cash", prettyCashString(this.cash)],
            ["Planes", String(this.planes.length)],
            ["Routes", String(this.routes.length)],
            ["Popularity", String(this.popularity)],
            ["Rank", this.rank],
        ]);
        return dl;
    };
    Airline.prototype.getFleetDisplay = function () {
        var div = document.createElement("div");
        div.appendChild(createTitle("Your Fleet"));
        var planesContainer = document.createElement("div");
        this.planes.forEach(function (plane) {
            planesContainer.appendChild(plane.purchasedCardHtml());
        });
        div.appendChild(planesContainer);
        div.appendChild(createParagraph("You have " + this.planes.length + " planes in your fleet"));
        var airline = this;
        setLoader();
        $.ajax({
            method: "GET",
            url: "/offered_planes",
            data: {
                airlineId: airline.id
            },
            error: function (x) { return errHandler(x); },
            success: function (response) {
                JSON.parse(response).map(function (p) {
                    unsetLoader();
                    var plane = new Plane(p);
                    var button = document.createElement("button");
                    button.setAttribute("style", "margin: 0.5rem");
                    var airplaneCost = plane.cost;
                    div.appendChild(createParagraph("You can buy " + plane.name + ", which flies up to " + plane.maxDistance.toLocaleString("en-gb", { maximumFractionDigits: 0 }) + "km, for " + prettyCashString(airplaneCost)));
                    button.innerHTML = "Buy plane for " + prettyCashString(airplaneCost).toLocaleString();
                    button.addEventListener("click", function () {
                        var confirmed = confirm("Are you sure you want to buy " + plane.name + "?\nThis will cost " + prettyCashString(airplaneCost).toLocaleString());
                        if (!confirmed) {
                            return;
                        }
                        button.setAttribute("disabled", "");
                        button.innerHTML = "...";
                        $.ajax({
                            method: "POST",
                            url: "/purchase_plane",
                            data: {
                                airlineId: airline.id,
                                planeId: plane.id
                            },
                            error: function (x) { return errHandler(x); },
                            success: function (response) {
                                var r = JSON.parse(response);
                                displayInfo(r.msg);
                                airline.addTransaction(r.transaction);
                                airline.planes.push(new Plane(r.plane));
                                airline.updateStats(r.cash);
                                gameEngine.displayFleetTab();
                            }
                        });
                    });
                    div.appendChild(button);
                });
            }
        });
        return div;
    };
    Airline.prototype.getRoutesDisplay = function () {
        var routesContainer = document.getElementById("owned-routes");
        this.routes.forEach(function (route) {
            var div = document.getElementById("owned-route-" + route.id);
            if (!div) {
                routesContainer.appendChild(route.createPurchasedCardHtml());
            }
        });
        return routesContainer;
    };
    Airline.prototype.getReputationDisplay = function () {
        var div = document.createElement("div");
        var heading = document.createElement("h2");
        heading.innerHTML = "Reputation and Reviews";
        div.appendChild(heading);
        var p = document.createElement("p");
        var numStars = 0;
        if (this.popularity > 89) {
            p.innerText = "Customers favorite airline in " + this.hub.country + "!";
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
        var heading = document.createElement("h3");
        heading.innerHTML = "Finances";
        div.appendChild(heading);
        this.transactions.forEach(function (t) {
            div.appendChild(createParagraph(t));
        });
        return div;
    };
    Airline.prototype.getAccidentsDisplay = function () {
        var div = document.createElement("div");
        var heading = document.createElement("h2");
        heading.innerHTML = "Accidents";
        div.appendChild(heading);
        this.incidents.forEach(function (t) {
            div.appendChild(createParagraph(t));
        });
        return div;
    };
    return Airline;
}());
var GameEngine = /** @class */ (function () {
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
    GameEngine.prototype.progressDay = function () {
        this.days += 1;
        this.today.setDate(this.today.getDate() + 1);
    };
    GameEngine.prototype.loadAirports = function () {
        if (this.airports.length === 0) {
            var airs = this.airports;
            var ge = this;
            setLoader();
            $.ajax({
                url: "/airports",
                error: function (x) { return errHandler(x); },
                success: function (response) {
                    unsetLoader();
                    airs = JSON.parse(response).map(function (a) { return new Airport(a); });
                    ge.airports = airs;
                    loadHubSelect(airs);
                }
            });
        }
    };
    GameEngine.prototype.hideTabs = function (except) {
        ["overview", "fleet", "routes", "reputation", "finance", "accidents"].forEach(function (k) {
            if (k === except) {
                $("#main-" + k).show();
            }
            else {
                $("#main-" + k).hide();
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
        main.appendChild(airline.getReputationDisplay());
        main.appendChild(airline.getAccidentsDisplay());
    };
    GameEngine.prototype.displayFleetTab = function () {
        this.hideTabs("fleet");
        var main = document.getElementById("main-fleet");
        main.innerHTML = "";
        var airline = this.airline;
        main.appendChild(airline.getFleetDisplay());
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
                airlineId: airline.id
            },
            error: function (x) { return errHandler(x); },
            success: function (response) {
                unsetLoader();
                offered.innerHTML = "";
                var routesToDisplay = JSON.parse(response).map(function (r) { return new OfferedRoute(r); });
                routesToDisplay.forEach(function (r) { return offered.appendChild(r.buttonHtml()); });
            }
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
            createElement("button", "viewCompany", "flex-grow dark", "Overview of " + this.airline.name),
            createElement("button", "viewFleet", "flex-grow dark", "Overview of Fleet"),
            createElement("button", "viewRoutes", "flex-grow dark", "Overview of Routes"),
            createElement("button", "viewReputation", "flex-grow dark", "Overview of Reputation"),
            createElement("button", "viewFinance", "flex-grow dark", "Overview of Finance"),
            createElement("button", "viewAccidents", "flex-grow dark", "Overview of Accidents"),
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
//////// SETUP
var gameEngine = new GameEngine();
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
        opt.textContent = airport.name + " (" + airport.code + ")";
        hubSelect.appendChild(opt);
        return opt;
    });
    hubRow.appendChild(hubLabel);
    hubRow.appendChild(hubSelect);
}
window.onload = function () {
    // Creating form to enter business name and to choose hub
    var form = document.getElementById("playForm");
    var nameRow = document.createElement("div");
    var nameLabel = document.createElement("label");
    nameLabel.setAttribute("for", "businessName");
    nameLabel.textContent = "What is your airline called?";
    var nameInput = document.createElement("input");
    nameInput.setAttribute("type", "text");
    nameInput.setAttribute("name", "businessName");
    nameInput.setAttribute("required", "");
    nameRow.appendChild(nameLabel);
    nameRow.appendChild(nameInput);
    var hubRow = document.createElement("div");
    hubRow.setAttribute("id", "hubRow");
    var playBtn = document.createElement("button");
    playBtn.setAttribute("type", "submit");
    playBtn.textContent = "Play Now";
    playBtn.className = "primary";
    form.innerHTML = "";
    form.appendChild(nameRow);
    form.appendChild(hubRow);
    form.appendChild(playBtn);
    nameInput.setAttribute("value", randomBusinessName());
    form.addEventListener("submit", function (e) {
        var hubSelect = document.getElementById("hubSelect");
        e.preventDefault();
        hideElement(form);
        setLoader();
        $.ajax({
            method: "POST",
            url: "/play",
            data: {
                businessName: nameInput.value,
                hub: hubSelect.value
            },
            error: function (x) { return errHandler(x); },
            success: function (response) {
                unsetLoader();
                // console.log(response)
                var airline = new Airline(JSON.parse(response));
                console.log('Logged in, airline=', airline);
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
