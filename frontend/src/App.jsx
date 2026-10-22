
import { useState, useEffect, useRef } from "react";
import "./App.css";
function App() {
  const [count, setCount] = useState(0)
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const total = Number(price) * count
  const [page, setPage] = useState("buyer");
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productStock, setProductStock] = useState("");
  const [searchText, setSearchText] = useState("");
  const [productImage, setProductImage] = useState(null);
  const [editingImages, setEditingImages] = useState({});
  const [previewUrl, setPreviewUrl] = useState("");
  const imageInputRef = useRef(null);

  useEffect(() => {
    if (!productImage) {
      setPreviewUrl("");
      return;
    }

    const url = URL.createObjectURL(productImage);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [productImage]);

  useEffect(() => {
    fetch("http://127.0.0.1:8001/api/products")
      .then((response) => {
        if (!response.ok) {
          throw new Error("商品資料取得失敗");
        }
        return response.json();
      })
      .then((data) => {
        setProducts(data);
      })
      .catch((error) => {
        console.error("API 錯誤：", error);
      });
  }, []);

  function add() {
    setCount(count + 1)
  }

  function minus() {
    if (count > 0) {
      setCount(count - 1)
    }
    else {
      alert("已為0")
    }
  }

  function clear() {
    if (count > 0) {
      setCount(0)
    }
    else {
      alert("已為0")
    }
  }

  function changeName(event) {
    setName(event.target.value);
  }

  function changePrice(event) {
    setPrice(event.target.value);
  }
  async function addProduct() {
    if (!productName.trim() || productPrice === "" || productStock === "") {
      alert("請填寫完整商品資料");
      return;
    }

    if (
      Number(productPrice) <= 0 ||
      Number(productStock) < 0 ||
      !Number.isInteger(Number(productStock))
    ) {
      alert("請輸入正確的價格與庫存");
      return;
    }

    try {
      // 1. 預設沒有商品圖片
      let imageUrl = null;

      // 2. 如果賣家有選擇圖片，先上傳
      if (productImage) {
        const formData = new FormData();

        formData.append("file", productImage);

        const uploadResponse = await fetch(
          "http://127.0.0.1:8001/api/upload-image",
          {
            method: "POST",
            body: formData
          }
        );

        if (!uploadResponse.ok) {
          throw new Error("圖片上傳失敗");
        }


        const uploadData = await uploadResponse.json();

        imageUrl = uploadData.image_url;
      }

      // 3. 將商品資料與圖片網址一起送到 FastAPI
      const response = await fetch(
        "http://127.0.0.1:8001/api/products",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: productName.trim(),
            price: Number(productPrice),
            stock: Number(productStock),
            image_url: imageUrl
          })
        }
      );

      if (!response.ok) {
        throw new Error("商品新增失敗");
      }

      const data = await response.json();

      // 4. 更新商品列表
      setProducts((prevProducts) => {
        const exists = prevProducts.some(
          (item) => item.id === data.product.id
        );

        if (exists) {
          return prevProducts.map((item) =>
            item.id === data.product.id ? data.product : item
          );
        }

        return [data.product, ...prevProducts];
      });

      // 5. 清空表單
      setProductName("");
      setProductPrice("");
      setProductStock("");
      setProductImage(null);
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }

      alert("商品新增成功！");
    } catch (error) {
      console.error("新增商品錯誤：", error);
      alert(error.message || "商品新增失敗");
    }
  }
  function addToCart(product) {
    const existingItem = cart.find(
      (item) => item.id === product.id
    );

    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        alert("庫存不足");
        return;
      }

      setCart(
        cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      if (product.stock <= 0) {
        alert("商品已售完");
        return;
      }

      setCart([
        ...cart,
        { ...product, quantity: 1 }
      ]);
    }
  }

  function increaseQuantity(id) {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === id && item.quantity < item.stock
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  }

  function decreaseQuantity(id) {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === id && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
    );
  }

  function removeFromCart(id) {
    setCart((prevCart) =>
      prevCart.filter((item) => item.id !== id)
    );
  }

  return (
    <div>
      <h1>AI Marketplace</h1>

      <button onClick={() => setPage("buyer")}>
        買家專區
      </button>

      <button onClick={() => setPage("cart")}>
        購物車
      </button>

      <div className="dropdown">
        <button onClick={() => setPage("seller")}>
          賣家專區 ▾
        </button>

        <div className="dropdown-menu">
          <button onClick={() => setPage("addProduct")}>
            販賣物品
          </button>

          <button onClick={() => setPage("myProducts")}>
            我的商品
          </button>

          <button onClick={() => setPage("orders")}>
            訂單管理
          </button>
        </div>
      </div>

      {page === "buyer" ? (
        <div>
          <h2>買家專區</h2>
          <h3>
            購物車數量：
            {cart.reduce((total, item) => total + item.quantity, 0)}
          </h3>
          {products.length === 0 ? (
            <p>目前沒有商品</p>
          ) : (

            <>
              <div className="buyer-search">
                <span className="search-icon">⌕</span>

                <input
                  type="text"
                  placeholder="搜尋商品名稱、品牌或關鍵字..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />

                {searchText && (
                  <button
                    type="button"
                    className="search-clear"
                    onClick={() => setSearchText("")}
                  >
                    清除
                  </button>
                )}
              </div>

              <div className="buyer-product-grid">
                {products
                  .filter((item) =>
                    item.name.toLowerCase().includes(searchText.trim().toLowerCase())
                  )
                  .map((item) => (
                    <div className="buyer-product-card" key={item.id}>
                      <div className="product-image">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} />
                        ) : (
                          <span>暫無商品圖片</span>
                        )}
                      </div>
                      <h3>{item.name}</h3>
                      <p>價格：{item.price} 元</p>
                      <p>庫存：{item.stock} 件</p>

                      <button onClick={() => addToCart(item)}>
                        加入購物車
                      </button>
                    </div>
                  ))}
              </div>
            </>
          )}
        </div>
      ) : page === "cart" ? (
        <div>
          <h2>我的購物車</h2>

          {cart.length === 0 ? (
            <p>購物車目前沒有商品</p>
          ) : (
            <div>
              {cart.map((item) => (
                <div key={item.id}>
                  <h3>{item.name}</h3>
                  <p>單價：{item.price} 元</p>
                  <p>
                    數量：
                    <button
                      onClick={() => decreaseQuantity(item.id)}
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>

                    {item.quantity}

                    <button
                      onClick={() => increaseQuantity(item.id)}
                      disabled={item.quantity >= item.stock}
                    >
                      +
                    </button>
                  </p>

                  <button onClick={() => removeFromCart(item.id)}>
                    移除商品
                  </button>
                  <p>小計：{item.price * item.quantity} 元</p>
                </div>
              ))}

              <h2>
                總金額：
                {cart.reduce(
                  (total, item) => total + item.price * item.quantity,
                  0
                )} 元
              </h2>
            </div>
          )}
        </div>
      ) : page === "addProduct" ? (
        <div>
          <h2>新增商品</h2>

          <div>
            <label>商品名稱：</label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
            />
          </div>

          <div>
            <label>商品價格：</label>
            <input
              type="number"
              min="0"
              value={productPrice}
              onChange={(e) => setProductPrice(e.target.value)}
            />
          </div>

          <div>
            <label>商品庫存：</label>
            <input
              type="number"
              min="0"
              step="1"
              value={productStock}
              onChange={(e) => setProductStock(e.target.value)}
            />
          </div>

          <div>
            <label>商品圖片：</label>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                setProductImage(e.target.files[0] || null);
              }}
            />
            {productImage && (
              <div>
                <p>圖片預覽：</p>
                <img
                  src={previewUrl}
                  alt="商品預覽"
                  style={{
                    width: "150px",
                    height: "150px",
                    objectFit: "cover",
                  }}
                />
              </div>
            )}
          </div>

          <button onClick={addProduct}>
            確認新增商品
          </button>
        </div>
      ) : page === "myProducts" ? (
        <div className="seller-container">
          <h2>我的商品</h2>

          {products.map((item) => (
            <div key={item.id} className="seller-product-card">
              <h3>{item.name}</h3>
              <p>價格：{item.price} 元</p>
              <p>目前庫存：{item.stock} 件</p>
              <div className="seller-form-field">
                <label>修改商品名稱：</label>
                <input
                  type="text"
                  defaultValue={item.name}
                  id={`name-${item.id}`}
                />
              </div>
              <div className="seller-form-field">
                <label>修改商品價格：</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  defaultValue={item.price}
                  id={`price-${item.id}`}
                />
              </div>

              <div className="seller-form-field">
                <label>修改商品庫存：</label>

                <input
                  type="number"
                  min="0"
                  defaultValue={item.stock}
                  id={`stock-${item.id}`}
                />
              </div>

              <div className="seller-form-field">
                <label>更換商品圖片：</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files[0];

                    setEditingImages((prev) => ({
                      ...prev,
                      [item.id]: file || null,
                    }));
                  }}
                />
              </div>
              <EditImagePreview file={editingImages[item.id]} />
              <button
                onClick={async () => {
                  const newName = document
                    .getElementById(`name-${item.id}`)
                    .value.trim();

                  const priceText = document
                    .getElementById(`price-${item.id}`)
                    .value;

                  const newPrice = Number(priceText);

                  const stockText = document.getElementById(
                    `stock-${item.id}`
                  ).value;

                  const newStock = Number(stockText);

                  const newImage = editingImages[item.id] || null;

                  if (
                    !newName ||
                    priceText === "" ||
                    !Number.isFinite(newPrice) ||
                    newPrice <= 0
                  ) {
                    alert("請輸入正確的商品名稱與價格");
                    return;
                  }

                  if (
                    stockText.trim() === "" ||
                    !Number.isInteger(newStock) ||
                    newStock < 0
                  ) {
                    alert("請輸入正確的商品庫存（0 或正整數）");
                    return;
                  }
                  try {
                    let imageUrl = null;

                    if (newImage) {
                      const formData = new FormData();
                      formData.append("file", newImage);

                      const uploadResponse = await fetch(
                        "http://127.0.0.1:8001/api/upload-image",
                        {
                          method: "POST",
                          body: formData,
                        }
                      );

                      if (!uploadResponse.ok) {
                        throw new Error("新圖片上傳失敗");
                      }

                      const uploadData = await uploadResponse.json();
                      imageUrl = uploadData.image_url;
                    }

                    console.log("庫存輸入值：", stockText);
                    console.log("準備送出的庫存：", newStock);

                    const response = await fetch(
                      `http://127.0.0.1:8001/api/products/${item.id}/details`,

                      {
                        method: "PUT",
                        headers: {
                          "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                          name: newName,
                          price: newPrice,
                          stock: newStock,
                          image_url: imageUrl
                        })
                      }
                    );

                    if (!response.ok) {
                      throw new Error("修改商品失敗");
                    }

                    setProducts((prevProducts) =>
                      prevProducts.map((product) =>
                        product.id === item.id
                          ? {
                            ...product,
                            name: newName,
                            price: newPrice,
                            stock: newStock,
                            image_url: imageUrl ?? product.image_url
                          }
                          : product
                      )
                    );

                    alert("商品資訊修改成功！");
                  } catch (error) {
                    alert(error.message);
                  }
                }}
              >
                儲存所有修改
              </button>

              <button
                onClick={async () => {
                  const confirmed = window.confirm(
                    `確定要刪除「${item.name}」嗎？刪除後無法復原。`
                  );

                  if (!confirmed) {
                    return;
                  }

                  try {
                    const response = await fetch(
                      `http://127.0.0.1:8001/api/products/${item.id}`,
                      {
                        method: "DELETE"
                      }
                    );

                    if (!response.ok) {
                      throw new Error("刪除商品失敗");
                    }

                    setProducts((prevProducts) =>
                      prevProducts.filter(
                        (product) => product.id !== item.id
                      )
                    );

                    alert("商品刪除成功！");
                  } catch (error) {
                    alert(error.message);
                  }
                }}
              >
                刪除商品
              </button>
            </div>
          ))}

        </div>
      ) : page === "orders" ? (
        <div>
          <h2>訂單管理</h2>
          <p>這裡之後會顯示買家的訂單。</p>
        </div>
      ) : (
        <div>
          <h2>賣家專區</h2>
          <p>請從上方選單選擇功能。</p>
        </div>
      )}
    </div>
  );

}

function EditImagePreview({ file }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!file) {
      setUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  if (!file || !url) {
    return null;
  }

  return (
    <div className="seller-form-field">
      <p>新商品圖片預覽：</p>
      <img
        src={url}
        alt="新商品圖片預覽"
        style={{
          width: "150px",
          height: "150px",
          objectFit: "contain",
        }}
      />
    </div>
  );
}
export default App;