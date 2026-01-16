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
app.get('/api/admin/orders/pending', async (req, res) => {
    try {
        const result = await pool.request().query(`
            SELECT 
                o.order_id,
                o.created_at,
                o.total_amount,
                o.payment_method,
                o.note,
                o.status,
                u.full_name,
                u.phone,
                u.address
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.user_id
            WHERE o.order_type = 'Online'
              AND o.status = N'Chờ chuẩn bị'
            ORDER BY o.created_at ASC
        `);

        res.json(result.recordset);
    } catch (err) {
        console.error("Lỗi GET pending online orders:", err.message);
        res.status(500).json({ error: err.message });
    }
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
                    VALUES (N'Truc tiep', @total, @method, N'Đã hoàn thành', GETDATE())`);
        
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
// Thống kê doanh số theo ngày (từ ngày A đến ngày B)
// Xóa route trùng lặp, chỉ giữ 1 route daily
app.get('/api/admin/revenue/daily', async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: "Vui lòng chọn một ngày (format: YYYY-MM-DD)" });
    }

    let query = `
      SELECT
        CONVERT(date, o.created_at) AS order_date,
        SUM(CASE WHEN o.order_type = N'Online' THEN o.total_amount ELSE 0 END) AS total_online,
        SUM(CASE WHEN o.order_type = N'Trực tiếp' THEN o.total_amount ELSE 0 END) AS total_offline,
        COUNT(CASE WHEN o.order_type = N'Online' THEN 1 END) AS total_online_orders,
        COUNT(CASE WHEN o.order_type = N'Trực tiếp' THEN 1 END) AS total_offline_orders,
        SUM(o.total_amount) AS total_revenue
      FROM orders o
      WHERE CONVERT(date, o.created_at) = @date
      GROUP BY CONVERT(date, o.created_at)
      ORDER BY order_date DESC
    `;

    const request = pool.request();
    request.input('date', sql.Date, date);

    const result = await request.query(query);

    console.log("Query date param:", date);
    console.log("Số dòng trả về:", result.recordset.length);
    if (result.recordset.length > 0) {
      console.log("Dữ liệu chi tiết:", result.recordset[0]);
    }

    res.json(result.recordset || []);
  } catch (err) {
    console.error("Lỗi query daily revenue:", err);
    res.status(500).json({ error: err.message });
  }
});

// Route monthly giữ nguyên (chưa có vấn đề)
app.get('/api/admin/revenue/monthly', async (req, res) => {
  try {
    const { startMonth, endMonth } = req.query;
    let query = `
      SELECT
        YEAR(o.created_at) AS year,
        MONTH(o.created_at) AS month,
        SUM(CASE WHEN o.order_type = N'Online' THEN o.total_amount ELSE 0 END) AS total_online,
        SUM(CASE WHEN o.order_type = N'Trực tiếp' THEN o.total_amount ELSE 0 END) AS total_offline, -- Sửa ở đây
        COUNT(CASE WHEN o.order_type = N'Online' THEN 1 END) AS total_online_orders,
        COUNT(CASE WHEN o.order_type = N'Trực tiếp' THEN 1 END) AS total_offline_orders, -- Sửa ở đây
        SUM(o.total_amount) AS total_revenue
      FROM orders o
      WHERE 1=1
    `;
    const request = pool.request();

    if (startMonth) {
      query += ` AND o.created_at >= CAST(@startMonth + '-01' AS DATETIME)`;
      request.input('startMonth', sql.NVarChar, startMonth);
    }
    if (endMonth) {
      query += ` AND o.created_at < DATEADD(MONTH, 1, CAST(@endMonth + '-01' AS DATETIME))`;
      request.input('endMonth', sql.NVarChar, endMonth);
    }

    query += ` GROUP BY YEAR(o.created_at), MONTH(o.created_at) ORDER BY year DESC, month DESC`;
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error("Lỗi query monthly revenue:", err);
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/admin/revenue/profit-summary', async (req, res) => {
    try {
        const { start, end } = req.query;
        const result = await pool.request()
            .input('start', sql.Date, start)
            .input('end', sql.Date, end)
            .query(`
                SELECT 
                    -- Lọc chính xác theo chữ "Online" trong database của bạn
                    ISNULL(SUM(CASE WHEN order_type = 'Online' THEN total_amount ELSE 0 END), 0) AS onl_money,
                    ISNULL(COUNT(CASE WHEN order_type = 'Online' THEN 1 END), 0) AS onl_count,
                    
                    -- Lọc theo chữ "Trực tiếp" dùng N để nhận diện tiếng Việt
                    ISNULL(SUM(CASE WHEN order_type = N'Trực tiếp' THEN total_amount ELSE 0 END), 0) AS off_money,
                    ISNULL(COUNT(CASE WHEN order_type = N'Trực tiếp' THEN 1 END), 0) AS off_count,
                    
                    -- Tổng doanh thu đơn Đã hoàn thành (7.660.000đ trong ảnh của bạn)
                    ISNULL(SUM(total_amount), 0) AS gross_revenue,

                    -- Tổng tiền nhập hàng (220.000đ từ phiếu nhập #8, #9, #10)
                    ISNULL((
                        SELECT SUM(total_amount)
                        FROM dbo.purchase_orders
                        WHERE CAST(created_at AS DATE) BETWEEN @start AND @end
                    ), 0) AS total_import
                FROM dbo.orders
                WHERE CAST(created_at AS DATE) BETWEEN @start AND @end
                AND status = N'Đã hoàn thành'
            `);

        const data = result.recordset[0];
        
        // Tính toán các thông số bổ sung
        const discount = data.gross_revenue * 0.05; 
        const tax = (data.gross_revenue - discount) * 0.08; 
        const profit = data.gross_revenue - discount - tax - data.total_import;

        res.json({
            online_money: data.onl_money,
            online_count: data.onl_count,
            offline_money: data.off_money,
            offline_count: data.off_count,
            gross_revenue: data.gross_revenue,
            total_import: data.total_import,
            discount: discount,
            tax: tax,
            profit: profit
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//nhập nguyên liệu
// --- API QUẢN LÝ NHẬP KHO DÀNH CHO STAFF ---
app.get('/api/staff/purchase-orders', async (req, res) => {
    try {
        const result = await pool.request().query(`
            SELECT purchase_id, supplier_name, supplier_phone, total_amount, note, created_at 
            FROM dbo.purchase_orders 
            ORDER BY created_at DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// 1. Lấy danh sách nguyên liệu để hiển thị gợi ý (Datalist)
// --- 8. QUẢN LÝ NHẬP KHO (STAFF) ---

// Lấy danh sách nguyên liệu để hiển thị gợi ý (Datalist)
app.get('/api/staff/ingredients', async (req, res) => {
    try {   
        // Truy vấn đúng tên bảng và các cột từ ảnh của bạn
        const result = await pool.request().query('SELECT ingredient_id, name, unit, quantity, import_price FROM dbo.INGREDIENTS');     
        res.json(result.recordset);
    } catch (err) {      
        console.error("Lỗi GET ingredients:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// Thêm nguyên liệu mới vào danh mục
app.post('/api/staff/ingredients', async (req, res) => {
    const { name, unit } = req.body;
    try {
        await pool.request()
            .input('name', sql.NVarChar, name)
            .input('unit', sql.NVarChar, unit)
            .query(`INSERT INTO dbo.INGREDIENTS (name, unit, quantity, supplier, import_price) 
                    VALUES (@name, @unit, 0, N'Không xác định', 0)`);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Cập nhật giá nhập gốc vào bảng nguyên liệu
app.put('/api/ingredients/:id/price', async (req, res) => {
    const { id } = req.params;
    const { import_price } = req.body;
    try {
        await pool.request()
            .input('id', sql.Int, id)
            .input('price', sql.Decimal(18, 2), import_price)
            .query(`UPDATE dbo.INGREDIENTS SET import_price = @price WHERE ingredient_id = @id`);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Lưu phiếu nhập kho và cập nhật số lượng tồn kho
app.post('/api/staff/purchase-orders', async (req, res) => {
    const { supplier_name, total_amount, note, details } = req.body;
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        // 1. Tạo phiếu nhập chính (Dựa trên bảng purchase_orders trong ảnh)
        const orderRes = await transaction.request()
            .input('supplier', sql.NVarChar, supplier_name)
            .input('total', sql.Decimal(18, 2), total_amount)
            .input('note', sql.NVarChar, note || '')
            .query(`INSERT INTO dbo.purchase_orders (supplier_name, total_amount, note, created_at)
                    OUTPUT INSERTED.purchase_id 
                    VALUES (@supplier, @total, @note, GETDATE())`);

        const purchaseId = orderRes.recordset[0].purchase_id;

        // 2. Lưu chi tiết và cập nhật kho
        for (const item of details) {
            // Cập nhật số lượng tồn trong bảng INGREDIENTS
            await transaction.request()
                .input('id', sql.Int, item.ingredient_id)
                .input('qty', sql.Int, Math.floor(item.quantity))
                .query(`UPDATE dbo.INGREDIENTS SET quantity = ISNULL(quantity, 0) + @qty WHERE ingredient_id = @id`);

            // Lưu vào bảng chi tiết phiếu nhập (product_id ở đây tương ứng với ingredient_id)
            await transaction.request()
                .input('pid', sql.Int, purchaseId)
                .input('itid', sql.Int, item.ingredient_id)
                .input('qty', sql.Int, Math.floor(item.quantity))
                .input('price', sql.Decimal(18, 2), item.import_price)
                .input('total', sql.Decimal(18, 2), item.total_price)
                .query(`INSERT INTO dbo.purchase_order_details (purchase_id, product_id, quantity, import_price, total_price)
                        VALUES (@pid, @itid, @qty, @price, @total)`);
        }

        await transaction.commit();
        res.json({ success: true, purchase_id: purchaseId });

    } catch (err) {
        if (transaction) await transaction.rollback();
        console.error("Lỗi Transaction Nhập Kho:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// Lưu phiếu nhập kho và cập nhật số lượng tồn kho
app.get('/api/staff/ingredients', async (req, res) => {
    try {   
        // Truy vấn bảng dbo.INGREDIENTS
        const result = await pool.request().query('SELECT * FROM dbo.INGREDIENTS');     
        res.json(result.recordset);
    } catch (err) {      
        console.error("Lỗi GET ingredients:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// Cập nhật giá gốc (Sử dụng ingredient_id và import_price theo ảnh)
app.put('/api/ingredients/:id/price', async (req, res) => {
    const { id } = req.params;
    const { import_price } = req.body;
    try {
        await pool.request()
            .input('id', sql.Int, id)
            .input('price', sql.Decimal(18, 2), import_price)
            .query(`UPDATE dbo.INGREDIENTS SET import_price = @price WHERE ingredient_id = @id`);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API Thêm nguyên liệu mới (Sử dụng các cột: name, unit, quantity, supplier, import_price)
app.post('/api/staff/ingredients', async (req, res) => {
    const { name, unit } = req.body;
    try {
        await pool.request()
            .input('name', sql.NVarChar, name)
            .input('unit', sql.NVarChar, unit)
            .query(`INSERT INTO dbo.INGREDIENTS (name, unit, quantity, supplier, import_price) 
                    VALUES (@name, @unit, 0, N'Không xác định', 0)`);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.get('/api/staff/purchase-orders/:id/details', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.request()
            .input('pid', sql.Int, id)
            .query(`
                SELECT 
                    d.*, 
                    i.name as ingredient_name, 
                    i.unit,
                    i.expiry_date -- THÊM DÒNG NÀY ĐỂ HIỂN THỊ HSD
                FROM dbo.purchase_order_details d
                JOIN dbo.ingredients i ON d.product_id = i.ingredient_id
                WHERE d.purchase_id = @pid
            `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.get('/api/staff/purchase-orders/:id/details', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.request()
            .input('pid', sql.Int, id)
            .query(`
                SELECT 
                    d.*, 
                    i.name as ingredient_name, 
                    i.unit 
                FROM dbo.purchase_order_details d
                JOIN dbo.ingredients i ON d.product_id = i.ingredient_id
                WHERE d.purchase_id = @pid
            `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// thêm món mới
app.put('/api/ingredients/:id/price', async (req, res) => {
    const { id } = req.params;
    const { import_price } = req.body;

    try {
        await pool.request()
            .input('id', sql.Int, id)
            .input('price', sql.Decimal(18, 2), import_price)
            .query(`
                UPDATE dbo.ingredients 
                SET import_price = @price 
                WHERE ingredient_id = @id
            `);
        res.json({ success: true, message: 'Cập nhật giá gốc thành công!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.post('/api/ingredients', async (req, res) => {
    const { name, unit } = req.body;
    try {
        await pool.request()
            .input('name', sql.NVarChar, name)
            .input('unit', sql.NVarChar, unit)
            .input('qty', sql.Float, 0)
            .input('price', sql.Decimal(18, 2), 0)
            .input('supplier', sql.NVarChar, 'Không xác định')
            .query(`
                INSERT INTO dbo.ingredients (name, unit, quantity, supplier, import_price, created_at) 
                VALUES (@name, @unit, @qty, @supplier, @price, GETDATE())
            `);
        res.status(201).json({ success: true, message: "Thêm thành công" });
    } catch (err) {
        console.error("Lỗi POST /api/ingredients:", err.message);
        res.status(500).json({ error: err.message });
    }
});
// --- 8. HỆ THỐNG TIN NHẮN 
// 1. API Gửi tin nhắn
app.post("/api/messages/send", upload.single('image'), async (req, res) => {
    const { user_id, customer_name, customer_phone, sender_type, message_text } = req.body;
    const image_url = req.file ? `/images/${req.file.filename}` : null;

    try {
        await pool.request()
            .input('uid', sql.Int, user_id && user_id !== 'null' ? user_id : null)
            .input('name', sql.NVarChar, customer_name)
            .input('phone', sql.VarChar, customer_phone)
            .input('type', sql.VarChar, sender_type)
            .input('msg', sql.NVarChar, message_text || '') // Icon thực chất là text (Unicode)
            .input('img', sql.NVarChar, image_url)
            .query(`
                INSERT INTO MESSAGES (user_id, customer_name, customer_phone, sender_type, message_text, image_url, created_at)
                VALUES (@uid, @name, @phone, @type, @msg, @img, GETDATE())
            `);
            
        res.json({ success: true, image_url });
    } catch (err) {
        console.error("Lỗi gửi tin nhắn:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// 2. API Lấy danh sách khách hàng (Staff Sidebar)
app.get("/api/messages/customers", async (req, res) => {
    try {
        const result = await pool.request().query(`
            SELECT customer_name, customer_phone, MAX(created_at) as last_time 
            FROM MESSAGES 
            GROUP BY customer_name, customer_phone 
            ORDER BY last_time DESC
        `);
        res.json(result.recordset); 
    } catch (err) {
        console.error("Lỗi lấy danh sách khách:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// 3. API Lấy lịch sử chat
app.get("/api/messages/history/:phone", async (req, res) => {
    try {
        const { phone } = req.params;
        const result = await pool.request()
            .input('phone', sql.VarChar, phone)
            .query(`
                SELECT * FROM MESSAGES 
                WHERE customer_phone = @phone 
                ORDER BY created_at ASC
            `);
        res.json(result.recordset);
    } catch (err) {
        console.error("Lỗi lấy lịch sử chat:", err.message);
        res.status(500).json({ error: err.message });
    }
});
app.post('/api/send-recruitment', async (req, res) => {
    const { user_name, user_email, user_phone, job_target, message } = req.body;

    const mailOptions = {
        from: 'namn05655@gmail.com', // Email gửi (là email của bạn)
        to: 'namn05655@gmail.com',   // Email nhận (bạn có thể nhận luôn vào email này để test)
        subject: `[ỨNG TUYỂN] - ${job_target.toUpperCase()}`,
        html: `
            <h3>Thông tin ứng viên mới từ Sakura Café</h3>
            <p><strong>Họ tên:</strong> ${user_name}</p>
            <p><strong>Email:</strong> ${user_email}</p>
            <p><strong>Số điện thoại:</strong> ${user_phone}</p>
            <p><strong>Vị trí ứng tuyển:</strong> ${job_target}</p>
            <p><strong>Lời nhắn:</strong> ${message}</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log("Hồ sơ tuyển dụng đã được gửi qua email!");
        res.status(200).json({ message: "Gửi hồ sơ thành công!" });
    } catch (error) {
        console.error("Lỗi khi gửi mail tuyển dụng:", error);
        res.status(500).json({ error: "Không thể gửi hồ sơ, vui lòng thử lại sau." });
    }
});
// --- API THANH TOÁN TẠI QUẦY (POS) ---
app.post('/api/orders/pos', async (req, res) => {
    const { total_amount, items, payment_method } = req.body;
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        // 1. Tạo đơn hàng chính
        const orderResult = await transaction.request()
            .input('total', sql.Decimal(18, 2), total_amount)
            .input('method', sql.NVarChar, payment_method || 'Tiền mặt')
            .query(`INSERT INTO dbo.orders (order_type, total_amount, payment_method, status, created_at) 
                    OUTPUT INSERTED.order_id 
                    VALUES (N'Trực tiếp', @total, @method, N'Đã hoàn thành', GETDATE())`);
        
        const orderId = orderResult.recordset[0].order_id;

        // 2. Lưu chi tiết từng món trong giỏ hàng
        for (const item of items) {
            await transaction.request()
                .input('oid', sql.Int, orderId)
                .input('pid', sql.Int, item.product_id)
                .input('qty', sql.Int, item.qty)
                .input('price', sql.Decimal(18, 2), item.price)
                .input('total_p', sql.Decimal(18, 2), item.price * item.qty)
                .query(`INSERT INTO dbo.order_details (order_id, product_id, quantity, price, total_price) 
                        VALUES (@oid, @pid, @qty, @price, @total_p)`);
        }

        await transaction.commit();
        res.json({ success: true, message: "Thanh toán thành công!", orderId });

    } catch (err) {
        if (transaction) await transaction.rollback();
        console.error("Lỗi POS API:", err.message);
        res.status(500).json({ error: err.message });
    }
});
const PORT = 3003;
app.listen(PORT, () => console.log(`🚀 Server running tại: http://localhost:${PORT}`));