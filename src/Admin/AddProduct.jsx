import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addProduct } from "../api/Api";
import "./Css/AddProduct.css";

function AddProduct() {
  const [product, setProduct] = useState({ name: "", price: "", loaimon: "Cà phê", description: "" });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const navigate = useNavigate();

  const categories = ["Cà phê", "Sinh tố", "Trà", "Bánh", "Nước ép", "Khác"];

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
      // Gửi product_name nhưng Backend sẽ map vào cột name
      formData.append("product_name", product.name);
      formData.append("price", product.price);
      formData.append("loaimon", product.loaimon);
      formData.append("description", product.description);
      formData.append("image", file);

      const result = await addProduct(formData);
      if (result.success) {
        alert("✨ Thêm món mới thành công!");
        navigate("/admin/products");
      }
    } catch (err) {
      alert("Lỗi: " + err.message);
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
              <label>Giá (VNĐ)</label>
              <input 
                type="number" 
                value={product.price} 
                onChange={(e) => setProduct({...product, price: e.target.value})} 
                placeholder="Ví dụ: 30000"
                required 
              />
            </div>
            <div style={{ flex: 1 }}>
              <label>Loại món</label>
              <select value={product.loaimon} onChange={(e) => setProduct({...product, loaimon: e.target.value})}>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>
          <label>Mô tả</label>
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