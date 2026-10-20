from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware
from database import get_connection
import mysql.connector

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174"
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class ProductCreate(BaseModel):
    name: str = Field(min_length=1)
    price: float = Field(gt=0)
    stock: int = Field(ge=0)


@app.get("/")
def home():
    return {"message": "AI Marketplace API is running"}


# 取得 MySQL 中的所有商品
@app.get("/api/products")
def get_products():
    connection = None
    cursor = None

    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT id, seller_id, name, price, stock,
                   description, image_url, created_at
            FROM products
            ORDER BY id DESC
        """)

        products = cursor.fetchall()

        for product in products:
            product["price"] = float(product["price"])
            product["store"] = "測試店家"

        return products

    except mysql.connector.Error:
        raise HTTPException(
            status_code=500,
            detail="讀取商品失敗"
        )

    finally:
        if cursor is not None:
            cursor.close()
        if connection is not None:
            connection.close()


# 新增商品到 MySQL
@app.post("/api/products")
def create_product(product: ProductCreate):
    connection = None
    cursor = None

    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        # 登入功能尚未完成，暫時使用賣家編號 1
        seller_id = 1

        # 相同賣家、名稱、價格：自動合併庫存
        cursor.execute("""
            INSERT INTO products (seller_id, name, price, stock)
            VALUES (%s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                stock = stock + %s
        """, (
            seller_id,
            product.name,
            product.price,
            product.stock,
            product.stock
        ))

        # 找出新增或合併後的商品
        cursor.execute("""
            SELECT id, seller_id, name, price, stock,
                   description, image_url, created_at
            FROM products
            WHERE seller_id = %s
              AND name = %s
              AND price = %s
        """, (
            seller_id,
            product.name,
            product.price
        ))

        saved_product = cursor.fetchone()

        connection.commit()

        saved_product["price"] = float(saved_product["price"])
        saved_product["store"] = "測試店家"

        return {
            "message": "商品新增或庫存更新成功",
            "product": saved_product
        }

    except mysql.connector.Error:
        if connection is not None:
            connection.rollback()

        raise HTTPException(
            status_code=500,
            detail="新增商品失敗"
        )

    finally:
        if cursor is not None:
            cursor.close()
        if connection is not None:
            connection.close()