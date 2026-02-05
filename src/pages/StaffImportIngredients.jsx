import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Css/StaffImport.css";

export default function StaffImport() {
  const navigate = useNavigate();
  const [ingredients, setIngredients] = useState([]);
  const [search, setSearch] = useState("");
  const [importList, setImportList] = useState([]);
  const [supplier, setSupplier] = useState("");
  const [note, setNote] = useState("");

  // State cho Modal thêm nguyên liệu mới
  const [showModal, setShowModal] = useState(false);
  const [newIng, setNewIng] = useState({ name: "", unit: "" });

  // 1. Load danh sách từ database
  useEffect(() => {
    axios.get("http://localhost:3003/api/staff/ingredients")
      .then(res => setIngredients(res.data))
      .catch(err => console.error("Lỗi tải dữ liệu:", err));
  }, []);

  // 2. Thêm nguyên liệu vào phiếu nhập
  const addIngredient = (item) => {
    const exists = importList.find(i => i.ingredient_id === item.ingredient_id);
    if (exists) {
      updateItem(item.ingredient_id, "qty", exists.qty + 1);
      return;
    }
    // Mặc định giá nhập là giá trong DB hoặc 0
    setImportList([...importList, { ...item, qty: 1, import_price: item.import_price || 0 }]);
  };

  // 3. Cập nhật SL / Giá trực tiếp
  const updateItem = (id, field, value) => {
    setImportList(importList.map(i =>
      i.ingredient_id === id ? { ...i, [field]: Number(value) } : i
    ));
  };

  const removeItem = (id) => {
    setImportList(importList.filter(i => i.ingredient_id !== id));
  };

  // 4. Tạo mới nguyên liệu hoàn toàn
  const handleCreateNewIngredient = async () => {
    if (!newIng.name || !newIng.unit) return alert("Vui lòng điền đủ thông tin!");
    try {
      const res = await axios.post("http://localhost:3003/api/staff/ingredients/new", newIng);
      setIngredients([...ingredients, res.data]);
      addIngredient(res.data); 
      setShowModal(false);
      setNewIng({ name: "", unit: "" });
    } catch (err) { 
        console.error(err);
        alert("Lỗi khi tạo mới!"); 
    }
  };

  // 5. Tính toán tiền
  const subTotal = importList.reduce((sum, i) => sum + i.qty * i.import_price, 0);
  const vat = subTotal * 0.08; // Thuế 8% theo form POS
  const total = subTotal + vat;

  // 6. Xử lý lưu phiếu nhập (Sửa lỗi mất sự kiện nút Hoàn thành)
  const handleSave = async () => {
    if (!supplier) return alert("Vui lòng nhập tên nhà cung cấp!");
    if (importList.length === 0) return alert("Chưa có nguyên liệu nào trong phiếu!");

    const data = {
        supplier_name: supplier,
        total_amount: total,
        note: note,
        details: importList
    };

    try {
        const res = await axios.post("http://localhost:3003/api/staff/purchase-orders", data);
        if (res.data.success) {
            alert("Đã lưu phiếu nhập và cập nhật kho thành công!");
            setImportList([]);
            setSupplier("");
            setNote("");
        }
    } catch (err) {
        alert("Lỗi khi lưu phiếu nhập: " + (err.response?.data?.error || err.message));
    }
  };

  const filtered = ingredients.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="import-container">
      {/* HEADER BAR */}
      <div className="import-header">
        <button className="btn-back" onClick={() => navigate("/staff/order")}>← Quay lại Bán hàng</button>
        <h2>PHIẾU NHẬP KHO</h2>
        <div className="user-info">Nhân viên: <strong>Staff</strong></div>
      </div>

      <div className="import-main-content">
        {/* BÊN TRÁI: DANH MỤC (60%) */}
        <div className="import-left">
          <div className="left-controls">
            <input 
              className="search-input" 
              placeholder="Tìm nguyên liệu..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
            <button className="btn-add-new" onClick={() => setShowModal(true)}>+ Thêm mới</button>
          </div>
          
          <div className="ingredient-grid">
            {filtered.map(item => (
              <div className="ingredient-card" key={item.ingredient_id} onClick={() => addIngredient(item)}>
                <div className="name">{item.name}</div>
                <div className="unit">ĐVT: {item.unit}</div>
                <div className="add-icon">+</div>
              </div>
            ))}
          </div>
        </div>

        {/* BÊN PHẢI: CHI TIẾT PHIẾU (40%) */}
        <div className="import-right">
          <div className="info-box">
            <div className="form-group">
              <label>Nhà cung cấp:</label>
              <input type="text" value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Tên NCC..." />
            </div>
            <div className="form-group">
              <label>Ghi chú:</label>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nội dung nhập..." />
            </div>
          </div>

          <div className="table-wrapper">
            <table className="import-table">
              <thead>
                <tr>
                  <th>Tên hàng</th>
                  <th width="60">SL</th>
                  <th width="100">Giá nhập</th>
                  <th width="90">Thành tiền</th>
                  <th width="30"></th>
                </tr>
              </thead>
              <tbody>
                {importList.map(item => (
                  <tr key={item.ingredient_id}>
                    <td className="truncate">{item.name}</td>
                    <td><input type="number" value={item.qty} onChange={(e) => updateItem(item.ingredient_id, "qty", e.target.value)} /></td>
                    <td><input type="number" value={item.import_price} onChange={(e) => updateItem(item.ingredient_id, "import_price", e.target.value)} /></td>
                    <td className="text-right">{(item.qty * item.import_price).toLocaleString()}đ</td>
                    <td><button className="btn-del" onClick={() => removeItem(item.ingredient_id)}>×</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="import-summary">
            <div className="sum-line"><span>Tổng số lượng:</span><span>{importList.reduce((s, i) => s + i.qty, 0)}</span></div>
            <div className="sum-line"><span>Tạm tính:</span><span>{subTotal.toLocaleString()}đ</span></div>
            <div className="sum-line"><span>VAT (8%):</span><span>{vat.toLocaleString()}đ</span></div>
            <div className="sum-line total-price-row">
                <span>TỔNG CỘNG:</span>
                <span className="red-text">{total.toLocaleString()}đ</span>
            </div>
            {/* GÁN SỰ KIỆN HANDLE SAVE VÀO ĐÂY */}
            <button className="btn-save-all" onClick={handleSave}>HOÀN THÀNH</button>
          </div>
        </div>
      </div>

      {/* MODAL THÊM MỚI */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Đăng ký nguyên liệu mới</h3>
            <div className="form-group">
              <label>Tên nguyên liệu:</label>
              <input type="text" value={newIng.name} onChange={(e) => setNewIng({...newIng, name: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Đơn vị tính:</label>
              <input type="text" value={newIng.unit} placeholder="Kg, Lít, Thùng..." onChange={(e) => setNewIng({...newIng, unit: e.target.value})} />
            </div>
            <div className="modal-btns">
              <button className="btn-confirm" onClick={handleCreateNewIngredient}>Lưu & Thêm</button>
              <button className="btn-close" onClick={() => setShowModal(false)}>Hủy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}