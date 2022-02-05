from app.main import app as application
app = application
if __name__ == "__main__":
	print("WSGI PRINT")
	app.run()