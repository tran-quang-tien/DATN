import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addProduct } from "../api/Api";
import "./Css/AddProduct.css";

const categoryMap = {
  "Cà phê": 1,
  "Matcha": 2,
  "Trà": 3,
  "Bánh ngọt": 4,
  "Sinh tố": 5,
  "Nước ép": 6,
  "Nước đóng chai": 7,
  "Trà sữa":9,
  "Khác": 8
};

function AddProduct() {
  // BỔ SUNG: Thêm discount vào state ban đầu
  const [product, setProduct] = useState({ 
    name: "", 
    price: "", 
    discount: "", 
    loaimon: "Cà phê", 
    description: "" 
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const navigate = useNavigate();

  const categories = Object.keys(categoryMap);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert("Vui lòng chọn ảnh!");

    try {
      const formData = new FormData();
      const finalCategoryId = categoryMap[product.loaimon] || 8;

      formData.append("name", product.name);
      formData.append("price", product.price);
      formData.append("discount", product.discount || ""); 
      formData.append("category_id", finalCategoryId);
      formData.append("description", product.description);
      formData.append("image", file);

      const result = await addProduct(formData);
      if (result.success) {
        alert("✨ Thêm món mới thành công!");
        navigate("/admin/products");
      }
    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>✨ Thêm món mới</h3>
        <form onSubmit={handleSubmit}>
          <div className="image-section">
            {preview ? <img src={preview} alt="Preview" className="preview-img" /> : <div className="preview-img placeholder-img">Chưa có ảnh</div>}
            <input type="file" accept="image/*" onChange={handleFileChange} required />
          </div>

          <label>Tên món</label>
          <input 
            type="text" 
            value={product.name} 
            onChange={(e) => setProduct({...product, name: e.target.value})} 
            placeholder="Nhập tên món..."
            required 
          />

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label>Giá gốc (VNĐ)</label>
              <input 
                type="number" 
                value={product.price} 
                onChange={(e) => setProduct({...product, price: e.target.value})} 
                placeholder="Ví dụ: 30000"
                required 
              />
            </div>
            <div style={{ flex: 1 }}>
              <label>Giá giảm (Discount)</label>
              <input 
                type="number" 
                value={product.discount} 
                onChange={(e) => setProduct({...product, discount: e.target.value})} 
                placeholder="Để trống nếu không giảm"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '10px' }}>
            <label>Loại món</label>
            <select style={{ width: '100%', padding: '8px', borderRadius: '4px' }} value={product.loaimon} onChange={(e) => setProduct({...product, loaimon: e.target.value})}>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <label style={{ marginTop: '10px', display: 'block' }}>Mô tả</label>
          <textarea 
            value={product.description} 
            onChange={(e) => setProduct({...product, description: e.target.value})} 
            placeholder="Mô tả món ăn..."
          />

          <div className="modal-actions">
            <button type="button" className="btn-danger" onClick={() => navigate(-1)}>Hủy</button>
            <button type="submit" className="btn-primary">Lưu món mới</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddProduct;