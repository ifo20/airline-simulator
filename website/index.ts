//////// HELPING FUNCTIONS
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
	identifier: string
	distance: number
	fromAirport: Airport
	toAirport: Airport
	popularity: number
	purchaseCost: number
	constructor(data) {
		const { identifier, distance, origin, destination, popularity, purchase_cost } = data
		this.identifier = identifier
		this.distance = distance
		this.fromAirport = origin
		this.toAirport = destination
		this.popularity = popularity
		this.purchaseCost = purchase_cost
	}
	buttonHtml(): HTMLButtonElement {
		var btn = document.createElement("button")
		btn.setAttribute("style", "background-color:#ddcc44aa")
		btn.appendChild(this.cardHtml())
		const { purchaseCost, popularity, identifier } = this
		const route = this
		btn.addEventListener("click", () => {
			var airline = <Airline>gameEngine.airline
			$.ajax({
				method: "POST",
				url: "/route",
				data: {
					businessName: airline.name,
					purchaseCost,
					origin: this.fromAirport.code,
					destination: this.toAirport.code,
					popularity, 
				},
				error: function(err) {
					displayError(String(err))
				},
				success: function(response) {
					var route = new Route(JSON.parse(response))
					airline.routes.push(route)
					airline.cash -= purchaseCost
					airline.transactions.push(`${new Date()} $${airline.cash} Purchased route ${identifier} for ${prettyCashString(purchaseCost)}`)
					displayInfo("Route purchased!")
					gameEngine.displayRoutesTab()
					airline.updateStats()					
				}
			})
		})
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
	identifier: string
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
		const { distance, origin, destination, popularity, purchase_cost, last_run, last_result, next_available, plane } = data
		this.identifier = [origin.code, destination.code].sort().join("-")
		this.fromAirport = origin
		this.toAirport = destination
		this.distance = distance
		this.popularity = popularity
		this.purchaseCost = purchase_cost
		this.lastRunAt = last_run
		this.lastResultedAt = last_result
		this.nextAvailableAt = next_available
		this.plane = plane
	}
	flightDuration(): number {
		return this.distance / 20
	}
	timeRemaining(): number {
		var now = new Date()
		if (this.lastRunAt) {
			var secondsSinceLastRun = (+now - +this.lastRunAt) / 1000
			var runTimeSeconds = this.flightDuration()
			return Math.max(0, Math.floor((runTimeSeconds - secondsSinceLastRun)))
		}
		return 0
	}
	canRun(): boolean {
		var plane = null
		gameEngine.airline?.planes.forEach(p => {
			if (!p.flying && p.maxDistance >= this.distance) {
				plane = p
				console.log("picked plane",plane,this)
			} else {
				console.log("could not pick plane",p,p.flying,this)
			}
		})
		if (plane) {
			if (this.timeRemaining() <= 0) {
				plane = <Plane>plane
				plane.flying = true
				this.plane = plane
				return true
			} else {
				return false
			}
		}
		displayError("No planes available to run route, go to the Fleet tab")
		return false
	}
	run(): boolean {
		if (!this.canRun()) {
			return false
		}
		console.log("running route", this.lastRunAt, this.timeRemaining())
		this.lastRunAt = new Date()
		this.nextAvailableAt = new Date(new Date().getTime() + 60000 + 1000 * this.flightDuration())
		var airline = <Airline>gameEngine.airline
		airline.updateStats()
		airline.getRoutesDisplay()
		return true
	}
	getResults() {
		this.lastResultedAt = new Date()
		var numPassengers = this.dailyPassengers()
		var income = 10 * numPassengers
		var cost = 500 + Math.ceil(Math.random() * 500)
		var profit = income - cost
		displayInfo(`Route running with ${numPassengers} passengers earning ${prettyCashString(profit)} profit`)
		var airline = <Airline>gameEngine.airline
		airline.cash += profit
		var eventCost = 0
		var healthCost = 1
		var popularityChange = 1
		var incidentText, infoText = null
		if (Math.random() < 0.1) {
			eventCost = 2000 + Math.ceil(Math.random() * 2000)
			popularityChange = 5
			incidentText = `Engine fire costing ${prettyCashString(eventCost)} and ${popularityChange} reputation`
			infoText = "There was an engine fire! See Accidents tab for details"
			healthCost = 80
		} else if (Math.random() < 0.1) {
			eventCost = 100 + Math.ceil(Math.random() * 200)
			popularityChange = 1
			incidentText = `Smoke in cabin ${prettyCashString(eventCost)} and ${popularityChange} reputation`
			infoText = "Smoke in cabin! See Accidents tab for details"
			healthCost = 80
		}
		(<Plane>this.plane).health -= healthCost
		airline.cash -= eventCost;

		(<Plane>this.plane).flying = false
		this.plane = undefined
		airline.changePopularity( popularityChange)
		airline.updateStats()
		if (infoText) {
			displayInfo(infoText)
		}
		if (incidentText) {
			airline.incidents.push(`${new Date()} ${incidentText}`)
		}
		airline.getRoutesDisplay()
	}
	dailyPassengers(): number {
		return Math.ceil(this.popularity * (10 + Math.random() * 10))
	}

	purchasedCardHtml(): HTMLDivElement {
		var div = document.createElement("div")
		div.className = "bg-light border-box"
		div.appendChild(this.cardHtml())
		var runbutton = document.createElement("button")
		var collectbutton = document.createElement("button")
		runbutton.innerHTML = "Run Route"
		runbutton.addEventListener("click", () => {
			if (this.run()) {
				runbutton.setAttribute("disabled", "")
				runbutton.innerHTML = `Current route running, ready in ${this.timeRemaining()} seconds ${this.plane?.name}`

			}
		})
		collectbutton.addEventListener("click", () => {
			this.getResults()
		})
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
				runbutton.innerHTML = `Current route running, ready in ${this.timeRemaining()} seconds ${this.plane?.name}`

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
	flying: boolean
	health: number
	maxDistance: number
	cost: number
	constructor(data) {
		const { id, name, flying, health, max_distance, purchase_cost } = data
		this.id = id
		this.name = name
		this.flying = flying
		this.health = health
		this.maxDistance = max_distance
		this.cost = purchase_cost
	}
	purchasedCardHtml(): HTMLElement {
		var div = document.createElement("div")
		div.className = "bg-light border-box"
		var dl = dataLabels([
			["Name", `${this.name}`],
			["Flying", `${this.flying}`],
			["Maxdistance", `${this.maxDistance}`],
			["health", this.health.toLocaleString("en-gb")],
		])
		var card = document.createElement("div")
		card.innerHTML = `<h3>${this.name} </h3>`
		card.appendChild(dl)
		div.appendChild(card)
		var status 
		
		if (!this.flying && this.health >= 30) {
			status = "Available"
		} else if (this.flying) {
			status = "inflight"
		} else {
			status = "maintenance"
			card.appendChild(this.maintenanceHtml())
		}
		card.className = `flex flex-column justify-content-between ${status}` 
		card.appendChild(createParagraph(status))
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
		var div = this.displayHtml()
		var btn = document.createElement("button")
		btn.innerText = "Fix for $100,000"
		div.appendChild(btn)
		btn.addEventListener("click", () => {
			var airline = <Airline>gameEngine.airline
			if (airline.cash < 100000) {
				displayError("You cannot afford this fix!")
				return
			}
			airline.cash -= 100000
			this.health = 100
			airline.transactions.push(`${new Date()} $100,000 Fixed plane ${this.id}`)
			displayInfo("Plane fixed!")
			gameEngine.displayFleetTab()
			airline.updateStats()
		})
		var btn = document.createElement("button")
		btn.innerText = "Sell to  Mojave scrapyard for $10,000"
		div.appendChild(btn)
		btn.addEventListener("click", () => {
			var airline = <Airline>gameEngine.airline
			airline.cash += 10000
			airline.transactions.push(`${new Date()} +$10,000 Sold plane ${this.id} to scrapyard`)
			displayInfo("Plane sold!")
			airline.planes = airline.planes.filter(p => p.id !== this.id)
			gameEngine.displayFleetTab()
			airline.updateStats()
		})
		return div
	}
}
class Airline {
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
		const { name, hub, joined, cash, planes, routes, popularity, transactions, incidents } = data
		this.name = name
		this.hub = hub
		this.joined = new Date(joined)
		this.cash = cash
		this.planes = planes.map(p => new Plane(p))
		this.routes = routes.map(r => new Route(r))
		this.popularity = popularity
		this.transactions = transactions
		this.incidents = incidents

	}
	changePopularity(amount: number): void {
		this.popularity += amount
		if (this.popularity <= 0) {
			gameEngine.gameOver()
		}
	}
	updateTitle(): void {
		var div = <HTMLElement>document.getElementById("airlineTitle")
		div.appendChild(this.titleHtml())

	}
	updateStats(): void {
		const placeholder = <HTMLElement>document.getElementById("airlineStats")
		placeholder.innerHTML = ""
		placeholder.appendChild(this.statsHtml())
	}
	sparePlanes(): number {
		return this.planes.length - this.routes.length
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

		$.ajax({
			method: "GET",
			url: "/planes",
			data: {},
			error: function(err) {
				displayError(String(err))
			},
			success: function(response) {
				JSON.parse(response).map(p => {
					var plane = new Plane(p)
					var button = document.createElement("button")
					button.setAttribute("style", "margin: 0.5rem")
					const airplaneCost = plane.cost
					div.appendChild(createParagraph(`You can buy ${plane.name}, which flies up to ${plane.maxDistance.toLocaleString("en-gb", { maximumFractionDigits: 0 })}km plane for ${prettyCashString(airplaneCost)}`))
					button.innerHTML = `Buy plane for ${prettyCashString(airplaneCost).toLocaleString()}`
					button.addEventListener("click", () => {
						$.ajax({
							method: "POST",
							url: "/plane",
							data: {
								"businessName": airline.name,
								"planeId": plane.id,
							},
							error: function(err) {
								displayError(String(err))
							},
							success: function(response) {
								var r = JSON.parse(response)
								airline.cash = r.cash
								airline.transactions.push(`${new Date()} ${prettyCashString(airline.cash)} Purchased plane for ${prettyCashString(airplaneCost)}`)
								airline.planes.push(new Plane(r.plane))
								airline.updateStats()
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
			$.ajax({
				url: "/airports",
				success: function(response) {
					console.log("Got airports", response)
					airs = JSON.parse(response).map(a => new Airport(a))
					console.log(airs)
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
		$.ajax({
			method: "GET",
			url: "/routes",
			data: {
				businessName: airline.name,
			},
			success: function(response) {
				console.log("Got offered routes", response)
				var div = document.createElement("div")
				var routesToDisplay = JSON.parse(response).map(r => new OfferedRoute(r))
				routesToDisplay.forEach(r => div.appendChild(r.buttonHtml()))
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
	getAirport(code: string): Airport | void {
		var airport;
		this.airports.forEach(a => {
			if (a.code === code) {
				airport = a
			}
		})
		console.log("searched airport", code, "returning", airport, "from", this.airports)
		return airport
	}
	showAirports(): void {
		const main = <HTMLElement>document.getElementById("main")
		this.airports.forEach((a) => {
			main.appendChild(a.cardHtml())
		})
	}
	showRoutes(): void {
		const main = <HTMLElement>document.getElementById("main")
		this.routes.forEach(r => {
			main.appendChild(r.cardHtml())
		})
	}
	gameOver(): void {
		const main = <HTMLElement>document.getElementById("main")
		main.innerHTML = "<h1 style='color:red;'>GAMEOVER</h1>"
	}
	createSideMenu(): void {
		var sideMenu = <HTMLElement>document.getElementById("sidemenu")
		var companyBtn = createElement("button", "viewCompany", "flex-grow", `Overview of ${(<Airline>this.airline).name}`)
		var fleetBtn = createElement("button", "viewFleet", "flex-grow", `Overview of Fleet`)
		var routesBtn = createElement("button", "viewRoutes", "flex-grow", `Overview of Routes`)
		var reputationBtn = createElement("button", "viewReputation", "flex-grow", `Overview of Reputation`)
		var financeBtn = createElement("button", "viewFinance", "flex-grow", `Overview of Finance`)
		var accidentsBtn = createElement("button", "viewAccidents", "flex-grow", `Overview of Accidents`)
		const main = <HTMLElement>document.getElementById("main")
		companyBtn.addEventListener("click", () => gameEngine.displaySummaryTab())
		fleetBtn.addEventListener("click", () => gameEngine.displayFleetTab())
		routesBtn.addEventListener("click", () => gameEngine.displayRoutesTab())
		reputationBtn.addEventListener("click", () => gameEngine.displayReputationTab())
		financeBtn.addEventListener("click", () => gameEngine.displayFinanceTab())
		accidentsBtn.addEventListener("click", () => gameEngine.displayAccidentsTab())
		sideMenu.appendChild(companyBtn)
		sideMenu.appendChild(fleetBtn)
		sideMenu.appendChild(routesBtn)
		sideMenu.appendChild(reputationBtn)
		sideMenu.appendChild(financeBtn)
		sideMenu.appendChild(accidentsBtn)
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
		$.ajax({
			method: "POST",
			url: "/play",
			data: {
				"businessName": nameInput.value,
				"hub": hubSelect.value,
			},
			success: function(response) {
				console.log(response)
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
			}
		})
	})
	gameEngine.loadAirports()
}