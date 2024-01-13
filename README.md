To run the backend:

```
. venv/bin/activate
DATABASE_URL="sslmode=disable host=localhost password=postgres user=postgres" PYTHONPATH=. python app/main.py
```

To set up:
```
python3 -m venv venv
. venv/bin/activate
pip install -r requirements.txt
```

To format python:
```
cd backend
. venv/bin/activate
black *.py
```

For typescript changes:
```
cd website
npm install (first time only)
tsc index.ts
```

To run the test client (the server should already be running):
```
PYTHONPATH=. python client/__init__.py
```

We currently have the following objects: 
- airline
- airport
- plane
- route

The player can make money by running routes.
