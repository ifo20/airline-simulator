import logging

from app.main import app as application

logging.basicConfig(level=logging.INFO)

app = application
if __name__ == "__main__":
	app.run()
