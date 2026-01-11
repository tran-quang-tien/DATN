import express from 'express';
import sql from 'mssql';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';

const app = express();
app.use(express.json());
app.use(cors());

// --- 1. CẤU HÌNH LƯU TRỮ ẢNH ---
const uploadDir = 'public/images/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/images', express.static(uploadDir));

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// --- 2. CẤU HÌNH SQL SERVER ---
const config = {
    user: 'sa',
    password: '123',
    server: 'localhost',
    port: 1433,
    database: 'sakura_cafe',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        instanceName: 'SQLEXPRESS'
    }
};

let pool;
sql.connect(config).then(p => {
    console.log('✅ SQL Server Connected Successfully');
    pool = p;
}).catch(err => {
    console.error('❌ SQL Connection Error:', err.message);
});

// --- 3. CẤU HÌNH GỬI MAIL ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'namn05655@gmail.com', 
        pass: 'ziii wthf muhq ycev'     
    }
});
let otpStore = {};

// === THÊM ENDPOINT MỚI (để fix lỗi 404 ở getUserById) ===
app.get('/api/users/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await pool.request()
            .input('id', sql.Int, userId)
            .query('SELECT * FROM users WHERE user_id = @id');
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy người dùng" });
        }
        
        res.json(result.recordset[0]);
    } catch (err) {
        console.error("Lỗi GET /api/users/:userId:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// --- 4. HỆ THỐNG TÀI KHOẢN & NGƯỜI DÙNG ---
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await pool.request()
            .input('email', sql.VarChar, email)
            .input('password', sql.VarChar, password)
            .query('SELECT * FROM users WHERE email = @email AND password = @password AND is_verified = 1');
        if (result.recordset.length > 0) res.json({ success: true, user: result.recordset[0] });
        else res.status(401).json({ success: false, message: 'Sai tài khoản hoặc chưa xác thực' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/register', async (req, res) => {
    try {
        const { full_name, email, password, phone, address } = req.body;
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore[email] = { full_name, email, password, phone, address, otp, expires: Date.now() + 300000 };
        await transporter.sendMail({
            from: '"Sakura Café 🌸"', to: email,
            subject: "Mã xác thực", html: `<h1>Mã OTP của bạn là: ${otp}</h1>`
        });
        res.json({ success: true, message: 'Đã gửi OTP!' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        const userData = otpStore[email];
        if (!userData || userData.otp !== otp || Date.now() > userData.expires) {
            return res.status(400).json({ message: 'OTP sai hoặc đã hết hạn!' });
        }
        const result = await pool.request()
            .input('name', sql.NVarChar, userData.full_name)
            .input('email', sql.VarChar, userData.email)
            .input('pass', sql.VarChar, userData.password)
            .input('phone', sql.VarChar, userData.phone)
            .input('address', sql.NVarChar, userData.address)
            .query(`INSERT INTO users (full_name, email, password, phone, address, role_id, is_verified, created_at)
                    OUTPUT INSERTED.* VALUES (@name, @email, @pass, @phone, @address, 2, 1, GETDATE())`);
        delete otpStore[email];
        res.json({ success: true, user: result.recordset[0] }); 
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.request().query('SELECT * FROM users');
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/users/:userId', upload.single('avatar'), async (req, res) => {
    try {
        const { userId } = req.params;
        const { full_name, email, phone, address, role_id } = req.body;
        const imagePath = req.file ? `/images/${req.file.filename}` : null;
        let query = `UPDATE users SET full_name=@name, email=@email, phone=@phone, address=@address`;
        if (role_id) query += `, role_id=@role`;
        if (imagePath) query += `, avatar=@avt`;
        query += ` WHERE user_id=@id`;
        const request = pool.request()
            .input('id', sql.Int, userId)
            .input('name', sql.NVarChar, full_name)
            .input('email', sql.VarChar, email)
            .input('phone', sql.VarChar, phone)
            .input('address', sql.NVarChar, address);
        if (role_id) request.input('role', sql.Int, role_id);
        if (imagePath) request.input('avt', sql.NVarChar, imagePath);
        await request.query(query);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/users/:userId', async (req, res) => {
    try {
        await pool.request().input('id', sql.Int, req.params.userId).query('DELETE FROM users WHERE user_id = @id');
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- 5. QUẢN LÝ SẢN PHẨM & CATEGORIES ---
app.get('/api/products', async (req, res) => {
    try {
        const result = await pool.request().query('SELECT p.*, c.category_name FROM products p LEFT JOIN categories c ON p.category_id = c.category_id');
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/categories', async (req, res) => {
    try {
        const result = await pool.request().query("SELECT category_id, category_name FROM categories");
        res.json(result.recordset);
    } catch (err) { res.status(500).send("Lỗi Server"); }
});

// Cập nhật sản phẩm (Admin)
app.put('/api/products/:id', upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const { product_name, price, loaimon } = req.body;
        const imagePath = req.file ? `/images/${req.file.filename}` : null;

        const catResult = await pool.request()
            .input('catName', sql.NVarChar, loaimon)
            .query("SELECT category_id FROM categories WHERE category_name = @catName");
        
        const categoryId = catResult.recordset.length > 0 ? catResult.recordset[0].category_id : null;

        let query = `UPDATE products SET name=@name, price=@price, category_id=@catId`;
        if (imagePath) query += `, image=@img`;
        query += ` WHERE product_id=@id`;

        const request = pool.request()
            .input('id', sql.Int, id)
            .input('name', sql.NVarChar, product_name)
            .input('price', sql.Decimal(18, 2), price)
            .input('catId', sql.Int, categoryId);
        
        if (imagePath) request.input('img', sql.NVarChar, imagePath);

        await request.query(query);
        res.json({ success: true, message: "Cập nhật thành công!" });
    } catch (err) {
        console.error("Lỗi Update Product:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// --- 6. QUẢN LÝ ĐẶT BÀN ---

app.get('/api/bookings', async (req, res) => {
    try {
        const result = await pool.request().query('SELECT * FROM bookings ORDER BY booking_id DESC');
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/bookings', async (req, res) => {
    try {
        const { customer_name, email, phone, booking_date, booking_time, number_of_people, note, status } = req.body;
        await pool.request()
            .input('name', sql.NVarChar, customer_name)
            .input('email', sql.VarChar, email)
            .input('phone', sql.VarChar, phone)
            .input('date', sql.Date, booking_date)
            .input('time', sql.VarChar, booking_time)
            .input('people', sql.Int, number_of_people)
            .input('note', sql.NVarChar, note)
            .input('status', sql.NVarChar, status || 'Chờ xác nhận')
            .query(`INSERT INTO bookings (customer_name, email, phone, booking_date, booking_time, number_of_people, note, status, created_at) 
                    VALUES (@name, @email, @phone, @date, @time, @people, @note, @status, GETDATE())`);

        res.json({ success: true, message: "Đặt bàn thành công!" });
    } catch (err) {
        console.error("Lỗi POST /api/bookings:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

app.put('/api/bookings/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, cancelReason } = req.body; 

        const checkResult = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT booking_date, booking_time, number_of_people, email, customer_name FROM bookings WHERE booking_id = @id');
        
        if (checkResult.recordset.length === 0) return res.status(404).json({ error: "Không tìm thấy đơn hàng" });

        const booking = checkResult.recordset[0];
        
        await pool.request()
            .input('id', sql.Int, id)
            .input('status', sql.NVarChar, status)
            .query('UPDATE bookings SET status = @status WHERE booking_id = @id');

        if (booking.email) {
            const formattedDate = new Date(booking.booking_date).toLocaleDateString('vi-VN');
            const isCancel = status === "Đã hủy";

            await transporter.sendMail({
                from: '"Sakura Café 🌸" <namn05655@gmail.com>',
                to: booking.email,
                subject: isCancel ? `[Sakura Café] Thông báo hủy đặt bàn #${id}` : `[Sakura Café] Xác nhận đặt bàn thành công #${id}`,
                html: `... (giữ nguyên phần HTML gửi mail của em, mình không sửa)` 
            });
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/bookings/:id', async (req, res) => {
    try {
        await pool.request().input('id', sql.Int, req.params.id).query('DELETE FROM bookings WHERE booking_id = @id');
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- 7. HỆ THỐNG ĐƠN HÀNG --- (giữ nguyên toàn bộ phần này của em)

app.get('/api/orders/unconfirmed-count', async (req, res) => {
    try {
        const result = await pool.request()
            .query("SELECT COUNT(*) as count FROM orders WHERE status = N'Chờ chuẩn bị' AND order_type = 'Online'");
        res.json({ count: result.recordset[0].count });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/orders/at-counter', async (req, res) => {
    try {
        const { total_amount, items, payment_method } = req.body;
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Giỏ hàng trống' });
        }
        const orderResult = await pool.request()
            .input('total', sql.Decimal(18, 2), total_amount)
            .input('method', sql.NVarChar, payment_method || 'Tiền mặt')
            .query(`INSERT INTO orders (order_type, total_amount, payment_method, status, created_at) 
                    OUTPUT INSERTED.order_id 
                    VALUES (N'Trực tiếp', @total, @method, N'Đã hoàn thành', GETDATE())`);
        
        const orderId = orderResult.recordset[0].order_id;
        for (const item of items) {
            const totalPrice = item.price * item.qty;
            await pool.request()
                .input('oid', sql.Int, orderId)
                .input('pid', sql.Int, item.product_id)
                .input('qty', sql.Int, item.qty)
                .input('price', sql.Decimal(18, 2), item.price)
                .input('total_p', sql.Decimal(18, 2), totalPrice)
                .query(`INSERT INTO order_details (order_id, product_id, quantity, price, total_price) 
                        VALUES (@oid, @pid, @qty, @price, @total_p)`);
        }
        res.json({ success: true, orderId });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/checkout', async (req, res) => {
    try {
        const { user_id, total_amount, payment_method, note, cartItems } = req.body;
        const orderResult = await pool.request()
            .input('uid', sql.Int, user_id || null)
            .input('total', sql.Decimal(18, 2), total_amount)
            .input('method', sql.NVarChar, payment_method || 'COD')
            .input('note', sql.NVarChar, note || null)
            .query(`INSERT INTO orders (user_id, order_type, total_amount, payment_method, status, note, created_at) 
                    OUTPUT INSERTED.order_id 
                    VALUES (@uid, 'Online', @total, @method, N'Chờ chuẩn bị', @note, GETDATE())`);
        const orderId = orderResult.recordset[0].order_id;
        for (const item of cartItems) {
            await pool.request()
                .input('oid', sql.Int, orderId)
                .input('pid', sql.Int, item.product_id)
                .input('qty', sql.Int, item.quantity)
                .input('price', sql.Decimal(18, 2), item.price)
                .input('total_p', sql.Decimal(18, 2), item.price * item.quantity)
                .query(`INSERT INTO order_details (order_id, product_id, quantity, price, total_price) 
                        VALUES (@oid, @pid, @qty, @price, @total_p)`);
        }
        res.json({ success: true, orderId });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/orders-history', async (req, res) => {
    try {
        const { type, startDate, endDate } = req.query;
        let query = `SELECT o.*, u.full_name FROM orders o LEFT JOIN users u ON o.user_id = u.user_id WHERE 1=1`;
        const request = pool.request();
        if (type && type !== 'All') {
            query += ` AND o.order_type = @type`;
            request.input('type', sql.NVarChar, type);
        }
        if (startDate && endDate) {
            query += ` AND CAST(o.created_at AS DATE) BETWEEN @start AND @end`;
            request.input('start', sql.Date, startDate).input('end', sql.Date, endDate);
        }
        query += ` ORDER BY o.created_at DESC`;
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/orders/:id/details', async (req, res) => {
    try {
        const result = await pool.request()
            .input('oid', sql.Int, req.params.id)
            .query(`SELECT od.*, p.name AS product_name, u.full_name, u.phone, u.address, o.note 
                    FROM order_details od 
                    INNER JOIN products p ON od.product_id = p.product_id 
                    INNER JOIN orders o ON od.order_id = o.order_id
                    LEFT JOIN users u ON o.user_id = u.user_id
                    WHERE od.order_id = @oid`);
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/admin/orders/:id/complete', async (req, res) => {
    try {
        await pool.request().input('id', sql.Int, req.params.id)
            .query("UPDATE orders SET status = N'Đã hoàn thành' WHERE order_id = @id");
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = 3003;
app.listen(PORT, () => console.log(`🚀 Server running tại: http://localhost:${PORT}`));