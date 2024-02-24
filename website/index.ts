//////// HELPING FUNCTIONS
function errHandler(err: JQuery.jqXHR<any>, button?: HTMLButtonElement) {
	unsetLoader()
	displayError(err.responseText)
	if (button) {
		button.removeAttribute("disabled");
	}
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
function createTitle(innerHTML: string, elementType: string = "h1"): HTMLElement {
	return createElement(elementType, {innerHTML})
}
function createParagraph(text: string): HTMLParagraphElement {
	var p = document.createElement("p")
	p.innerText = text
	return p
}
function hideElement(elem: HTMLElement): void {
	elem.style.display = 'none'
}
var inflight = 0
function setLoader() {
	inflight += 1
	$("#loader").show()
}
function unsetLoader() {
	$("#loader").hide()
	inflight -= 1
	if (inflight === 0) {
		$("#loader").hide()
	}
}
function makeClickWrapper(btn: HTMLButtonElement, handler: (ev:MouseEvent)=>any) {
	// disable, show spinner until response
	console.log('buttonClickWrapper ', btn, handler)
	function completeHandler(this: void, ev: MouseEvent) {
		console.log('completeHandler enter', this, ev)
		btn.setAttribute("disabled", "")
		btn.innerHTML = '...'
		handler(ev)
		console.log('completeHandler exit', this, ev)
		return this
	}
	return completeHandler
}
function addPolylineToMap(map: H.Map, startinglat: number, startinglon: number, endinglat: number, endinglon: number) {
    var lineString = new H.geo.LineString();
  
    lineString.pushPoint({lat:startinglat, lng:startinglon});
    lineString.pushPoint({lat:endinglat, lng:endinglon});
  
    map.addObject(new H.map.Polyline(
      lineString, { style: { lineWidth: 4 }}
    ));
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
	cardHtml(): HTMLElement {
		return dataLabels([
			["IATA code", this.code],
			["Country", this.country],
			["Popularity", String(this.popularity)],
		])
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
		var tr = document.createElement("tr")
		tr.setAttribute("style", "background-color:#ddcc44aa")
		// title - distance - pop - cost
		var titleCell = document.createElement("td")
		titleCell.innerHTML = `${this.fromAirport.code} <-> ${this.toAirport.code}`
		tr.appendChild(titleCell)

		var distanceCell = document.createElement("td")
		distanceCell.innerHTML = `${this.distance.toLocaleString("en-gb", { maximumFractionDigits: 0 })}km`
		tr.appendChild(distanceCell)
		var pop = document.createElement("td")
		pop.innerHTML = this.popularity.toLocaleString("en-gb")
		tr.appendChild(pop)
		var cost = document.createElement("td")
		cost.innerHTML = `$${this.purchaseCost.toLocaleString("en-gb")}`
		tr.appendChild(cost)
		tr.appendChild(document.createElement("td"))
		var btn = document.createElement("button")
		btn.innerText = "Purchase"
		var btnCell = document.createElement("td")
		var route_id = this.id
		btn.addEventListener("click", makeClickWrapper(btn, (ev:MouseEvent) => {
			var airline = <Airline>gameEngine.airline
			setLoader()
			$.ajax({
				method: "POST",
				url: "/purchase_route",
				data: {
					airline_id: airline.id,
					route_id,
				},
				error: (x) => errHandler(x, btn),
				success: function(response) {
					unsetLoader()
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
			})
		}))
		btnCell.appendChild(btn)
		tr.appendChild(btnCell)
		return tr
	}
	buttonHtml(): HTMLButtonElement {
		var btn = document.createElement("button")
		btn.setAttribute("style", "background-color:#ddcc44aa")
		btn.setAttribute("class", "flex-grow")
		btn.appendChild(this.cardHtml())
		const route_id = this.id
		btn.addEventListener("click", makeClickWrapper(btn, (ev:MouseEvent) => {
			var airline = <Airline>gameEngine.airline
			setLoader()
			$.ajax({
				method: "POST",
				url: "/purchase_route",
				data: {
					airline_id: airline.id,
					route_id,
				},
				error: (x) => errHandler(x, btn),
				success: function(response) {
					unsetLoader()
					var jresponse = JSON.parse(response)
					var route = new Route(jresponse.route)
					airline.routes.push(route)
					airline.cash = jresponse.cash
					airline.addTransaction(jresponse.transaction)
					displayInfo(jresponse.msg)
					airline.getRoutesDisplay()
					airline.updateStats()
				}
			})
		}))
		return btn
	}
	cardHtml(): HTMLElement {
		var dl = dataLabels([
			["Distance", `${this.distance.toLocaleString("en-gb", { maximumFractionDigits: 0 })}km`],
			["Popularity", this.popularity.toLocaleString("en-gb")],
			["Cost", `$${this.purchaseCost.toLocaleString("en-gb")}`],
		])
		var card = createElement("div", {
			class: "flex flex-column justify-content-between",
			innerHTML: `<h3>${this.fromAirport.code} <-> ${this.toAirport.code}</h3>`
		})
		card.appendChild(dl)
		var footer = document.createElement("div")
		var fromAirport = createElement("h5", {innerHTML: this.fromAirport.name})
		footer.appendChild(fromAirport)
		footer.appendChild(document.createElement("hr"))
		var toAirport = createElement("h5", {innerHTML: this.toAirport.name})
		footer.appendChild(toAirport)
		card.appendChild(footer)
		return card
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
		setLoader()
		$.ajax({
			method: "POST",
			url: "/fly_route",
			data: {
				airline_id: airline.id,
				route_id: this.id,
			},
			error: (x) => {
				errHandler(x, btn)
				route.updatePurchasedCardContent()
			},
			success: function(response) {
				unsetLoader()
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
		setLoader()
		$.ajax({
			method: "POST",
			url: "/collect",
			data: {
				airline_id: airline.id,
				route_id: this.id,
			},
			error: (x) => {
				errHandler(x, btn)
				route.updatePurchasedCardContent()
			},
			success: function(response) {
				unsetLoader()
				var jresponse = JSON.parse(response)
				displayInfo(jresponse.msg)
				if (jresponse.incident) {
					displayInfo(jresponse.incident)
					airline.incidents.push(jresponse.incident)
				}
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
			actionButton.addEventListener("click", makeClickWrapper(actionButton, (ev:MouseEvent) => this.run(actionButton)))
			actionButton.innerHTML = "Run Route"
		} else if (this.status === "landed") {
			statusText = `Landed at ${this.toAirport.code}!`
			actionButton.addEventListener("click", makeClickWrapper(actionButton, (ev:MouseEvent) => this.getResults(actionButton)))
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
				error: (x) => errHandler(x),
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
	cardHtml(): HTMLElement {
		var dl = dataLabels([
			["Distance", `${this.distance.toLocaleString("en-gb", { maximumFractionDigits: 0 })}km`],
			["Popularity", this.popularity.toLocaleString("en-gb")],
			["Cost", `$${this.purchaseCost.toLocaleString("en-gb")}`],
		])
		var card = createElement("div", {
			class: "flex flex-column justify-content-between",
			innerHTML: `<h3>${this.fromAirport.code} <-> ${this.toAirport.code}</h3>`
		})
		card.appendChild(dl)
		var footer = document.createElement("div")
		var fromAirport = document.createElement("h5")
		fromAirport.innerHTML = this.fromAirport.name
		footer.appendChild(fromAirport)
		footer.appendChild(document.createElement("hr"))
		var toAirport = document.createElement("h5")
		toAirport.innerHTML = this.toAirport.name
		footer.appendChild(toAirport)
		card.appendChild(footer)
		return card
	}
}

class Plane {
	id: number
	name: string
	status: string
	health: number
	maxDistance: number
	cost: number
	constructor(data: { id: any; name: any; status: any; health: any; max_distance: any; cost: any; }) {
		const { id, name, status, health, max_distance, cost } = data
		this.id = id
		this.name = name
		this.status = status
		this.health = health
		this.maxDistance = max_distance
		this.cost = cost
	}
	purchasedCardHtml(): HTMLElement {
		var div = document.createElement("div")
		div.className = "bg-light border-box"
		var dl = dataLabels([
			["Name", `${this.name}`],
			["Status", `${this.status}`],
			["Max distance", `${this.maxDistance}`],
			["Health", this.health.toLocaleString("en-gb")],
		])
		var card = document.createElement("div")
		card.innerHTML = `<h3>${this.name} </h3>`
		card.appendChild(dl)
		div.appendChild(card)
		if (this.status.indexOf("aintenance") > -1) {
			card.appendChild(this.maintenanceHtml())
		}
		card.className = `flex flex-column justify-content-between ${this.status}`
		card.appendChild(createParagraph(this.status))
		return div

	}
	displayHtml(): HTMLElement {
		var div = document.createElement("div")
		div.className = "flex"
		div.appendChild(dataLabels([
			["id", String(this.id)],
			["name", this.name],
			["health", String(this.health)],
			["maxDistance", String(this.maxDistance)],
		]))
		return div
	}
	maintenanceHtml(): HTMLElement {
		var airline = <Airline>gameEngine.airline
		var div = this.displayHtml()
		var btn = document.createElement("button")
		btn.innerText = "Fix for $100,000"
		div.appendChild(btn)
		btn.addEventListener("click", makeClickWrapper(btn, (ev:MouseEvent) => {
			$.ajax({
				method: "POST",
				url: "/plane/fix",
				data: {
					airline_id: airline.id,
					plane_id: this.id
				},
				error: (x) => errHandler(x, btn),
				success: function(response) {
					var jresponse = JSON.parse(response)
					airline.planes = jresponse.planes.map((p: any) => new Plane(p))
					airline.cash = jresponse.cash
					airline.addTransaction(jresponse.transaction)
					displayInfo(jresponse.msg)
					gameEngine.displayFleetTab()
					airline.updateStats()
				}
			})
		}))
		var btn = document.createElement("button")
		btn.innerText = "Sell to  Mojave scrapyard for $10,000"
		div.appendChild(btn)
		btn.addEventListener("click", makeClickWrapper(btn, (ev:MouseEvent) => {
			$.ajax({
				method: "POST",
				url: "/plane/scrap",
				data: {
					airline_id: airline.id,
					plane_id: this.id
				},
				error: (x) => errHandler(x, btn),
				success: function(response) {
					var jresponse = JSON.parse(response)
					airline.planes = jresponse.planes.map((p: any) => new Plane(p))
					airline.addTransaction(jresponse.transaction)
					airline.cash = jresponse.cash
					displayInfo(jresponse.msg)
					gameEngine.displayFleetTab()
					airline.updateStats()
				}
			})
		}))
		return div
	}
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
	transactions: Array<string> = []
	incidents: Array<string> = []
	constructor(data: any) {
		const { id, name, hub, joined_at, cash, rank, planes, routes, popularity, transactions, incidents } = data
		this.id = id
		this.name = name
		this.hub = hub
		console.log('joined', joined_at)
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
		div.appendChild(this.titleHtml())

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
	addTransaction(msg: string): void {
		this.transactions.push(`${new Date()} ${prettyCashString(this.cash)} ${msg}`)
	}
	titleHtml(): HTMLElement {
		return createTitle(
			`${this.name}<strong>Hub: ${this.hub.code}</strong>`,
			"h2",
		)
	}
	statsHtml(): HTMLElement {
		var dl = dataLabels([
			["Cash", prettyCashString(this.cash)],
			["Planes", String(this.planes.length)],
			["Routes", String(this.routes.length)],
			["Popularity", String(this.popularity)],
			["Rank", this.rank],
			["Joined", this.joined.toLocaleDateString()],
		])
		return dl
	}
	getFleetDisplay(): HTMLElement {
		var div = document.createElement("div")
		div.appendChild(createTitle("Your Fleet"))
		var planesContainer = document.createElement("div")
		this.planes.forEach(plane => {
		planesContainer.appendChild(plane.purchasedCardHtml())
		})
		div.appendChild(planesContainer)
		div.appendChild(createParagraph(`You have ${this.planes.length} planes in your fleet`))
		var airline = this
		setLoader()
		$.ajax({
			method: "GET",
			url: "/offered_planes",
			data: {
				airline_id: airline.id
			},
			error: (x) => errHandler(x),
			success: function(response) {
				JSON.parse(response).map((p: any) => {
					unsetLoader()
					var plane = new Plane(p)
					var button = document.createElement("button")
					button.setAttribute("style", "margin: 0.5rem")
					const airplaneCost = plane.cost
					div.appendChild(createParagraph(`You can buy ${plane.name}, which flies up to ${plane.maxDistance.toLocaleString("en-gb", { maximumFractionDigits: 0 })}km, for ${prettyCashString(airplaneCost)}`))
					button.innerHTML = `Buy plane for ${prettyCashString(airplaneCost).toLocaleString()}`
					button.addEventListener("click", () => {
						var confirmed = confirm(`Are you sure you want to buy ${plane.name}?\nThis will cost ${prettyCashString(airplaneCost).toLocaleString()}`)
						if (!confirmed) {
							return
						}
						button.setAttribute("disabled", "")
						button.innerHTML = "..."
						$.ajax({
							method: "POST",
							url: "/purchase_plane",
							data: {
								airline_id: airline.id,
								plane_id: plane.id,
							},
							error: (x) => errHandler(x),
							success: function(response) {
								var r = JSON.parse(response)
								displayInfo(r.msg)
								airline.addTransaction(r.transaction)
								airline.planes.push(new Plane(r.plane))
								airline.updateStats(r.cash)
								gameEngine.displayFleetTab()
							}
						})
					})
					div.appendChild(button)
				})
			}
		})

		return div
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
		var div = document.createElement("div")
		var heading = createTitle("Reputation and Reviews")
		div.appendChild(heading)

		var p = createElement("p", {class: "p-3"})
		var numStars = 0
		if (this.popularity > 89) {
			p.innerText = `Customers favorite airline in ${this.hub.country}!`
			numStars = 5
		} else if (this.popularity > 69) {
			p.innerText = `Very reputable airline`
			numStars = 4
		} else if (this.popularity > 49) {
			p.innerText = `Distinctly average`
			numStars = 3
		} else if (this.popularity > 39) {
			p.innerText = `Poor reputation`
			numStars = 2
		} else {
			p.innerText = `Customers least favorite choice`
			numStars = 1
		}
		for (var i = 0; i < 5; i++) {
			var span = document.createElement("span")
			span.className = "fa fa-star"
			if (i < numStars) {
				span.classList.add("checked")
			}
			div.appendChild(span)
		}
		div.appendChild(p)
		return div
	}
	getFinanceDisplay(): HTMLElement {
		var div = document.createElement("div")
		var heading = createTitle("Finances")
		div.appendChild(heading)
		var tbl = createElement("table", {})
		var tbody = createElement("tbody", {})
		this.transactions.forEach(t => {
			var tr = createElement("tr", {class: "bgw"})
			var td = createElement("td", {innerText: t, class: "text-left"})
			tr.appendChild(td)
			tbody.appendChild(tr)
		})
		tbl.appendChild(tbody)
		div.appendChild(tbl)
		return div
	}
	getAccidentsDisplay(): HTMLElement {
		var div = document.createElement("div")
		var heading = createTitle("Accidents")
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
				'apikey': 'r7U4pzaJCQZVOL0cJLmpjQz0Sqzf3Wlq7LJwg3fbvik'
			});
			var defaultLayers = platform.createDefaultLayers();
			//Step 2: initialize a map - this map is centered over Europe
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
	loadAirports(): void {
		if (this.airports.length === 0) {
			var airs = this.airports
			var ge = this
			setLoader()
			$.ajax({
				url: "/airports",
				error: (x) => errHandler(x),
				success: function(response) {
					unsetLoader()
					airs = JSON.parse(response).map((a: any) => new Airport(a))
					ge.airports = airs
					loadHubSelect(airs)
				}
			})
		}
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
		var heading = createTitle(airline.name)
		main.appendChild(heading)
		main.appendChild(airline.statsHtml())
		main.appendChild(airline.getReputationDisplay())
		main.appendChild(airline.getAccidentsDisplay())
		// This doesn't work - looks like we can only have one map?
		airline.getMap()
	}
	displayFleetTab(): void {
		this.hideTabs("fleet")
		const main = <HTMLElement>document.getElementById("main-fleet")
		main.innerHTML = ""
		var airline = <Airline>this.airline
		main.appendChild(airline.getFleetDisplay())
	}
	displayRoutesTab(): void {
		this.hideTabs("routes")
		var airline = <Airline>this.airline
		airline.getRoutesDisplay()
		const offered = <HTMLElement>document.getElementById("offered-routes")
		setLoader()
		$.ajax({
			method: "GET",
			url: "/offered_routes",
			data: {
				airline_id: airline.id,
			},
			error: (x) => errHandler(x),
			success: function(response) {
				unsetLoader()
				offered.innerHTML = ""
				var routesToDisplay = JSON.parse(response).map((r: any) => new OfferedRoute(r))
				routesToDisplay.forEach((r: OfferedRoute) => offered.appendChild(r.trHtml()))
			}
		})
	}
	displayUpgradesTab(): void {
		this.hideTabs("upgrades")
		var airline = <Airline>this.airline
		setLoader()
		const main = <HTMLElement>document.getElementById("main-upgrades")
		main.innerHTML = ""
		$.ajax({
			method: "GET",
			url: "/upgrades",
			data: {
				airline_id: airline.id,
			},
			error: (x) => errHandler(x),
			success: function(response) {
				unsetLoader()
				const parentContainer = createElement("div", {class: ""})
				const upgradeCategories = JSON.parse(response).forEach((category: { [x: string]: any; }) => {
					const categoryContainer = createElement("div", {class: "bg-light border-box p-3"})
					categoryContainer.appendChild(createElement("h4", {innerText: category["title"], class:"mb-1"}))
					categoryContainer.appendChild(listLabels([
						["Current Level", category["current_level"]],
						["Upgrade Cost", category["upgrade_cost"]],
					]))
					const btn_class = category["upgrade_enabled"] ? "" : "disabled"
					const btn = createElement("button", {innerText: "Upgrade", class: btn_class})

					if (category["upgrade_enabled"]) {
						btn.addEventListener("click", () => {
							btn.setAttribute("disabled", "")
							btn.innerHTML = "..."
							$.ajax({
								method: "POST",
								url: "/upgrade_fuel_efficiency",
								data: {
									airline_id: airline.id,
									from_level: category["fuel_efficiency_level"],
								},
								error: (x) => errHandler(x),
								success: function(response) {
									// TODO: we need to refresh this div and the airline's cash
									// displayUpgradesTab()
								}
							})
						})
					} else {
						btn.setAttribute("disabled", "")
					}
					categoryContainer.appendChild(btn)
					parentContainer.appendChild(categoryContainer)
				})
				main.appendChild(parentContainer)
			}
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
	createSideMenu(): void {
		var sideMenu = <HTMLElement>document.getElementById("sidemenu")
		var buttons = [
			createElement("button", {id:"viewCompany", class: "flex-grow dark", innerText:`Overview of ${(<Airline>this.airline).name}`}),
			createElement("button", {id:"viewFleet", class: "flex-grow dark", innerText:`Overview of Fleet`}),
			createElement("button", {id:"viewRoutes", class: "flex-grow dark", innerText:`Overview of Routes`}),
			createElement("button", {id:"viewUpgrades", class: "flex-grow dark", innerText:`Overview of Upgrades`}),
			createElement("button", {id:"viewReputation", class: "flex-grow dark", innerText:`Overview of Reputation`}),
			createElement("button", {id:"viewFinance", class: "flex-grow dark", innerText:`Overview of Finance`}),
			createElement("button", {id:"viewAccidents", class: "flex-grow dark", innerText:`Overview of Accidents`}),
		]
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
			sideMenu.appendChild(b)
		})
	}
}

//////// SETUP
var gameEngine: GameEngine = new GameEngine()

function loadHubSelect(airports: Array<Airport>) {
	var hubRow = document.getElementById("hubRow")
	var hubLabel = document.createElement("label")
	hubLabel.setAttribute("for", "hub")
	hubLabel.textContent = "Choose your hub"
	var hubSelect = <HTMLSelectElement>document.createElement("select")
	hubSelect.setAttribute("id", "hubSelect")
	hubSelect.setAttribute("name", "hub")
	airports.map((airport) => {
		var opt = document.createElement("option")
		opt.setAttribute("value", airport.code)
		opt.textContent = `${airport.name} (${airport.code})`
		hubSelect.appendChild(opt)
		return opt
	})
	hubRow.appendChild(hubLabel)
	hubRow.appendChild(hubSelect)
}

const renderSignupForm = () => {
	// Creating form to enter business name and to choose hub
	const form = <HTMLFormElement>document.getElementById("SignUp")
	var nameRow = document.createElement("div")
	var nameLabel = createElement("label", {innerText: "What do you want your airline to be called?"})
	nameLabel.setAttribute("for", "businessName")
	var nameInput: HTMLInputElement = document.createElement("input")
	nameInput.setAttribute("type", "text")
	nameInput.setAttribute("name", "businessName")
	nameInput.setAttribute("required", "")
	nameRow.appendChild(nameLabel)
	nameRow.appendChild(nameInput)
	var passwordinput: HTMLInputElement = document.createElement("input")
	passwordinput.setAttribute("type", "text")
	passwordinput.setAttribute("name", "password")
	passwordinput.setAttribute("required", "")
	var hubRow = createElement("div", {id: "hubRow"})
	var playBtn = createElement("button", {class: "primary", innerText: "Create"})
	playBtn.setAttribute("type", "submit")
	form.innerHTML = ""
	form.appendChild(nameRow)
	form.appendChild(passwordinput)
	form.appendChild(hubRow)
	form.appendChild(playBtn)
	nameInput.setAttribute("value", randomBusinessName())
	form.addEventListener("submit", (e) => {
		var hubSelect = <HTMLSelectElement>document.getElementById("hubSelect")
		e.preventDefault()
		setLoader()
		$.ajax({
			method: "POST",
			url: "/signup",
			data: {
				businessName: nameInput.value,
				hub: hubSelect.value,
				password: passwordinput.value,
			},
			error: (x) => errHandler(x),
			success: function(response) {
				hideElement(<HTMLFormElement>document.getElementById("Login"))
				hideElement(<HTMLFormElement>document.getElementById("SignUp"))
				unsetLoader()
				var airline = new Airline(JSON.parse(response))
				displayInfo(airline.name + " joins the aviation industry!")
				gameEngine.registerAirline(airline)
				const header = document.getElementsByTagName("header")[0]
				header?.classList.remove("justify-content-center")
				header?.classList.remove("flex-column")
				header?.classList.add("justify-content-between")
				gameEngine.createSideMenu()
				airline.updateTitle()
				airline.updateStats()
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
	var passwordinput: HTMLInputElement = document.createElement("input")
	passwordinput.setAttribute("type", "text")
	passwordinput.setAttribute("name", "password")
	passwordinput.setAttribute("required", "")
	var playBtn = createElement("button", {class: "primary", innerText: "Login"})
	playBtn.setAttribute("type", "submit")
	form.innerHTML = ""
	form.appendChild(nameRow)
	form.appendChild(passwordinput)
	form.appendChild(playBtn)
	nameInput.setAttribute("value", randomBusinessName())
	form.addEventListener("submit", (e) => {
		var hubSelect = <HTMLSelectElement>document.getElementById("hubSelect")
		e.preventDefault()
		setLoader()
		$.ajax({
			method: "POST",
			url: "/login",
			data: {
				businessName: nameInput.value,
				password: passwordinput.value,
			},
			error: (x) => errHandler(x),
			success: function(response) {
				hideElement(<HTMLFormElement>document.getElementById("Login"))
				hideElement(<HTMLFormElement>document.getElementById("SignUp"))
				unsetLoader()
				var airline = new Airline(JSON.parse(response))
				displayInfo( "Welcome back " + airline.name + "!")
				gameEngine.registerAirline(airline)
				const header = document.getElementsByTagName("header")[0]
				header?.classList.remove("justify-content-center")
				header?.classList.remove("flex-column")
				header?.classList.add("justify-content-between")
				gameEngine.createSideMenu()
				airline.updateTitle()
				airline.updateStats()
				$("#logo").show()
			}
		})
	})
}

window.onload = () => {
	renderSignupForm()
	renderLoginForm()
	gameEngine.loadAirports()
	gameEngine.hideTabs("")
	var logoImg = <HTMLImageElement>document.getElementById("logo")
	logoImg.addEventListener("click", () => {
		var oldSrc = logoImg.src
		var newSrc = prompt("Enter URL of your logo", oldSrc)
		if (newSrc) {
			logoImg.src = newSrc
		}
	})
}
