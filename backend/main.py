from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware
from database import get_connection
import mysql.connector
from pathlib import Path
import shutil
import uuid

app = FastAPI()

from fastapi.staticfiles import StaticFiles

UPLOAD_DIR = Path(__file__).resolve().parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174"
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)


class ProductCreate(BaseModel):
    name: str = Field(min_length=1)
    price: float = Field(gt=0)
    stock: int = Field(ge=0)
    image_url: str | None = None    

class ProductStockUpdate(BaseModel):
    stock: int = Field(ge=0)

class ProductUpdate(BaseModel):
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
            INSERT INTO products (seller_id, name, price, stock, image_url)
            VALUES (%s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                stock = stock + VALUES(stock),
                image_url = COALESCE(VALUES(image_url), image_url)
        """, (
            seller_id,
            product.name,
            product.price,
            product.stock,
            product.image_url
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
@app.put("/api/products/{product_id}")
def update_product_stock(product_id: int, product: ProductStockUpdate):
    connection = None
    cursor = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute("""
            UPDATE products
            SET stock = %s
            WHERE id = %s
        """, (product.stock, product_id))

        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="找不到商品"
            )

        connection.commit()

        return {
            "message": "庫存修改成功",
            "product_id": product_id,
            "new_stock": product.stock
        }

    except mysql.connector.Error:
        if connection is not None:
            connection.rollback()

        raise HTTPException(
            status_code=500,
            detail="修改庫存失敗"
        )

    finally:
        if cursor is not None:
            cursor.close()
        if connection is not None:
            connection.close()

@app.put("/api/products/{product_id}/details")
def update_product_details(product_id: int, product: ProductUpdate):
    connection = None
    cursor = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        # 1. 先確認商品是否存在
        cursor.execute("""
            SELECT id
            FROM products
            WHERE id = %s AND seller_id = %s
        """, (product_id, 1))

        existing_product = cursor.fetchone()

        if existing_product is None:
            raise HTTPException(
                status_code=404,
                detail="找不到商品"
            )

        # 2. 修改商品資料
        cursor.execute("""
            UPDATE products
            SET name = %s,
                price = %s,
                stock = %s
            WHERE id = %s
              AND seller_id = %s
        """, (
            product.name,
            product.price,
            product.stock,
            product_id,
            1
        ))

        # 3. 儲存修改
        connection.commit()

        return {
            "message": "商品修改成功",
            "product_id": product_id
        }

    except mysql.connector.Error as error:
        if connection is not None:
            connection.rollback()

        if error.errno == 1062:
            raise HTTPException(
                status_code=409,
                detail="已有相同名稱與價格的商品"
            )

        raise HTTPException(
            status_code=500,
            detail="修改商品失敗"
        )

    finally:
        if cursor is not None:
            cursor.close()

        if connection is not None:
            connection.close()

@app.delete("/api/products/{product_id}")
def delete_product(product_id: int):
    connection = None
    cursor = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        seller_id = 1  # 暫時使用測試賣家

        cursor.execute("""
            DELETE FROM products
            WHERE id = %s AND seller_id = %s
        """, (product_id, seller_id))

        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="找不到商品"
            )

        connection.commit()

        return {
            "message": "商品刪除成功",
            "product_id": product_id
        }

    except mysql.connector.Error:
        if connection is not None:
            connection.rollback()

        raise HTTPException(
            status_code=500,
            detail="刪除商品失敗"
        )

    finally:
        if cursor is not None:
            cursor.close()

        if connection is not None:
            connection.close()

@app.post("/api/upload-image")
async def upload_image(file: UploadFile = File(...)):
    allowed_types = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp"
    }

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="只允許 JPG、PNG、WEBP 圖片"
        )

    extension = allowed_types[file.content_type]
    filename = f"{uuid.uuid4().hex}{extension}"
    file_path = UPLOAD_DIR / filename

    max_size = 5 * 1024 * 1024
    total_size = 0

    try:
        with open(file_path, "wb") as output:
            while chunk := await file.read(1024 * 1024):
                total_size += len(chunk)

                if total_size > max_size:
                    raise HTTPException(
                        status_code=413,
                        detail="圖片大小不能超過 5MB"
                    )

                output.write(chunk)

        return {
            "message": "圖片上傳成功",
            "image_url": f"http://127.0.0.1:8001/uploads/{filename}"
        }

    except Exception:
        file_path.unlink(missing_ok=True)
        raise

    finally:
        await file.close()