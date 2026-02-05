import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Css/RecipeManagement.css";

const API_BASE = "http://localhost:3003";

export default function RecipeManagement() {
  const [data, setData] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // Trạng thái form thêm nguyên liệu
  const [activeProductId, setActiveProductId] = useState(null);
  const [newIng, setNewIng] = useState({ 
    ingredient_id: "", 
    amount: "", 
    unit: "", 
    display_name: "" 
  });

  useEffect(() => {
    fetchData();
    fetchIngredients();
  }, []);

  // Lấy dữ liệu tổng hợp (đã gộp NL và Bước làm từ Backend)
  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/recipes-list`);
      setData(res.data || []);
    } catch (err) {
      console.error("Lỗi fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchIngredients = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/ingredients`);
      setIngredients(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  /* ================== THAO TÁC NGUYÊN LIỆU ================== */
  const handleAddIng = async (pId) => {
    if (!newIng.ingredient_id || !newIng.amount) return alert("Nhập đủ thông tin!");
    await axios.post(`${API_BASE}/api/recipes`, {
      product_id: pId,
      ingredient_id: newIng.ingredient_id,
      amount: newIng.amount,
      unit: newIng.unit,
    });
    setActiveProductId(null);
    fetchData();
  };

  const handleDeleteIng = async (rId) => {
    if (window.confirm("Xóa nguyên liệu này?")) {
      await axios.delete(`${API_BASE}/api/recipes/${rId}`);
      fetchData();
    }
  };

  const handleEditIng = async (recipe) => {
    const newQty = prompt(`Sửa lượng cho ${recipe.ingredient_name}:`, recipe.amount);
    const newUnit = prompt("Sửa đơn vị:", recipe.unit);
    if (newQty && newUnit) {
      await axios.put(`${API_BASE}/api/recipes/${recipe.recipe_id}`, { amount: newQty, unit: newUnit });
      fetchData();
    }
  };

  /* ================== THAO TÁC QUY TRÌNH (STEPS) ================== */
  const handleEditSteps = async (product) => {
    // Lấy chuỗi các bước hiện tại để hiện lên prompt cho dễ sửa
    const currentStepsStr = product.steps?.map(s => `${s.step_number}. ${s.description}`).join("\n") || "";
    
    const input = prompt(
      `Quy trình làm món: ${product.product_name}\n(Nhập mỗi bước 1 dòng, hệ thống tự đánh số):`, 
      currentStepsStr
    );

    if (input !== null) {
      const stepLines = input.split("\n").filter(line => line.trim() !== "");
      const formattedSteps = stepLines.map((line, index) => ({
        step_number: index + 1,
        description: line.replace(/^\d+\.\s*/, "") // Dọn bỏ số thứ tự cũ nếu người dùng gõ vào
      }));

      try {
        await axios.post(`${API_BASE}/api/products/${product.product_id}/steps`, { steps: formattedSteps });
        fetchData();
      } catch (err) {
        alert("Lỗi cập nhật quy trình!");
      }
    }
  };

  if (loading) return <div className="loading-screen">🌸 Đang tải công thức Sakura...</div>;

  return (
    <div className="recipe-mgmt-container">
      <div className="recipe-header">
        <h2>📜 QUẢN LÝ CÔNG THỨC & QUY TRÌNH</h2>
        <input 
          type="text" 
          placeholder="Tìm tên món ăn..." 
          className="search-input"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="recipe-grid">
        {data
          .filter(p => p.product_name.toLowerCase().includes(searchTerm.toLowerCase()))
          .map((product) => (
            <div key={product.product_id} className="recipe-card">
              {/* PHẦN TRÁI: INFO */}
              <div className="card-sidebar">
                <span className="p-id">ID: #{product.product_id}</span>
                <h4>{product.product_name}</h4>
                <div className="p-category">{product.category_name}</div>
                <button className="btn-add-trigger" onClick={() => setActiveProductId(product.product_id)}>
                  + Nguyên Liệu
                </button>
              </div>

              {/* PHẦN PHẢI: CHI TIẾT */}
              <div className="card-main">
                {/* 1. Bảng Nguyên liệu */}
                <div className="sub-section">
                  <div className="section-header">🛒 Thành phần định mức</div>
                  
                  {activeProductId === product.product_id && (
                    <div className="ing-inline-form">
                      <input 
                        list="ing-list" 
                        placeholder="Chọn NL..." 
                        onChange={(e) => {
                          const match = ingredients.find(i => i.name === e.target.value);
                          if (match) setNewIng({...newIng, ingredient_id: match.ingredient_id, display_name: match.name});
                        }} 
                      />
                      <datalist id="ing-list">
                        {ingredients.map(i => <option key={i.ingredient_id} value={i.name}>{i.ingredient_id}</option>)}
                      </datalist>
                      <input className="w-50" placeholder="SL" onChange={e => setNewIng({...newIng, amount: e.target.value})} />
                      <input className="w-50" placeholder="ĐV" onChange={e => setNewIng({...newIng, unit: e.target.value})} />
                      <button className="btn-save" onClick={() => handleAddIng(product.product_id)}>Lưu</button>
                      <button className="btn-cancel" onClick={() => setActiveProductId(null)}>Hủy</button>
                    </div>
                  )}

                  <table className="ing-table">
                    <thead>
                      <tr><th>Mã</th><th>Tên nguyên liệu</th><th>Lượng</th><th>ĐV</th><th>Thao tác</th></tr>
                    </thead>
                    <tbody>
                      {product.details.length > 0 ? (
                        product.details.map(r => (
                          <tr key={r.recipe_id}>
                            <td className="txt-pink">#{r.ingredient_id}</td>
                            <td>{r.ingredient_name}</td>
                            <td>{r.amount}</td>
                            <td>{r.unit}</td>
                            <td>
                              <button className="btn-icon" onClick={() => handleEditIng(r)}>✏️</button>
                              <button className="btn-icon" onClick={() => handleDeleteIng(r.recipe_id)}>🗑️</button>
                            </td>
                          </tr>
                        ))
                      ) : <tr><td colSpan="5" className="txt-muted">Chưa có nguyên liệu.</td></tr>}
                    </tbody>
                  </table>
                </div>

                {/* 2. Quy trình làm (Đã lấy được từ mảng steps) */}
                <div className="sub-section steps-bg">
                  <div className="section-header">
                    <span>📝 Quy trình thực hiện</span>
                    <button className="btn-edit-steps" onClick={() => handleEditSteps(product)}>✏️ Sửa cách làm</button>
                  </div>
                  <div className="steps-list-container">
                    {product.steps && product.steps.length > 0 ? (
                      <ul className="steps-list">
                        {product.steps.map(s => (
                          <li key={s.step_id}>
                            <span className="step-count">Bước {s.step_number}:</span> {s.description}
                          </li>
                        ))}
                      </ul>
                    ) : <p className="txt-muted italic">Chưa có hướng dẫn pha chế.</p>}
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}