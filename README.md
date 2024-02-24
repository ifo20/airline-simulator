# Airline Tycoon Simulator

## Quickstart instructions

Quickstart (backend):

```
. venv/bin/activate
DATABASE_URL="sslmode=disable host=localhost password=postgres user=postgres" PYTHONPATH=. python app/main.py
```

Compile frontend (from inside website folder):
```
tsc index.ts
```

First-time set up:
```
python3 -m venv venv
. venv/bin/activate
pip install -r requirements.txt
cd website && npm install && tsc index.ts
```

To run the test client (the server should already be running):
```
PYTHONPATH=. python client/__init__.py
```

## Upcoming improvements
- Design/colouring improvements
- Include more plane attributes e.g. capacity
- ???

## Extension homework exercises for Justin
1. Read about the formatting options available in this README.md file: https://www.markdownguide.org/basic-syntax/ (if you have a suitable extension installed, there is a 'preview' command; try ctrl+shift+v or search in ctrl+shift+p)
2. Obtain a data source to use for our population of planes
3. Read about "storing passwords in plaintext" (google it), and why we shouldn't be doing this (we currently are)

