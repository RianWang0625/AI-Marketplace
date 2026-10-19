
import { useEffect, useState } from "react";
import "./App.css";
function App() {
  const [count, setCount] = useState(0)
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const total = Number(price) * count
  
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
  return (
    <div>
      <div>
        <h1>購物車</h1>
        <h2>購物車數量:{count}</h2>
        <button onClick={add}>
          增加商品
        </button>
        <button onClick={minus}>
          減少商品
        </button>
        <button onClick={clear}>
          已清空
        </button>
        <input type="text" value={name} onChange={changeName} />
        <input type="number" value={price} onChange={changePrice} />
      </div>
      <div>
        <h2>價格:{price}</h2>
        <h2>總價:{total}</h2>
        <h2>商品名稱:{name}</h2>
      </div>
    </div>
  );

}

export default App;