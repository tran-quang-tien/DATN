
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_BASE = 'http://localhost:3003/api/staff';

export default function StaffPurchaseHistory() {
  const [purchases, setPurchases] = useState([]);
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      const res = await axios.get(`${API_BASE}/purchases`);
      setPurchases(res.data);
    } catch (err) {
      toast.error('Lỗi tải lịch sử nhập kho');
    }
  };

  const viewDetail = async (id) => {
    try {
      const res = await axios.get(`${API_BASE}/purchases/${id}`);
      setSelectedPurchase(res.data);
    } catch (err) {
      toast.error('Lỗi tải chi tiết');
    }
  };

  const deletePurchase = async (id) => {
    if (!window.confirm('Xác nhận xóa hóa đơn nhập này? (sẽ trừ tồn kho)')) return;
    try {
      await axios.delete(`${API_BASE}/purchases/${id}`);
      toast.success('Xóa thành công');
      fetchPurchases();
      setSelectedPurchase(null);
    } catch (err) {
      toast.error('Lỗi xóa hóa đơn');
    }
  };

  return (
    <div className="staff-history-container">
      <h2>Lịch sử nhập kho</h2>

      <table className="purchase-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nhà cung cấp</th>
            <th>SĐT</th>
            <th>Tổng tiền</th>
            <th>Ngày nhập</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {purchases.map(p => (
            <tr key={p.purchase_id}>
              <td>{p.purchase_id}</td>
              <td>{p.supplier_name}</td>
              <td>{p.supplier_phone}</td>
              <td>{Number(p.total_amount).toLocaleString('vi-VN')}đ</td>
              <td>{new Date(p.created_at).toLocaleDateString('vi-VN')}</td>
              <td>
                <button onClick={() => viewDetail(p.purchase_id)}>Xem chi tiết</button>
                <button onClick={() => deletePurchase(p.purchase_id)} className="btn-delete">Xóa</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedPurchase && (
        <div className="detail-modal">
          <h3>Chi tiết hóa đơn #{selectedPurchase.purchase_id}</h3>
          <table>
            <thead>
              <tr>
                <th>Nguyên liệu</th>
                <th>Số lượng</th>
                <th>Giá nhập</th>
                <th>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {selectedPurchase.details.map(d => (
                <tr key={d.detail_id}>
                  <td>{d.ingredient_name}</td>
                  <td>{d.quantity} {d.unit}</td>
                  <td>{Number(d.import_price).toLocaleString('vi-VN')}đ</td>
                  <td>{Number(d.total_price).toLocaleString('vi-VN')}đ</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={() => setSelectedPurchase(null)}>Đóng</button>
        </div>
      )}
    </div>
  );
}