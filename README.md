To run the backend:

```
python3 -m venv venv
. venv/bin/activate
pip install -r requirements.txt
PYTHONPATH=. python app/main.py
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