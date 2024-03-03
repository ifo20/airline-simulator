//////// HELPING FUNCTIONS
function defaultErrHandler(btn?: HTMLButtonElement) {
	function handler(err: JQuery.jqXHR<any>) {
		console.log("Default error handler was called", err)
		displayError(err.responseText)
		if (btn) {
			btn.removeAttribute("disabled")
		}
	}
	return handler
}
function randomBusinessName(): string {
	var adjectives: Array<string> = ["Easy", "Budget", "Trusty", "Speedy", "Enigmatic", "Fly", "Golden", "Sturdy", "Graceful", "Rapid", "Robust", "American", "British", "Asian", "European", "Indian", "Italian", "Australian", "Chinese", "Russian", "Nordic", "Southern", "Northern", "Southwest", "Paper", "Malaysian", "Thai", "Smile", ""]
	var nouns: Array<string> = ["Airways", "Skies", "Air", "Airlines", "Flyers", "Jets", "Pilots", "Air Transport", "Helicopters", "Cargo", "Regional", "Express"]
	var name: string = `${randomChoice(adjectives)} ${randomChoice(nouns)}`
	if (Math.random() < 0.3) {
		var name = randomChoice(adjectives) + ' ' + name
	}
	return name
}
function prettyCashString(cash: number): string {
	return "$" + cash.toLocaleString("en-gb", { maximumFractionDigits: 0, currency: "usd" })
}
function randomChoice(things: Array<any>): any {
	return things[Math.floor(Math.random() * things.length)];
}
function displayInfo(message: string): void {
	var div = <HTMLElement>document.getElementById("info")
	var span = document.createElement("span")
	span.classList.add("fade-in")
	span.innerHTML = message
	setTimeout(() => {
		span.classList.add("fade-out")
		setTimeout(() => {
			span.remove()
		}, 1000)
	}, 5000)
	div.appendChild(span)
}
function displayError(message: string): void {
	var div = <HTMLElement>document.getElementById("error")
	var span = document.createElement("span")
	span.classList.add("fade-in")
	span.innerHTML = message
	setTimeout(() => {
		span.classList.add("fade-out")
		setTimeout(() => {
			span.remove()
		}, 1000)
	}, 5000)
	div.appendChild(span)
}
function dataLabels(rows: Array<Array<string>>): HTMLDListElement {
	var elem = document.createElement("dl")
	rows.forEach(r => {
		var dt = document.createElement("dt")
		dt.innerHTML = r[0]
		var dd = document.createElement("dd")
		dd.innerHTML = r[1]
		elem.appendChild(dt)
		elem.appendChild(dd)
	})
	return elem
}
function listLabels(rows: Array<Array<String>>): HTMLElement {
	var elem = document.createElement("ul")
	rows.forEach(r => {
		var li = document.createElement("li")
		li.innerHTML = `<strong>${r[0]}:</strong>${r[1]}`
		elem.appendChild(li)
	})
	return elem
}
type createElementOptions = {
	id?: string
	class?: string
	innerHTML?: string
	innerText?: string
}
function createElement(elementType: string, options: createElementOptions) {
	var e = document.createElement(elementType)
	if (options.id) {
		e.setAttribute("id", options.id)
	}
	if (options.class) {
		e.setAttribute("class", options.class)
	}
	if (options.innerText) {
		e.innerText = options.innerText
	}
	if (options.innerHTML) {
		e.innerHTML = options.innerHTML
	}
	return e
}
function createSpinner(parent: HTMLElement): HTMLElement {
	var spinner = createElement("div", {class:"spinner"})
	parent.appendChild(spinner)
	return spinner
}
function createTitleBanner(innerHTML: string, elementType: string = "h1"): HTMLElement {
	return createElement(elementType, {innerHTML, class: "bgwf p-2 mb-1"})
}
function hideElement(elem: HTMLElement): void {
	elem.style.display = 'none'
}
function makeClickable(btn: HTMLButtonElement, onClick: (ev: MouseEvent)=> any) {
	function listener(this: void, ev: MouseEvent) {
		btn.setAttribute("disabled", "")
		btn.innerText = ""
		createSpinner(btn)
		onClick(ev)
		return this
	}
	btn.addEventListener("click", listener);
}
function addPolylineToMap(map: H.Map, startinglat: number, startinglon: number, endinglat: number, endinglon: number) {
    var lineString = new H.geo.LineString();

    lineString.pushPoint({lat:startinglat, lng:startinglon});
    lineString.pushPoint({lat:endinglat, lng:endinglon});

    map.addObject(new H.map.Polyline(
      lineString, { style: { lineWidth: 4 }}
    ));
}

type AirlineReputationResponse = { airline_reputation: string, num_stars: number }
//////// A request client: A typescript version of client/__init__.py
class RequestClient {
	engine: GameEngine
	constructor(engine: GameEngine) {
		this.engine = engine
	}
	getAirports(callback: (arg0: Airport[]) => any) {
		$.ajax({
			method: "GET",
			url: "/airports",
			success: (response: string) => callback(<Airport[]>JSON.parse(response)),
			error: defaultErrHandler(),
		})
	}
	getReputation(airline_id: number, callback: (arg0:AirlineReputationResponse) => any) {
		$.ajax({
			method: "GET",
			url: `/reputation/${airline_id}`,
			success: (response: string) => callback(<AirlineReputationResponse>JSON.parse(response)),
			error: defaultErrHandler(),
		})
	}
	purchaseRoute(
		airline_id: number,
		route_id: number,
		onSuccess : JQuery.Ajax.SuccessCallback<any>,
		onError: JQuery.Ajax.ErrorCallback<any>) {
			console.log('PR ajaxing', onSuccess)
		$.ajax({
			method: "POST",
			url: "/purchase_route",
			data: {
				airline_id,
				route_id,
			},
			success: onSuccess,
			error: onError,
		})
	}
	purchasePlane(
		airline_id: number,
		plane_id: number,
		onSuccess : JQuery.Ajax.SuccessCallback<any>,
		onError: JQuery.Ajax.ErrorCallback<any>,
	) {
		$.ajax({
			method: "POST",
			url: "purchase_plane",
			data: {
				airline_id,
				plane_id,
			},
			success: onSuccess,
			error: onError,
		})
	}
	fixPlane(
		airline_id: number,
		plane_id: number,
		onSuccess : JQuery.Ajax.SuccessCallback<any>,
		onError: JQuery.Ajax.ErrorCallback<any>,
	) {
		$.ajax({
			method: "POST",
			url: "/plane/fix",
			data: {
				airline_id,
				plane_id,
			},
			success: onSuccess,
			error: onError,
		})
	}
	scrapPlane(airline_id: number, plane_id: number, onSuccess: JQuery.Ajax.SuccessCallback<any>, onError: JQuery.Ajax.ErrorCallback<any>) {
		$.ajax({
			method: "POST",
			url: "/plane/scrap",
			data: {
				airline_id,
				plane_id,
			},
			success: onSuccess,
			error: onError,
		})
	}
	upgradeFuelEfficiency(airline_id: number, from_level: number) {
		var engine = this.engine;
		$.ajax({
			method: "POST",
			url: "/upgrade_fuel_efficiency",
			data: {
				airline_id,
				from_level,
			},
			success: function(response) {
				const { cash, transaction } = JSON.parse(response)
				gameEngine.airline.cash = cash
				gameEngine.airline.addTransaction(transaction)
				gameEngine.airline.updateStats()
				engine.displayUpgradesTab()
			},
			error: defaultErrHandler(),
		})
	}
}
//////// OUR TYPES & CLASSES (THINGS)
type AirportCode = string

class Airport {
	code: AirportCode
	name: string
	country: string
	lat: number
	lon: number
	popularity: number
	constructor(data: any) {
		const { code, name, country, lat, lon, popularity } = data
		this.code = <AirportCode>code
		this.name = name
		this.country = country
		this.lat = lat
		this.lon = lon
		this.popularity = popularity
	}
}

class OfferedRoute {
	id: number
	distance: number
	fromAirport: Airport
	toAirport: Airport
	popularity: number
	purchaseCost: number
	constructor(data: { id: any; distance: any; origin: any; destination: any; popularity: any; cost: any; }) {
		const { id, distance, origin, destination, popularity, cost } = data
		this.id = id
		this.distance = distance
		this.fromAirport = origin
		this.toAirport = destination
		this.popularity = popularity
		this.purchaseCost = cost
	}
	trHtml(): HTMLTableRowElement {
		var tr = <HTMLTableRowElement>createElement("tr", {class: "bg-offered"})
		// title - distance - popularity - cost
		tr.appendChild(createElement("td", {innerHTML: `${this.fromAirport.code} <-> ${this.toAirport.code}`}))
		tr.appendChild(createElement("td", {innerHTML:`${this.distance.toLocaleString("en-gb", { maximumFractionDigits: 0 })}km`}))
		tr.appendChild(createElement("td", {innerHTML:this.popularity.toLocaleString("en-gb")}))
		tr.appendChild(createElement("td", {innerHTML:this.purchaseCost.toLocaleString("en-gb")}))
		tr.appendChild(createElement("td", {}))
		var btn = <HTMLButtonElement>createElement("button", {innerText: "Purchase"})
		var btnCell = document.createElement("td")
		var route_id = this.id
		var onSuccess = (response: any) => {
			var airline = <Airline>gameEngine.airline
			var jresponse = JSON.parse(response)
			var route = new Route(jresponse.route)
			airline.routes.push(route)
			airline.cash = jresponse.cash
			airline.addTransaction(jresponse.transaction)
			displayInfo(jresponse.msg)
			airline.getRoutesDisplay()
			airline.updateStats()
			gameEngine.displayRoutesTab()
		}
		function onClick(ev: MouseEvent) {
			var airline = <Airline>gameEngine.airline
			client.purchaseRoute(airline.id, route_id, onSuccess, defaultErrHandler(btn))
		}
		makeClickable(btn, onClick)
		btnCell.appendChild(btn)
		tr.appendChild(btnCell)
		return tr
	}
}
class Route {
	id: number
	distance: number
	fromAirport: Airport
	toAirport: Airport
	popularity: number
	purchaseCost: number
	lastRunAt?: Date
	lastResultedAt?: Date
	nextAvailableAt?: Date
	status: string
	constructor(data: { id: any; distance: any; origin: any; destination: any; popularity: any; cost: any; last_run_at: any; last_resulted_at: any; next_available_at: any; status: any; }) {
		const { id, distance, origin, destination, popularity, cost, last_run_at, last_resulted_at, next_available_at, status } = data
		this.id = id
		console.log('created route id', this.id)
		this.fromAirport = origin
		this.toAirport = destination
		this.distance = distance
		this.popularity = popularity
		this.purchaseCost = cost
		this.lastRunAt = last_run_at ? new Date(last_run_at) : null
		this.lastResultedAt = last_resulted_at ? new Date(last_resulted_at): null
		this.nextAvailableAt = next_available_at ? new Date(next_available_at) : null
		this.status = status || "ready"
		console.log("Created Route", this.status, data)
	}
	timeRemaining(): number {
		if (!this.nextAvailableAt) {
			return 0
		}
		var now = new Date()
		var secondsTilNextAvailable = Math.ceil((+this.nextAvailableAt + -now) / 1000)
		return Math.max(0, secondsTilNextAvailable)
	}
	run(btn: HTMLButtonElement): boolean {
		var airline = <Airline>gameEngine.airline
		var route = this
		console.log("Route.run route=", route)
		$.ajax({
			method: "POST",
			url: "/fly_route",
			data: {
				airline_id: airline.id,
				route_id: this.id,
			},
			error: (x) => {
				defaultErrHandler(btn)(x)
				route.updatePurchasedCardContent()
			},
			success: function(response) {
				var jresponse = JSON.parse(response)
				route.status = jresponse.status
				route.lastRunAt = new Date(jresponse.last_run_at)
				route.nextAvailableAt = new Date(jresponse.next_available_at)
				airline.planes = jresponse.planes.map((p: any) => new Plane(p))
				airline.updateStats()
				route.updatePurchasedCardContent()
				displayInfo(jresponse.msg)
			}
		})
		return true
	}
	getResults(btn: HTMLButtonElement) {
		var airline = <Airline>gameEngine.airline
		var route = this
		$.ajax({
			method: "POST",
			url: "/collect",
			data: {
				airline_id: airline.id,
				route_id: this.id,
			},
			error: (x) => {
				defaultErrHandler(btn)(x)
				route.updatePurchasedCardContent()
			},
			success: function(response) {
				var jresponse = JSON.parse(response)
				displayInfo(jresponse.msg)
				if (jresponse.incident) {
					displayInfo(jresponse.incident)
					airline.incidents.push(jresponse.incident)
				}
				airline.addTransaction(jresponse.transaction)
				route.status = jresponse.status
				airline.planes = jresponse.planes.map((p: any) => new Plane(p))
				airline.popularity = jresponse.popularity
				airline.updateStats(jresponse.cash)
				route.updatePurchasedCardContent()

			}
		})
	}
	updatePurchasedCardContent() {
		var div = document.getElementById(`owned-route-${this.id}`)
		if (!div) {
			console.log("Failed to find element", `owned-route-${this.id}`)
			setTimeout(() => this.updatePurchasedCardContent(), 1000)
			return
		}
		div.innerHTML = ""
		var titleCell = document.createElement("td")
		titleCell.innerHTML = `${this.fromAirport.code} <-> ${this.toAirport.code}`
		div.appendChild(titleCell)

		var distanceCell = document.createElement("td")
		distanceCell.innerHTML = `${this.distance.toLocaleString("en-gb", { maximumFractionDigits: 0 })}km`
		div.appendChild(distanceCell)

		var popularityCell = document.createElement("td")
		popularityCell.innerHTML = this.popularity.toLocaleString("en-gb")
		div.appendChild(popularityCell)

		var costCell = document.createElement("td")
		costCell.innerHTML = `$${this.purchaseCost.toLocaleString("en-gb")}`
		div.appendChild(costCell)

		var actionButton = document.createElement("button")
		actionButton.className = "text-center w-100"
		var statusText = ""
        console.log('updatePurchasedCardContent', this.status);
		if (this.timeRemaining()) {
			actionButton.setAttribute("disabled", "")
			actionButton.innerHTML = "Collect Results"
			statusText = `Current route running, ready in ${this.timeRemaining()} seconds`
			setTimeout(() => this.updatePurchasedCardContent(), 1000)
		} else if (this.status === "ready") {
			statusText = "Ready to run!"
			makeClickable(actionButton, (ev:MouseEvent) => this.run(actionButton))
			actionButton.innerHTML = "Run Route"
		} else if (this.status === "landed") {
			statusText = `Landed at ${this.toAirport.code}!`
			makeClickable(actionButton, (ev:MouseEvent) => this.getResults(actionButton))
			actionButton.innerHTML = "Collect Route"
			actionButton.classList.add("collectable")
		} else {
			statusText = "Retrieving status..."
			actionButton.innerHTML = ""
			var route = this
			$.ajax({
				method: "GET",
				url: `/route/${this.id}`,
				data: {},
				error: defaultErrHandler(actionButton),
				success: function(response) {
					var jresponse = JSON.parse(response)
					route.status = jresponse.status
					route.updatePurchasedCardContent()
				}
			})
			return
		}
		var statusDiv = createElement("td", {id:`route-status-${this.id}`, class: "text-center"})
		statusDiv.innerText = statusText
		div.appendChild(statusDiv)
		var actionButtonCell = document.createElement("td")
		actionButtonCell.appendChild(actionButton)
		div.appendChild(actionButtonCell)
	}
	createPurchasedCardHtml(): HTMLDivElement {
		var tr = <HTMLTableRowElement>createElement("tr", {id:`owned-route-${this.id}`})

		//create dom icon and add/remove opacity listeners
		var domIcon = new H.map.DomIcon(tr, {
		// the function is called every time marker enters the viewport
		onAttach: function(clonedElement, domIcon, domMarker) {
			// // Create an info bubble object at a specific geographic location:
			var bubble = new H.ui.InfoBubble({ lng: this.toAirport.lon, lat: this.toAirport.lat }, {
				content: `<b>Route from ${this.fromAirport.name} to ${this.toAirport.name}</b>`
			});

			// // Add info bubble to the UI:
			gameEngine.ui.addBubble(bubble);

		},
		// the function is called every time marker leaves the viewport
		onDetach: function(clonedElement, domIcon, domMarker) {
		}
		});

		var marker = new H.map.Marker({lat:this.toAirport.lat, lng:this.toAirport.lon});
		gameEngine.routeMap.addObject(marker);
		addPolylineToMap(gameEngine.routeMap, this.fromAirport.lat,  this.fromAirport.lon, this.toAirport.lat, this.toAirport.lon)


		setTimeout(() => this.updatePurchasedCardContent(), 100)
		return tr
	}
}

class Plane {
	id: number
	name: string
	status: string
	health: number
	maxDistance: number
	cost: number
	requiresFix: boolean
	fixCost?: number
	scrapValue: number
	constructor(data: { id: any; name: any; status: any; health: any; max_distance: any; cost: any; requires_fix: boolean; fix_cost?: number; scrap_value: number }) {
		const { id, name, status, health, max_distance, cost, requires_fix, fix_cost, scrap_value } = data
		this.id = id
		this.name = name
		this.status = status
		this.health = health
		this.maxDistance = max_distance
		this.cost = cost
		this.requiresFix = requires_fix
		this.fixCost = fix_cost
		this.scrapValue = scrap_value
	}
	purchasedCardHtml(): HTMLElement {
		var tr = createElement("tr", {class: "bgw"})
		tr.appendChild(createElement("td", {innerHTML: this.name}))
		tr.appendChild(createElement("td", {innerHTML: this.maxDistance.toLocaleString("en-gb", { maximumFractionDigits: 0 }) + "km"}))
		tr.appendChild(createElement("td", {innerHTML: prettyCashString(this.cost)}))
		tr.appendChild(createElement("td", {innerHTML: this.status}))
		tr.appendChild(createElement("td", {innerHTML: this.health.toLocaleString("en-gb")}))
		var td = createElement("td", {})
		if (this.requiresFix) {
			td.appendChild(this.maintenanceHtml())
		}
		tr.appendChild(td)
		return tr

	}
	maintenanceHtml(): HTMLElement {
		var airline = <Airline>gameEngine.airline
		var div = createElement("div", {class: "flex"})
		var btn = <HTMLButtonElement>createElement("button", {innerText: `Fix for ${prettyCashString(this.fixCost)}`})
		div.appendChild(btn)
		function onFixSuccess(response: string) {
			var jresponse = JSON.parse(response)
			airline.planes = jresponse.planes.map((p: any) => new Plane(p))
			airline.cash = jresponse.cash
			airline.addTransaction(jresponse.transaction)
			displayInfo(jresponse.msg)
			gameEngine.displayFleetTab()
			airline.updateStats()
		}
		makeClickable(btn, (ev: MouseEvent) => {
			client.fixPlane(airline.id, this.id, onFixSuccess, defaultErrHandler(btn))
		})
		var btn = <HTMLButtonElement>createElement("button", {innerText: `Sell to  Mojave scrapyard for ${prettyCashString(this.scrapValue)}`})
		div.appendChild(btn)
		function onScrapSuccess(response: string) {
			var jresponse = JSON.parse(response)
			airline.planes = jresponse.planes.map((p: any) => new Plane(p))
			airline.addTransaction(jresponse.transaction)
			airline.cash = jresponse.cash
			displayInfo(jresponse.msg)
			gameEngine.displayFleetTab()
			airline.updateStats()
		}
		makeClickable(btn, (ev: MouseEvent) => {
			client.scrapPlane(airline.id, this.id, onScrapSuccess, defaultErrHandler(btn))
		})
		return div
	}
}
type Transaction = {
	ts: string
	starting_cash: number
	amount: number
	description: string
}
class Airline {
	id: number
	name: string
	hub: Airport
	joined: Date
	cash: number
	rank: string
	planes: Array<Plane> = []
	routes: Array<Route> = []
	popularity: number
	transactions: Array<Transaction> = []
	incidents: Array<string> = []
	constructor(data: any) {
		const { id, name, hub, joined_at, cash, rank, planes, routes, popularity, transactions, incidents } = data
		this.id = id
		this.name = name
		this.hub = hub
		this.joined = new Date(joined_at)
		this.cash = cash
		this.rank = rank
		this.planes = (planes || []).map((p: any) => new Plane(p))
		this.routes = (routes || []).map((r: any) => new Route(r))
		this.popularity = popularity
		this.transactions = transactions || []
		this.incidents = incidents || []

	}
	updateTitle(): void {
		var div = <HTMLElement>document.getElementById("airlineTitle")
		div.appendChild(createElement("h2", {innerText: this.name}))
		div.appendChild(createElement("h4", {innerText: `Hub: ${this.hub.code}`}))

	}
	updateStats(cash: number =null): void {
		if (cash !== null ) {
			this.cash = cash
		}
		const placeholder = <HTMLElement>document.getElementById("airlineStats")
		placeholder.innerHTML = ""
		placeholder.appendChild(dataLabels([
			["Cash", prettyCashString(this.cash)],
			["Popularity", String(this.popularity)],
		]))
	}
	addTransaction(t: Transaction): void {
		this.transactions.push(t)
	}
	statsHtml(): HTMLElement {
		var div = createElement("div", {class: "m-2 p-3 bgwf secondary-card"})
		var dl = dataLabels([
			["Cash", prettyCashString(this.cash)],
			["Planes", String(this.planes.length)],
			["Routes", String(this.routes.length)],
			["Popularity", String(this.popularity)],
			["Rank", this.rank],
			["Joined", this.joined.toLocaleDateString()],
		])
		div.appendChild(dl)
		return div
	}
	getFleetDisplay(): void {
		var header = <HTMLElement>document.getElementById("fleet-header")
		header.innerHTML = ""
		var owned_tbody = <HTMLElement>document.getElementById("owned-planes")
		var offered_tbody = <HTMLElement>document.getElementById("offered-planes")
		owned_tbody.innerHTML = ""
		offered_tbody.innerHTML = ""
		header.appendChild(createTitleBanner("Your Fleet"))
		this.planes.forEach(plane => {
			owned_tbody.appendChild(plane.purchasedCardHtml())
		})

		header.appendChild(createElement("p", {innerText: `You have ${this.planes.length} planes in your fleet`, class:"m-2 p-3 bgwf secondary-card"}))
		var airline = this
		$.ajax({
			method: "GET",
			url: "/offered_planes",
			data: {
				airline_id: airline.id
			},
			success: function(response) {
				JSON.parse(response).map((p: any) => {
					var tr = createElement("tr", {class: "bg-offered"})
					var plane = new Plane(p)
					const airplaneCost = plane.cost
					var btn = <HTMLButtonElement>createElement("button", {innerHTML: `Buy plane for ${prettyCashString(airplaneCost).toLocaleString()}`})
					function onSuccess(response: string) {
						var r = JSON.parse(response)
						displayInfo(r.msg)
						airline.addTransaction(r.transaction)
						airline.planes.push(new Plane(r.plane))
						airline.updateStats(r.cash)
						gameEngine.displayFleetTab()
					}
					makeClickable(btn, (ev: MouseEvent) => {
						client.purchasePlane(airline.id, plane.id, onSuccess, defaultErrHandler(btn))
					})
					tr.appendChild(createElement("td", {innerHTML: plane.name}))
					const maxDistanceString = plane.maxDistance.toLocaleString("en-gb", { maximumFractionDigits: 0 }) + "km"
					tr.appendChild(createElement("td", {innerHTML: maxDistanceString}))
					tr.appendChild(createElement("td", {innerHTML: prettyCashString(airplaneCost)}))
					tr.appendChild(createElement("td", {innerHTML: ""})) // status: n/a
					tr.appendChild(createElement("td", {innerHTML: ""})) // health: n/a
					var td = createElement("td", {})
					td.appendChild(btn)
					tr.appendChild(td)
					offered_tbody.appendChild(tr)
				})
			},
			error: defaultErrHandler()
		})
	}
	getRoutesDisplay(): HTMLElement {
		const routesContainer = <HTMLElement>document.getElementById("owned-routes")
		this.getMap();
		this.routes.forEach(route => {
			var div = document.getElementById(`owned-route-${route.id}`)
			if (!div) {
				routesContainer.appendChild(route.createPurchasedCardHtml())
			}
		})
		return routesContainer
	}
	getReputationDisplay(): HTMLElement {
		console.log('getReputationDisplay')
		var container = document.createElement("div")
		var heading = createTitleBanner("Reputation and Reviews")
		container.appendChild(heading)
		var div = createElement("div", {class: "m-2 p-3 bgwf secondary-card"})
		var airline = this
		var spinner = createSpinner(div)
		container.appendChild(div)		
		const callback = (response: AirlineReputationResponse) => {
			console.log('getReputationDisplay callback', response)
			spinner.remove()
			for (var i = 0; i < 5; i++) {
				var span = document.createElement("span")
				span.className = "fa fa-star"
				if (i < response.num_stars) {
					span.classList.add("checked")
				}
				div.appendChild(span)
			}
			var p = createElement("p", {class: "", innerText: response.airline_reputation})
			div.appendChild(p)
		}
		client.getReputation(airline.id, callback)
		console.log('getReputationDisplay returning container')
		return container
	}
	getFinanceDisplay(): HTMLElement {
		var div = document.createElement("div")
		var heading = createTitleBanner("Finances")
		div.appendChild(heading)
		var tbl = createElement("table", {class: "table w-100"})
		var thead = createElement("thead", {})
		var theadrow = createElement("tr", {})
		theadrow.appendChild(createElement("th", {innerText: "Time"}))
		theadrow.appendChild(createElement("th", {innerText: "Cash Balance"}))
		theadrow.appendChild(createElement("th", {innerText: "Cash in"}))
		theadrow.appendChild(createElement("th", {innerText: "Cash out"}))
		theadrow.appendChild(createElement("th", {innerText: "Description"}))
		thead.appendChild(theadrow)
		tbl.appendChild(thead)
		var tbody = createElement("tbody", {})
		this.transactions.forEach(t => {
			var tr = createElement("tr", {class: "bgw"})
			var td = createElement("td", {innerText: t.ts, class: "text-left"})
			tr.appendChild(td)
			var td = createElement("td", {innerText: prettyCashString(t.starting_cash), class: "text-right"})
			tr.appendChild(td)
			var td = createElement("td", {innerText: t.amount > 0 ? prettyCashString(t.amount) : "", class: "text-right"})
			tr.appendChild(td)
			var td = createElement("td", {innerText: t.amount > 0 ? "" : prettyCashString(t.amount), class: "text-right"})
			tr.appendChild(td)
			var td = createElement("td", {innerText: t.description, class: "text-left"})
			tr.appendChild(td)
			tbody.appendChild(tr)
		})
		tbl.appendChild(tbody)
		div.appendChild(tbl)
		return div
	}
	getAccidentsDisplay(): HTMLElement {
		var div = document.createElement("div")
		var heading = createTitleBanner("Accidents")
		div.appendChild(heading)
		var tbl = createElement("table", {})
		var tbody = createElement("tbody", {})
		this.incidents.forEach(t => {
			var tr = createElement("tr", {class: "bgw"})
			var td = createElement("td", {innerText: t, class: "text-left"})
			tr.appendChild(td)
			tbody.appendChild(tr)
		})
		tbl.appendChild(tbody)
		div.appendChild(tbl)
		return div
	}
	getMap(): H.Map {
		if (!gameEngine.routeMap) {
			var platform = new H.service.Platform({
				'apikey': 'neEmKYaMLvpsoM_LWP-j9qFEtsMLiBeDI9Ajqxu99Js'
				// 'apikey': 'r7U4pzaJCQZVOL0cJLmpjQz0Sqzf3Wlq7LJwg3fbvik'
			});
			var defaultLayers = platform.createDefaultLayers();
			//Step 2: initialize a map - centered over our hub
			var map = new H.Map(document.getElementById('map'),
			defaultLayers.vector.normal.map,{
				center: {lat: this.hub.lat, lng:this.hub.lon},
				zoom: 3,
				pixelRatio: window.devicePixelRatio || 1
			});
			gameEngine.ui = H.ui.UI.createDefault(map, defaultLayers);
			map.setBaseLayer(defaultLayers.raster.satellite.map);
			// MapEvents enables the event system
			// Behavior implements default interactions for pan/zoom (also on mobile touch environments)
			var behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
			// add a resize listener to make sure that the map occupies the whole container
			window.addEventListener('resize', () => map.getViewPort().resize());
			gameEngine.routeMap = map
			setTimeout(() => {
				var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path fill="#f28bc1" d="M1.9 32c0 13.1 8.4 24.2 20 28.3V3.7C10.3 7.8 1.9 18.9 1.9 32z"/><path fill="#ed4c5c" d="M61.9 32c0-13.1-8.3-24.2-20-28.3v56.6c11.7-4.1 20-15.2 20-28.3"/><path fill="#fff" d="M21.9 60.3c3.1 1.1 6.5 1.7 10 1.7s6.9-.6 10-1.7V3.7C38.8 2.6 35.5 2 31.9 2s-6.9.6-10 1.7v56.6"/></svg>'
				var marker = new H.map.Marker({
					lat:this.hub.lat,
					lng:this.hub.lon,
				}, {
					// icon: new H.map.Icon(svg)
				});
				map.addObject(marker);
			}, 3000);
		}
		return gameEngine.routeMap
	}
}

class GameEngine {
	airline?: Airline
	routeMap?: H.Map
	ui?: any
	airports: Array<Airport> = []
	routes: Array<Route> = []
	days: number = 0
	today: Date = new Date()
	registerAirline(airline: Airline): void {
		this.airline = airline
		displayInfo("Please Choose your new route.")
		this.displayRoutesTab()
	}
	hideTabs(except: string): void {
		["overview", "fleet", "routes", "reputation", "finance", "accidents","upgrades"].forEach(k => {
			if (k === except) {
				$(`#main-${k}`).show()
			} else {
				$(`#main-${k}`).hide()
			}
		})
	}
	displaySummaryTab(): void {
		this.hideTabs("overview")
		const main = <HTMLElement>document.getElementById("main-overview")
		main.innerHTML = ""
		var airline = <Airline>this.airline
		var heading = createTitleBanner(airline.name)
		main.appendChild(heading)
		main.appendChild(airline.statsHtml())
		main.appendChild(airline.getReputationDisplay())
		main.appendChild(airline.getAccidentsDisplay())
		// TODO iain: This doesn't work - looks like we can only have one map?
		// We could make it a show-able thing on every screen, rather than having it belong to Routes tab
		airline.getMap()
	}
	displayFleetTab(): void {
		this.hideTabs("fleet")
		var airline = <Airline>this.airline
		airline.getFleetDisplay()
	}
	displayRoutesTab(): void {
		this.hideTabs("routes")
		var airline = <Airline>this.airline
		airline.getRoutesDisplay()
		const offered = <HTMLElement>document.getElementById("offered-routes")
		$.ajax({
			method: "GET",
			url: "/offered_routes",
			data: {
				airline_id: airline.id,
			},
			success: function(response) {
				offered.innerHTML = ""
				var routesToDisplay = JSON.parse(response).map((r: any) => new OfferedRoute(r))
				routesToDisplay.forEach((r: OfferedRoute) => offered.appendChild(r.trHtml()))
			},
			error: defaultErrHandler(),
		})
	}
	displayUpgradesTab(): void {
		this.hideTabs("upgrades")
		var airline = <Airline>this.airline
		const main = <HTMLElement>document.getElementById("main-upgrades")
		main.innerHTML = ""
		$.ajax({
			method: "GET",
			url: "/upgrades",
			data: {
				airline_id: airline.id,
			},
			success: function(response) {
				const parentContainer = createElement("div", {class: ""})
				const upgradeCategories = JSON.parse(response).forEach((category: { [x: string]: any; }) => {
					const categoryContainer = createElement("div", {class: "m-2 p-3 bgwf secondary-card"})
					categoryContainer.appendChild(createElement("h2", {innerText: category["title"], class:"mb-1"}))
					categoryContainer.appendChild(createElement("p", {innerText: `Level ${category["current_level"]}`}))
					categoryContainer.appendChild(createElement("p", {innerText: category["description"]}))
					categoryContainer.appendChild(createElement("p", {innerText: category["upgrade_description"]}))
					const btn_class = category["upgrade_enabled"] ? "" : "disabled"
					const btn = <HTMLButtonElement>createElement("button", {innerText: category["button_text"], class: btn_class})

					if (category["upgrade_enabled"]) {
						makeClickable(btn, (ev) => {
							client.upgradeFuelEfficiency(airline.id, category["fuel_efficiency_level"])
						})
					} else {
						btn.setAttribute("disabled", "")
					}
					categoryContainer.appendChild(btn)
					parentContainer.appendChild(categoryContainer)
				})
				main.appendChild(parentContainer)
			},
			error: defaultErrHandler()
		})
	}
	displayReputationTab(): void {
		this.hideTabs("reputation")
		const main = <HTMLElement>document.getElementById("main-reputation")
		main.innerHTML = ""
		var airline = <Airline>this.airline
		main.appendChild(airline.getReputationDisplay())
	}
	displayFinanceTab(): void {
		this.hideTabs("finance")
		const main = <HTMLElement>document.getElementById("main-finance")
		main.innerHTML = ""
		var airline = <Airline>this.airline
		main.appendChild(airline.getFinanceDisplay())
	}
	displayAccidentsTab(): void {
		this.hideTabs("accidents")
		const main = <HTMLElement>document.getElementById("main-accidents")
		main.innerHTML = ""
		var airline = <Airline>this.airline
		main.appendChild(airline.getAccidentsDisplay())
	}
	gameOver(): void {
		const main = <HTMLElement>document.getElementById("main")
		main.innerHTML = "<h1 style='color:red;'>GAMEOVER</h1>"
	}
	createTopMenu(): HTMLButtonElement[] {
		var topMenu = <HTMLElement>document.getElementById("topmenu")
		var buttons = [
			<HTMLButtonElement>createElement("button", {id:"viewCompany", class: "screen-btn flex-grow dark", innerText:`Overview`}),
			<HTMLButtonElement>createElement("button", {id:"viewFleet", class: "screen-btn flex-grow dark", innerText:`Fleet`}),
			<HTMLButtonElement>createElement("button", {id:"viewRoutes", class: "screen-btn flex-grow dark", innerText:`Routes`}),
			<HTMLButtonElement>createElement("button", {id:"viewUpgrades", class: "screen-btn flex-grow dark", innerText:`Upgrades`}),
			<HTMLButtonElement>createElement("button", {id:"viewReputation", class: "screen-btn flex-grow dark", innerText:`Reputation`}),
			<HTMLButtonElement>createElement("button", {id:"viewFinance", class: "screen-btn flex-grow dark", innerText:`Finance`}),
			<HTMLButtonElement>createElement("button", {id:"viewAccidents", class: "screen-btn flex-grow dark", innerText:`Accidents`}),
		]
		buttons.forEach((b) => topMenu.appendChild(b))
		return buttons
	}
	createSideMenu(airline: Airline): HTMLButtonElement[] {
		var sideMenu = <HTMLElement>document.getElementById("sidemenu")
		var buttons = [
			<HTMLButtonElement>createElement("button", {id:"viewCompany", class: "screen-btn flex-grow dark", innerText:`Overview of ${airline.name}`}),
			<HTMLButtonElement>createElement("button", {id:"viewFleet", class: "screen-btn flex-grow dark", innerText:`Overview of Fleet`}),
			<HTMLButtonElement>createElement("button", {id:"viewRoutes", class: "screen-btn flex-grow dark", innerText:`Overview of Routes`}),
			<HTMLButtonElement>createElement("button", {id:"viewUpgrades", class: "screen-btn flex-grow dark", innerText:`Overview of Upgrades`}),
			<HTMLButtonElement>createElement("button", {id:"viewReputation", class: "screen-btn flex-grow dark", innerText:`Overview of Reputation`}),
			<HTMLButtonElement>createElement("button", {id:"viewFinance", class: "screen-btn flex-grow dark", innerText:`Overview of Finance`}),
			<HTMLButtonElement>createElement("button", {id:"viewAccidents", class: "screen-btn flex-grow dark", innerText:`Overview of Accidents`}),
		]
		buttons.forEach((b) => sideMenu.appendChild(b))

		return buttons
	}
}

//////// SETUP
var gameEngine: GameEngine = new GameEngine()
var client = new RequestClient(gameEngine)

function loadGameScreen(airline: Airline) {
	const homeHeader = document.getElementById("homeHeader")
	const gameHeader = document.getElementById("gameHeader")
	hideElement(homeHeader)
	gameHeader.style.display = "flex"
	// I think topMenu is better, but leaving sideMenu here incase we change our minds
	const buttons = gameEngine.createTopMenu() // gameEngine.createSideMenu(airline)
	loadMenuButtons(buttons)
	airline.updateTitle()
	airline.updateStats()
}

function loadMenuButtons(buttons: HTMLButtonElement[]) {
	const setScreen = (buttonId: string) => {
		buttons.forEach(b => {
			if (b.id === buttonId) {
				b.classList.add("light")
			} else {
				b.classList.remove("light")
			}
		})
		switch (buttonId) {
			case "viewCompany":
				gameEngine.displaySummaryTab()
				break;
			case "viewFleet":
				gameEngine.displayFleetTab()
				break;
			case "viewRoutes":
				gameEngine.displayRoutesTab()
				break;
			case "viewUpgrades":
				gameEngine.displayUpgradesTab()
				break;
			case "viewReputation":
				gameEngine.displayReputationTab()
				break;
			case "viewFinance":
				gameEngine.displayFinanceTab()
				break;
			case "viewAccidents":
				gameEngine.displayAccidentsTab()
				break;
			default:
				console.error("Unexpected buttonId:", buttonId)
		}
	}
	buttons.forEach(b => {
		b.addEventListener("click", () => setScreen(b.id))
	})
}

const renderSignupForm = () => {
	// Creating form to enter business name and to choose hub
	const form = <HTMLFormElement>document.getElementById("SignUp")


	var nameRow = document.createElement("div")
	var nameLabel = createElement("label", {innerText: "Airline name"})
	nameLabel.setAttribute("for", "businessName")
	var nameInput: HTMLInputElement = document.createElement("input")
	nameInput.setAttribute("type", "text")
	nameInput.setAttribute("name", "businessName")
	nameInput.setAttribute("required", "")
	nameRow.appendChild(nameLabel)
	nameRow.appendChild(nameInput)

	var passwordRow = createElement("div", {})
	var passwordLabel = createElement("label", {innerText: "Password"})
	passwordLabel.setAttribute("for", "password")
	var passwordinput: HTMLInputElement = document.createElement("input")
	// TODO justin: what happens if we change the type below from "text" to "password"?
	passwordinput.setAttribute("type", "text")
	passwordinput.setAttribute("name", "password")
	passwordinput.setAttribute("required", "")
	passwordRow.appendChild(passwordLabel)
	passwordRow.appendChild(passwordinput)

	var hubRow = createElement("div", {id: "hubRow"})

	var hubLabel = document.createElement("label")
	hubLabel.setAttribute("for", "hub")
	hubLabel.textContent = "Choose your hub"
	hubRow.appendChild(hubLabel)


	var playBtn = createElement("button", {id: "playBtn", class: "primary"})
	playBtn.setAttribute("disabled", "")
	playBtn.setAttribute("type", "submit")
	createSpinner(playBtn)
	form.innerHTML = ""
	form.appendChild(createElement("h3", {innerText: "Sign Up", class: "text-center"}))
	form.appendChild(createElement("p", {innerText: "Create your airline", class: ""}))
	form.appendChild(nameRow)
	form.appendChild(passwordRow)
	form.appendChild(hubRow)
	form.appendChild(playBtn)
	nameInput.setAttribute("value", randomBusinessName())
	form.addEventListener("submit", (e) => {
		e.preventDefault()
		var businessName = nameInput.value
		if (!businessName) {
			displayError("Please provide a name for your airline")
			return
		}
		var hub = (<HTMLSelectElement>document.getElementById("hubSelect")).value
		if (!hub) {
			displayError("Please select a hub for your airline")
			return
		}
		var password = passwordinput.value
		if (!password) {
			displayError("Please provide a password")
			return
		}
		$.ajax({
			method: "POST",
			url: "/signup",
			data: {
				businessName,
				hub,
				password,
			},
			error: defaultErrHandler(),
			success: function(response) {
				hideElement(<HTMLFormElement>document.getElementById("landing"))
				var airline = new Airline(JSON.parse(response))
				displayInfo(airline.name + " joins the aviation industry!")
				gameEngine.registerAirline(airline)
				loadGameScreen(airline)
				$("#logo").show()
			}
		})
	})
}

const renderLoginForm = () => {
	// Creating form to enter business name and to choose hub
	const form = <HTMLFormElement>document.getElementById("Login")
	var nameRow = document.createElement("div")
	var nameLabel = createElement("label", {innerText: "Please Enter Your Airline Name."})
	nameLabel.setAttribute("for", "businessName")
	var nameInput: HTMLInputElement = document.createElement("input")
	nameInput.setAttribute("type", "text")
	nameInput.setAttribute("name", "businessName")
	nameInput.setAttribute("required", "")
	nameRow.appendChild(nameLabel)
	nameRow.appendChild(nameInput)

	var passwordRow = createElement("div", {})
	var passwordLabel = createElement("label", {innerText: "Password"})
	passwordLabel.setAttribute("for", "password")

	var passwordinput: HTMLInputElement = document.createElement("input")
	// TODO justin: what happens if we change the type below from "text" to "password"?
	passwordinput.setAttribute("type", "text")
	passwordinput.setAttribute("name", "password")
	passwordinput.setAttribute("required", "")
	passwordRow.appendChild(passwordLabel)
	passwordRow.appendChild(passwordinput)
	var playBtn = createElement("button", {class: "primary", innerText: "Login"})
	playBtn.setAttribute("type", "submit")
	form.innerHTML = ""
	var heading = createElement("h3", {innerText: "Log In", class:"text-center"})
	form.appendChild(heading)
	form.appendChild(createElement("p", {innerText: "Welcome back!"}))
	form.appendChild(nameRow)
	form.appendChild(passwordRow)
	form.appendChild(playBtn)
	nameInput.setAttribute("value", randomBusinessName())
	form.addEventListener("submit", (e) => {
		var hubSelect = <HTMLSelectElement>document.getElementById("hubSelect")
		e.preventDefault()
		$.ajax({
			method: "POST",
			url: "/login",
			data: {
				businessName: nameInput.value,
				password: passwordinput.value,
			},
			error: defaultErrHandler(),
			success: function(response) {
				hideElement(<HTMLFormElement>document.getElementById("landing"))
				var airline = new Airline(JSON.parse(response))
				displayInfo( "Welcome back " + airline.name + "!")
				gameEngine.registerAirline(airline)
				loadGameScreen(airline)
				$("#logo").show()
			}
		})
	})
}

window.onload = () => {
	renderSignupForm()
	renderLoginForm()
	client.getAirports((airports) => {
		console.log('callback', airports)
		var hubSelect = <HTMLSelectElement>createElement("select", {id: "hubSelect"})
		hubSelect.setAttribute("name", "hub")
		airports.forEach((airport) => {
			var opt = createElement("option", {innerText: `${airport.name} (${airport.code})`})
			opt.setAttribute("value", airport.code)
			hubSelect.appendChild(opt)
		})
		var hubRow = document.getElementById("hubRow")
		hubRow.appendChild(hubSelect)
		var playBtn = document.getElementById("playBtn")
		playBtn.removeAttribute("disabled")
		playBtn.innerHTML = "Create Airline"
	})
	gameEngine.hideTabs("")
	var logoImg = <HTMLImageElement>document.getElementById("logo")
	// TODO justin: where is this "logo" on the screen? what happens if you click it?
	logoImg.addEventListener("click", () => {
		var oldSrc = logoImg.src
		var newSrc = prompt("Enter URL of your logo", oldSrc)
		if (newSrc) {
			logoImg.src = newSrc
		}
	})

	$.ajax({
		method: "GET",
		url: "/meta",
		success: function(response) {
			const { total, online } = JSON.parse(response)
			const div = <HTMLElement>document.getElementById("placeholder")
			div.appendChild(createElement("p", {innerText: `Compete with ${total} other airlines!`}))
			div.appendChild(createElement("p", {innerText: `${online} players currently online!`}))
		},
		error: defaultErrHandler(),
	})
}
