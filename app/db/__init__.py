import os
import platform

from .mock import MockDatabase
from .postgresql import PostgresqlDatabase


def get_db():
    cls = get_db_type()
    return cls()


def get_db_type():
    if platform.system() == "Windows" or "DATABASE_URL" not in os.environ:
        return MockDatabase
    else:
        return PostgresqlDatabase


DatabaseInterface = get_db_type()