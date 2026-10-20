import os
import mysql.connector
from dotenv import load_dotenv

# 讀取 backend/.env 裡面的設定
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))


def get_connection():
    connection = mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME")
    )

    return connection


# 直接執行 database.py 時，測試資料庫連線
if __name__ == "__main__":
    try:
        connection = get_connection()

        if connection.is_connected():
            print("MySQL 連線成功！")

        connection.close()

    except mysql.connector.Error as error:
        print("MySQL 連線失敗：", error)