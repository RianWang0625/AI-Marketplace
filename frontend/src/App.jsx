
import { useState } from "react";
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
  function addProduct() {
    if (!productName.trim() || productPrice === "" || productStock === "") {
      alert("請填寫完整商品資料");
      return;
    }

    if (Number(productPrice) <= 0 || Number(productStock) < 0) {
      alert("請輸入正確的價格與庫存");
      return;
    }

    const newProduct = {
      id: Date.now(),
      name: productName,
      price: Number(productPrice),
      stock: Number(productStock)
    };

    setProducts([...products, newProduct]);

    setProductName("");
    setProductPrice("");
    setProductStock("");

    alert("商品新增成功！");
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
            <div>
              {products.map((item) => (
                <div key={item.id}>
                  <h3>{item.name}</h3>
                  <p>價格：{item.price} 元</p>
                  <p>庫存：{item.stock} 件</p>

                  <button onClick={() => addToCart(item)}>
                    加入購物車
                  </button>
                </div>
              ))}
            </div>
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

          <button onClick={addProduct}>
            確認新增商品
          </button>
        </div>
      ) : page === "myProducts" ? (
        <div>
          <h2>我的商品</h2>

          {products.map((item) => (
            <div key={item.id}>
              <h3>{item.name}</h3>
              <p>價格：{item.price} 元</p>
              <p>庫存：{item.stock} 件</p>
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

export default App;