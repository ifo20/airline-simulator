import logging

from werkzeug.middleware.lint import LintMiddleware
from werkzeug.middleware.profiler import ProfilerMiddleware

from app.main import app as application

logging.basicConfig(level=logging.INFO)

app = application
# app = LintMiddleware(app)
# app = ProfilerMiddleware(app)

if __name__ == "__main__":
	app.run()
