class Server:
    def __init__(self, database) -> None:
        self.db = database
        self.airlines = {}
        self.airports = {}

    def initialise(self):
        self.db.migrate()
        self.airports = {a.code: a for a in self.db.get_airports()}

    def get_airline(self, request):
        try:
            name = request.args["businessName"].strip()
        except KeyError:
            name = request.form["businessName"].strip()
        return self.db.get_airline_by_name(name)
