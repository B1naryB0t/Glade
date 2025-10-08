import pytest

# if FastAPI:
# from fastapi.testclient import TestClient
# from app.main import app

@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"

# @pytest.fixture()
# def client():
#       return TestClient(app)