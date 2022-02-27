//////// HELPING FUNCTIONS
function errHandler(err, button?: HTMLButtonElement) {
	unsetLoader()
	displayError(err.responseText)
	if (button) {
		button.removeAttribute("disabled");
	}
}
function randomBusinessName(): string {
	var adjectives: Array<string> = ["Blue", "Red", "Green", "Purple", "Orange", "White", "Trusty", "Speedy", "Enigmatic", "Fly", "Golden", "Sturdy", "Graceful", "Rapid", "Robust", "American", "British", "Asian", "European", "Indian", "Italian", "Australian", "Chinese", "Russian", "Nordic", "Southern", "Northern", "Southwest", "Express", "Paper", "Malaysia", "Thai"]
	var nouns: Array<string> = ["Planes", "Airways", "Skies", "Air", "Airlines", "Flyers", "Jets", "Pilots", "Air Transport", "Helicopters", "Cargo"]
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
function createElement(elementType: string, elementId?: string, className?: string, innerText?: string) {
	var e = document.createElement(elementType)
	if (elementId) {
		e.setAttribute("id", elementId)
	}
	if (className) {
		e.setAttribute("class", className)
	}
	if (innerText) {
		e.innerText = innerText
	}
	return e
}
function createTitle(text: string, elementType: string = "h1"): HTMLElement {
	var h = document.createElement(elementType)
	h.innerHTML = text
	return h
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
function makeClickWrapper(btn: HTMLButtonElement, handler) {
	// disable, show spinner until response
	console.log('buttonClickWrapper ', btn, handler)
	function completeHandler(this: HTMLElement, ev: MouseEvent) {
		console.log('completeHandler enter', this, ev)
		btn.setAttribute("disabled", "")
		btn.innerHTML = '...'
		handler()
		console.log('completeHandler exit', this, ev)
	}
	return completeHandler
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
	constructor(data) {
		const { id, distance, origin, destination, popularity, cost } = data
		this.id = id
		this.distance = distance
		this.fromAirport = origin
		this.toAirport = destination
		this.popularity = popularity
		this.purchaseCost = cost
	}
	buttonHtml(): HTMLButtonElement {
		var btn = document.createElement("button")
		btn.setAttribute("style", "background-color:#ddcc44aa")
		btn.setAttribute("class", "flex-grow")
		btn.appendChild(this.cardHtml())
		const routeId = this.id
		btn.addEventListener("click", makeClickWrapper(btn, () => {
			var airline = <Airline>gameEngine.airline
			setLoader()
			$.ajax({
				method: "POST",
				url: "/purchase_route",
				data: {
					airlineId: airline.id,
					routeId,
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
					gameEngine.displayRoutesTab()
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
		var card = document.createElement("div")
		card.className = "flex flex-column justify-content-between"
		card.innerHTML = `<h3>${this.fromAirport.code} <-> ${this.toAirport.code}</h3>`
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
	plane?: Plane
	constructor(data) {
		const { id, distance, origin, destination, popularity, cost, last_run_at, last_resulted_at, next_available_at, plane } = data
		this.id = id
		this.fromAirport = origin
		this.toAirport = destination
		this.distance = distance
		this.popularity = popularity
		this.purchaseCost = cost
		this.lastRunAt = last_run_at ? new Date(last_run_at) : null
		this.lastResultedAt = last_resulted_at ? new Date(last_resulted_at): null
		this.nextAvailableAt = next_available_at ? new Date(next_available_at) : null
		this.plane = plane
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
			url: "/run-route",
			data: {
				airlineId: airline.id,
				routeId: this.id,
			},
			error: (x) => errHandler(x, btn),
			success: function(response) {
				unsetLoader()
				var jresponse = JSON.parse(response)
				route.lastRunAt = new Date(jresponse.last_run_at)
				route.nextAvailableAt = new Date(jresponse.next_available_at)
				airline.planes = jresponse.planes.map(p => new Plane(p))
				airline.updateStats()
				airline.getRoutesDisplay()
				gameEngine.displayRoutesTab()
				displayInfo(jresponse.msg)
			}
		})
		return true
	}
	getResults(btn: HTMLButtonElement) {
		var airline = <Airline>gameEngine.airline
		setLoader()
		$.ajax({
			method: "POST",
			url: "/collect",
			data: {
				airlineId: airline.id,
				routeId: this.id,
			},
			error: (x) => errHandler(x, btn),
			success: function(response) {
				unsetLoader()
				var jresponse = JSON.parse(response)
				displayInfo(jresponse.msg)
				if (jresponse.incident) {
					displayInfo(jresponse.incident)
					airline.incidents.push(jresponse.incident)
				}
				airline.planes = jresponse.planes.map(p => new Plane(p))
				airline.popularity = jresponse.popularity
				airline.updateStats(jresponse.cash)
				airline.getRoutesDisplay()
				gameEngine.displayRoutesTab()

			}
		})
	}

	purchasedCardHtml(): HTMLDivElement {
		var div = document.createElement("div")
		div.className = "bg-light border-box"
		div.appendChild(this.cardHtml())
		var runbutton = document.createElement("button")
		var collectbutton = document.createElement("button")
		if (this.timeRemaining()) {
			runbutton.setAttribute("disabled", "")
			runbutton.innerHTML = `Current route running, ready in ${this.timeRemaining()} seconds`
		} else {
			runbutton.addEventListener("click", makeClickWrapper(runbutton, () => this.run(runbutton)))
			runbutton.innerHTML = "Run Route"
		}
		collectbutton.addEventListener("click", makeClickWrapper(collectbutton, () => this.getResults(collectbutton)))
		const updatebutton = () => {
			if (this.timeRemaining() === 0) {
				if (!this.lastRunAt || this.lastResultedAt && this.lastResultedAt > this.lastRunAt) {
					collectbutton.setAttribute("disabled", "")
					hideElement(collectbutton)
					if (this.nextAvailableAt && new Date() < this.nextAvailableAt) {
						runbutton.innerHTML = "Plane is Refueling, Cleaning, Unloading. Ready in 1 minute"
					} else {
						runbutton.innerHTML = "Run Route"
						runbutton.removeAttribute("disabled")
					}
				} else {
					collectbutton.style.display = "inherit"
					collectbutton.innerHTML = "Show Results"
					collectbutton.removeAttribute("disabled")
				}
			} else {
				runbutton.setAttribute("disabled", "")
				collectbutton.setAttribute("disabled", "")
				hideElement(collectbutton)
				runbutton.innerHTML = `Current route running, ready in ${this.timeRemaining()} seconds`

			}
		}
		setInterval(updatebutton, 1000)
		updatebutton()
		div.appendChild(runbutton)
		div.appendChild(collectbutton)
		return div

	}
	cardHtml(): HTMLElement {
		var dl = dataLabels([
			["Distance", `${this.distance.toLocaleString("en-gb", { maximumFractionDigits: 0 })}km`],
			["Popularity", this.popularity.toLocaleString("en-gb")],
			["Cost", `$${this.purchaseCost.toLocaleString("en-gb")}`],
		])
		var card = document.createElement("div")
		card.className = "flex flex-column justify-content-between"
		card.innerHTML = `<h3>${this.fromAirport.code} <-> ${this.toAirport.code}</h3>`
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
	constructor(data) {
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
		btn.addEventListener("click", makeClickWrapper(btn, () => {
			$.ajax({
				method: "POST",
				url: "/plane/fix",
				data: {
					airlineId: airline.id,
					planeId: this.id
				},
				error: (x) => errHandler(x, btn),
				success: function(response) {
					var jresponse = JSON.parse(response)
					airline.planes = jresponse.planes.map(p => new Plane(p))
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
		btn.addEventListener("click", makeClickWrapper(btn, () => {
			$.ajax({
				method: "POST",
				url: "/plane/fix",
				data: {
					airlineId: airline.id,
					planeId: this.id
				},
				error: (x) => errHandler(x, btn),
				success: function(response) {
					var jresponse = JSON.parse(response)
					airline.planes = jresponse.planes.map(p => new Plane(p))
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
	planes: Array<Plane> = []
	routes: Array<Route> = []
	popularity: number
	transactions: Array<string> = []
	incidents: Array<string> = []
	constructor(data: any) {
		const { id, name, hub, joined_at, cash, planes, routes, popularity, transactions, incidents } = data
		this.id = id
		this.name = name
		this.hub = hub
		console.log('joined', joined_at)
		this.joined = new Date(joined_at)
		this.cash = cash
		this.planes = (planes || []).map(p => new Plane(p))
		this.routes = (routes || []).map(r => new Route(r))
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
		placeholder.appendChild(this.statsHtml())
	}
	addTransaction(msg: string): void {
		this.transactions.push(`${new Date()} ${prettyCashString(this.cash)} ${msg}`)
	}
	titleHtml(): HTMLElement {
		return createTitle(
			`${this.name}<strong>Hub: ${this.hub.code}</strong> <strong> Joined: ${this.joined.toLocaleDateString()} </strong>`,
			"h2",
		)
	}
	statsHtml(): HTMLElement {
		var dl = dataLabels([
			["Cash", prettyCashString(this.cash)],
			["Planes", String(this.planes.length)],
			["Routes", String(this.routes.length)],
			["Popularity", String(this.popularity)],
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
				airlineId: airline.id
			},
			error: (x) => errHandler(x),
			success: function(response) {
				JSON.parse(response).map(p => {
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
								airlineId: airline.id,
								planeId: plane.id,
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
		var div = document.createElement("div")
		div.appendChild(createTitle("Your Routes"))
		var routesContainer = document.createElement("div")
		this.routes.forEach(route => {
			routesContainer.appendChild(route.purchasedCardHtml())
		})
		div.appendChild(routesContainer)
		return div
	}
	getReputationDisplay(): HTMLElement {
		var div = document.createElement("div")
		var heading = document.createElement("h2")
		heading.innerHTML = "Reputation and Reviews"
		div.appendChild(heading)

		var p = document.createElement("p")
		var numStars = 0
		if (this.popularity > 79) {
			p.innerText = `Customers favorite airline in ${this.hub.country}!`
			numStars = 5
		} else if (this.popularity > 49) {
			p.innerText = `Customers secound favorite choice`
			numStars = 3
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
		var heading = document.createElement("h3")
		heading.innerHTML = "Finances"
		div.appendChild(heading)
		this.transactions.forEach(t => {
			div.appendChild(createParagraph(t))
		})
		return div
	}
	getAccidentsDisplay(): HTMLElement {
		var div = document.createElement("div")
		var heading = document.createElement("h2")
		heading.innerHTML = "Accidents"
		div.appendChild(heading)
		this.incidents.forEach(t => {
			div.appendChild(createParagraph(t))
		})
		return div
	}
}

class GameEngine {
	airline?: Airline
	airports: Array<Airport> = []
	routes: Array<Route> = []
	days: number = 0
	today: Date = new Date()
	registerAirline(airline: Airline): void {
		this.airline = airline
		displayInfo("Please Choose your new route.")
		this.displayRoutesTab()
	}

	progressDay(): void {
		this.days += 1
		this.today.setDate(this.today.getDate() + 1);
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
					airs = JSON.parse(response).map(a => new Airport(a))
					ge.airports = airs
					loadHubSelect(airs)
				}
			})
		}
	}
	displaySummaryTab(): void {
		const main = <HTMLElement>document.getElementById("main")
		main.innerHTML = ""
		var airline = <Airline>this.airline
		var heading = createTitle(airline.name)
		main.appendChild(heading)
		main.appendChild(airline.getReputationDisplay())
		main.appendChild(airline.getAccidentsDisplay())
	}
	displayFleetTab(): void {
		const main = <HTMLElement>document.getElementById("main")
		main.innerHTML = ""
		var airline = <Airline>this.airline
		main.appendChild(airline.getFleetDisplay())
	}
	displayRoutesTab(): void {
		const main = <HTMLElement>document.getElementById("main")
		main.innerHTML = ""
		var airline = <Airline>this.airline
		main.appendChild(airline.getRoutesDisplay())
		main.appendChild(createTitle("Routes Available For Purchase"))
		setLoader()
		$.ajax({
			method: "GET",
			url: "/offered_routes",
			data: {
				airlineId: airline.id,
			},
			error: (x) => errHandler(x),
			success: function(response) {
				unsetLoader()
				// console.log("Got offered routes", response)
				var div = document.getElementById("offered routes container")
				if (!div) {
					div = createElement("div", "offered routes container")
				}
				div.innerHTML = ""
				var routesToDisplay = JSON.parse(response).map(r => new OfferedRoute(r))
				routesToDisplay.forEach((r: OfferedRoute) => div.appendChild(r.buttonHtml()))
				main.appendChild(div)
				
			}
		})
	}
	displayReputationTab(): void {
		const main = <HTMLElement>document.getElementById("main")
		main.innerHTML = ""
		var airline = <Airline>this.airline
		main.appendChild(airline.getReputationDisplay())
	}
	displayFinanceTab(): void {
		const main = <HTMLElement>document.getElementById("main")
		main.innerHTML = ""
		var airline = <Airline>this.airline
		main.appendChild(airline.getFinanceDisplay())
	}
	displayAccidentsTab(): void {
		const main = <HTMLElement>document.getElementById("main")
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
			createElement("button", "viewCompany", "flex-grow dark", `Overview of ${(<Airline>this.airline).name}`),
			createElement("button", "viewFleet", "flex-grow dark", `Overview of Fleet`),
			createElement("button", "viewRoutes", "flex-grow dark", `Overview of Routes`),
			createElement("button", "viewReputation", "flex-grow dark", `Overview of Reputation`),
			createElement("button", "viewFinance", "flex-grow dark", `Overview of Finance`),
			createElement("button", "viewAccidents", "flex-grow dark", `Overview of Accidents`),
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


window.onload = () => {
	// Creating form to enter business name and to choose hub
	const form = <HTMLFormElement>document.getElementById("playForm")
	var nameRow = document.createElement("div")
	var nameLabel = document.createElement("label")
	nameLabel.setAttribute("for", "businessName")
	nameLabel.textContent = "What is your airline called?"
	var nameInput: HTMLInputElement = document.createElement("input")
	nameInput.setAttribute("type", "text")
	nameInput.setAttribute("name", "businessName")
	nameInput.setAttribute("required", "")
	nameRow.appendChild(nameLabel)
	nameRow.appendChild(nameInput)

	var hubRow = document.createElement("div")
	hubRow.setAttribute("id", "hubRow")
	var playBtn = document.createElement("button")
	playBtn.setAttribute("type", "submit")
	playBtn.textContent = "Play Now"
	playBtn.className = "primary"
	form.innerHTML = ""
	form.appendChild(nameRow)
	form.appendChild(hubRow)
	form.appendChild(playBtn)
	nameInput.setAttribute("value", randomBusinessName())
	form.addEventListener("submit", (e) => {
		var hubSelect = <HTMLSelectElement>document.getElementById("hubSelect")
		e.preventDefault()
		hideElement(form)
		setLoader()
		$.ajax({
			method: "POST",
			url: "/play",
			data: {
				businessName: nameInput.value,
				hub: hubSelect.value,
			},
			error: (x) => errHandler(x),
			success: function(response) {
				unsetLoader()
				// console.log(response)
				var airline = new Airline(JSON.parse(response))
				console.log('Logged in, airline=', airline)
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
	gameEngine.loadAirports()
	var logoImg = <HTMLImageElement>document.getElementById("logo")
	logoImg.addEventListener("click", () => {
		var oldSrc = logoImg.src
		var newSrc = prompt("Enter URL of your logo", oldSrc)
		if (newSrc) {
			logoImg.src = newSrc
		}
	})
}