
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "AI Marketplace API is running"}

@app.get("/api/products")
def get_products():
    return [
        {
            "id": 1,
            "name": "機械式鍵盤",
            "price": 1500,
            "store": "科技商店 A"
        },
        {
            "id": 2,
            "name": "無線滑鼠",
            "price": 890,
            "store": "科技商店 B"
        },
        {
            "id": 3,
            "name": "電競耳機",
            "price": 2200,
            "store": "遊戲商店 C"
        }

]
