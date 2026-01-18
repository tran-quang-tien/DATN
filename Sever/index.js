import express from 'express';
import sql from 'mssql';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/images', express.static(path.join(process.cwd(), 'public/images')));

// CẤU HÌNH DATABASE

const config = {
    user: 'sa',
    password: '123',
    server: '127.0.0.1',
    port: 1433,
    database: 'sakura_cafe',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

const pool = await sql.connect(config);


// UPLOAD ẢNH CHAT


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'public/images';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        // Giữ tên gốc hoặc đặt tên theo thời gian để tránh trùng
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });
//  API ĐĂNG NHẬP
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        let pool = await sql.connect(config);
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .input('password', sql.NVarChar, password)
            .query("SELECT user_id, full_name, role_id FROM users WHERE email = @email AND password = @password");

        if (result.recordset.length > 0) {
            const user = result.recordset[0];
            res.json({
                success: true,
                user: { 
                    id: user.user_id, 
                    name: user.full_name, 
                    role_id: user.role_id 
                }
            });
        } else {
            res.status(401).json({ success: false, message: "Sai tài khoản hoặc mật khẩu" });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
//người dùng
app.get('/api/users', async (req, res) => {
    try {
        let pool = await sql.connect(config);
        let result = await pool.request()
            // THÊM CỘT avatar VÀ created_at VÀO ĐÂY
            .query("SELECT user_id, full_name, email, phone, role_id, is_verified, avatar, created_at FROM users");
        
        res.json(result.recordset);
    } catch (err) {
        console.error("LỖI GET USERS:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});
//Danh mục
//  1. Lấy danh sách DANH MỤC (Để hiện menu trái hoặc filter)
app.get('/api/categories', async (req, res) => {
    try {
        let pool = await sql.connect(config);
        const result = await pool.request().query("SELECT * FROM categories");
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//  2. Lấy danh sách SẢN PHẨM (Khớp với product_id trong ảnh SQL của ông)
app.get('/api/products', async (req, res) => {
    try {
        let pool = await sql.connect(config);
        // Trong ảnh của ông là bảng "products", cột ID là "product_id"
        const result = await pool.request().query(`
            SELECT p.*, c.category_name 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
            ORDER BY p.product_id DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// QUẢN LÝ SẢN PHẨM (PRODUCTS)


// 1. Lấy danh sách sản phẩm (Sửa lỗi 404 cho getProducts)
app.get('/api/products', async (req, res) => {
    try {
        let pool = await sql.connect(config);
        let result = await pool.request().query("SELECT * FROM PRODUCTS ORDER BY product_id DESC");
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Thêm sản phẩm mới (Khớp với addProduct)
app.post('/api/products', upload.single('image'), async (req, res) => {
    try {
        const { name, price, category, description } = req.body;
        const imagePath = req.file ? `/images/${req.file.filename}` : null;

        let pool = await sql.connect(config);
        await pool.request()
            .input('name', sql.NVarChar, name)
            .input('price', sql.Decimal(18, 2), price)
            .input('category', sql.NVarChar, category)
            .input('desc', sql.NVarChar, description)
            .input('img', sql.NVarChar, imagePath)
            .query(`INSERT INTO PRODUCTS (name, price, category, description, image) 
                    VALUES (@name, @price, @category, @desc, @img)`);
        
        res.json({ success: true, message: "Thêm sản phẩm thành công!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Cập nhật sản phẩm (Khớp với updateProduct)
app.put('/api/products/:id', upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, category, description } = req.body;
        let imagePath = req.body.image; // Giữ ảnh cũ nếu không up ảnh mới

        if (req.file) {
            imagePath = `/images/${req.file.filename}`;
        }

        let pool = await sql.connect(config);
        await pool.request()
            .input('id', sql.Int, id)
            .input('name', sql.NVarChar, name)
            .input('price', sql.Decimal(18, 2), price)
            .input('category', sql.NVarChar, category)
            .input('desc', sql.NVarChar, description)
            .input('img', sql.NVarChar, imagePath)
            .query(`UPDATE PRODUCTS SET name=@name, price=@price, category=@category, 
                    description=@desc, image=@img WHERE product_id=@id`);
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Xóa sản phẩm (Khớp với deleteProduct)
app.delete('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        let pool = await sql.connect(config);
        await pool.request()
            .input('id', sql.Int, id)
            .query("DELETE FROM PRODUCTS WHERE product_id = @id");
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// STAFF – INGREDIENTS (NGUYÊN LIỆU – NHẬP KHO)
//  Lấy danh sách nguyên liệu (STAFF nhập kho)
app.get('/api/staff/ingredients', async (req, res) => {
    try {
        const result = await pool.request().query(`
            SELECT ingredient_id, name, unit, quantity, import_price
            FROM INGREDIENTS
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//  Thêm nguyên liệu mới
app.post('/api/staff/ingredients', async (req, res) => {
    const { name, unit } = req.body;
    try {
        await pool.request()
            .input('name', sql.NVarChar, name)
            .input('unit', sql.NVarChar, unit)
            .query(`
                INSERT INTO INGREDIENTS (name, unit, quantity, supplier, import_price)
                VALUES (@name, @unit, 0, N'Không xác định', 0)
            `);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//  Cập nhật giá nhập nguyên liệu
app.put('/api/ingredients/:id/price', async (req, res) => {
    const { id } = req.params;
    const { import_price } = req.body;
    try {
        await pool.request()
            .input('id', sql.Int, id)
            .input('price', sql.Decimal(18, 2), import_price)
            .query(`
                UPDATE INGREDIENTS
                SET import_price = @price
                WHERE ingredient_id = @id
            `);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// STAFF – PHIẾU NHẬP KHO (PURCHASE ORDERS)


//  Danh sách phiếu nhập
app.get('/api/staff/purchase-orders', async (req, res) => {
    try {
        const result = await pool.request().query(`
            SELECT purchase_id, supplier_name, total_amount, note, created_at
            FROM purchase_orders
            ORDER BY created_at DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//  Chi tiết phiếu nhập
app.get('/api/staff/purchase-orders/:id/details', async (req, res) => {
    try {
        const result = await pool.request()
            .input('pid', sql.Int, req.params.id)
            .query(`
                SELECT 
                    d.*,
                    i.name AS ingredient_name,
                    i.unit
                FROM purchase_order_details d
                JOIN ingredients i 
                    ON d.product_id = i.ingredient_id
                WHERE d.purchase_id = @pid
            `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ONLINE ORDER – ĐƠN HÀNG ONLINE (CUSTOMER)


//  Lấy danh sách đơn online (ADMIN / STAFF xem)
app.get('/api/online-orders', async (req, res) => {
    try {
        const result = await pool.request().query(`
            SELECT *
            FROM ONLINE_ORDERS
            ORDER BY created_at DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


//lịch sử đơn 
app.get('/api/admin/orders-history', async (req, res) => {
    try {
        const { type, startDate, endDate } = req.query;
        let pool = await sql.connect(config);
        
       
        let query = `
            SELECT o.*, u.full_name, u.phone 
            FROM dbo.orders o
            LEFT JOIN dbo.users u ON o.user_id = u.user_id
            WHERE 1=1
        `;
        const request = pool.request();

        if (type && type !== 'All') {
            query += " AND o.order_type = @type";
            request.input('type', sql.NVarChar, type);
        }

        if (startDate && endDate) {
            query += " AND o.created_at BETWEEN @start AND @end";
            request.input('start', sql.DateTime, `${startDate} 00:00:00`);
            request.input('end', sql.DateTime, `${endDate} 23:59:59`);
        }

        query += " ORDER BY o.created_at DESC";
        
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error("LỖI SQL:", err.message);
        res.status(500).json({ error: err.message });
    }
});
//chi tiết bookings
app.get('/api/bookings', async (req, res) => {
    try {
        let pool = await sql.connect(config);
        const result = await pool.request()
            .query(`
                SELECT 
                    booking_id, 
                    customer_name, 
                    phone, 
                    booking_date, 
                    booking_time, 
                    number_of_people, 
                    note, 
                    status, 
                    created_at, 
                    email 
                FROM dbo.bookings 
                ORDER BY created_at DESC
            `);
        
        res.json(result.recordset);
    } catch (err) {
        console.error("Lỗi SQL khi lấy bookings:", err.message);
        res.status(500).json({ error: "Lỗi Server Nội Bộ" });
    }
});
//  lấy chi tiết đơn hàng 
app.get('/api/admin/orders/:id/details', async (req, res) => {
    try {
        const { id } = req.params;
        let pool = await sql.connect(config);
        const result = await pool.request()
            .input('oid', sql.Int, id)
            .query(`
                SELECT od.*, p.name as product_name 
                FROM dbo.order_details od
                JOIN dbo.products p ON od.product_id = p.product_id
                WHERE od.order_id = @oid
            `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
//thống kê
//ngày
app.get('/api/admin/revenue/daily', async (req, res) => {
    try {
        const { date } = req.query; 
        let pool = await sql.connect(config);
        const result = await pool.request()
            .input('date', sql.VarChar, date) // Nhận chuỗi 'YYYY-MM-DD'
            .query(`
                SELECT 
                    FORMAT(created_at, 'yyyy-MM-dd') as order_date,
                    ISNULL(SUM(CASE WHEN order_type = 'Online' THEN total_amount ELSE 0 END), 0) as total_online,
                    ISNULL(SUM(CASE WHEN order_type = N'Trực tiếp' THEN total_amount ELSE 0 END), 0) as total_offline
                FROM dbo.orders
                WHERE FORMAT(created_at, 'yyyy-MM-dd') = @date
                GROUP BY FORMAT(created_at, 'yyyy-MM-dd')
            `);
        
        // Nếu không có dữ liệu, trả về mảng mặc định để biểu đồ không bị trống
        if (result.recordset.length === 0) {
            return res.json([{ order_date: date, total_online: 0, total_offline: 0 }]);
        }
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});
//tháng
app.get('/api/admin/revenue/monthly', async (req, res) => {
    try {
        const { startMonth, endMonth } = req.query;
        let pool = await sql.connect(config);
        const result = await pool.request()
            .query(`
                SELECT 
                    MONTH(created_at) as month, 
                    YEAR(created_at) as year,
                    SUM(CASE WHEN order_type = 'Online' THEN total_amount ELSE 0 END) as total_online,
                    SUM(CASE WHEN order_type = 'Trực tiếp' THEN total_amount ELSE 0 END) as total_offline
                FROM dbo.orders
                WHERE created_at BETWEEN '${startMonth}-01' AND '${endMonth}-31'
                GROUP BY MONTH(created_at), YEAR(created_at)
                ORDER BY year, month
            `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
//tổng hợp
app.get('/api/admin/revenue/profit-summary', async (req, res) => {
    try {
        const { start, end } = req.query;
        let pool = await sql.connect(config);
        const result = await pool.request()
            .input('start', sql.VarChar, start)
            .input('end', sql.VarChar, end)
            .query(`
                DECLARE @OnlineMoney DECIMAL(18,2), @OfflineMoney DECIMAL(18,2);
                DECLARE @OnlineCount INT, @OfflineCount INT, @ImportMoney DECIMAL(18,2);

                -- 1. Tính doanh thu từ bảng orders
                SELECT 
                    @OnlineMoney = ISNULL(SUM(CASE WHEN order_type = 'Online' THEN total_amount ELSE 0 END), 0),
                    @OfflineMoney = ISNULL(SUM(CASE WHEN order_type = N'Trực tiếp' THEN total_amount ELSE 0 END), 0),
                    @OnlineCount = COUNT(CASE WHEN order_type = 'Online' THEN order_id END),
                    @OfflineCount = COUNT(CASE WHEN order_type = N'Trực tiếp' THEN order_id END)
                FROM dbo.orders 
                WHERE FORMAT(created_at, 'yyyy-MM-dd') BETWEEN @start AND @end;

                -- 2. Tính tiền nhập hàng từ bảng purchase_orders của ông
                SELECT @ImportMoney = ISNULL(SUM(total_amount), 0) 
                FROM dbo.purchase_orders 
                WHERE FORMAT(created_at, 'yyyy-MM-dd') BETWEEN @start AND @end;

                -- 3. Trả về kết quả tổng hợp
                SELECT 
                    ISNULL(@OnlineMoney, 0) as online_money, 
                    ISNULL(@OnlineCount, 0) as online_count,
                    ISNULL(@OfflineMoney, 0) as offline_money, 
                    ISNULL(@OfflineCount, 0) as offline_count,
                    (ISNULL(@OnlineMoney, 0) + ISNULL(@OfflineMoney, 0)) as gross_revenue,
                    (ISNULL(@OnlineMoney, 0) + ISNULL(@OfflineMoney, 0)) * 0.05 as discount,
                    (ISNULL(@OnlineMoney, 0) + ISNULL(@OfflineMoney, 0)) * 0.08 as tax,
                    ISNULL(@ImportMoney, 0) as total_import,
                    ((ISNULL(@OnlineMoney, 0) + ISNULL(@OfflineMoney, 0)) 
                      - (ISNULL(@OnlineMoney, 0) + ISNULL(@OfflineMoney, 0))*0.13 
                      - ISNULL(@ImportMoney, 0)) as profit
            `);
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
//  Gửi tin nhắn (có thể kèm ảnh)
app.post('/api/messages/send', upload.single('image'), async (req, res) => {
    const {
        user_id,
        customer_name,
        customer_phone,
        sender_type,
        message_text
    } = req.body;

    const image_url = req.file ? `/images/${req.file.filename}` : null;

    try {
        await pool.request()
            .input('uid', sql.Int, user_id || null)
            .input('name', sql.NVarChar, customer_name)
            .input('phone', sql.VarChar, customer_phone)
            .input('type', sql.VarChar, sender_type)
            .input('msg', sql.NVarChar, message_text || '')
            .input('img', sql.NVarChar, image_url)
            .query(`
                INSERT INTO MESSAGES
                (user_id, customer_name, customer_phone, sender_type, message_text, image_url, created_at)
                VALUES (@uid, @name, @phone, @type, @msg, @img, GETDATE())
            `);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//  Danh sách khách đã từng nhắn (sidebar staff)
app.get('/api/messages/customers', async (req, res) => {
    try {
        const result = await pool.request().query(`
            SELECT customer_name, customer_phone, MAX(created_at) AS last_time
            FROM MESSAGES
            GROUP BY customer_name, customer_phone
            ORDER BY last_time DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//  Lịch sử chat theo số điện thoại
app.get('/api/messages/history/:phone', async (req, res) => {
    try {
        const result = await pool.request()
            .input('phone', sql.VarChar, req.params.phone)
            .query(`
                SELECT *
                FROM MESSAGES
                WHERE customer_phone = @phone
                ORDER BY created_at ASC
            `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//quản lý bài viết
//1. Lấy danh sách cho khách (Sửa lỗi: Chỉ giữ 1 route và dùng đúng news_id)
app.get('/api/news/:id', async (req, res) => {
    try {
        const { id } = req.params;
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('id', sql.Int, id)
            .query("SELECT * FROM news WHERE news_id = @id"); // Truy vấn theo news_id
        
        if (result.recordset.length > 0) {
            res.json(result.recordset[0]); // Trả về bài viết đầu tiên tìm thấy
        } else {
            res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });
        }
    } catch (err) {
        console.error("LỖI GET DETAIL NEWS:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});
app.get('/api/news', async (req, res) => {
    try {
        let pool = await sql.connect(config); // Sử dụng config đã khai báo
        let result = await pool.request()
            .query("SELECT * FROM news ORDER BY news_id DESC"); // Đúng tên bảng 'news'
        res.json(result.recordset);
    } catch (err) {
        console.error("LỖI GET NEWS:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});
// 2. Thêm bài viết
app.post('/api/news', upload.single('image'), async (req, res) => {
    try {
        const { title, summary, content } = req.body;
        // Đảm bảo đường dẫn lưu vào DB chỉ là /images/ tên_file
        const imagePath = req.file ? `/images/${req.file.filename}` : null;

        let pool = await sql.connect(config);
        await pool.request()
            .input('title', sql.NVarChar, title)
            .input('summary', sql.NVarChar, summary)
            .input('content', sql.NVarChar, content)
            .input('image', sql.NVarChar, imagePath)
            .query("INSERT INTO news (title, summary, content, image) VALUES (@title, @summary, @content, @image)");

        res.json({ success: true, message: "Đã đăng bài thành công!" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
// 3. Xóa bài viết (Sửa cột news_id cho đồng bộ)
app.delete('/api/news/:id', async (req, res) => {
    try {
        const { id } = req.params;
        let pool = await sql.connect(config);
        await pool.request()
            .input('id', sql.Int, id)
            .query("DELETE FROM news WHERE news_id = @id");
            
        res.json({ success: true, message: "Xóa thành công!" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
app.put('/api/news/:id', upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const { title, summary, content } = req.body;
        let pool = await sql.connect(config);

        // Bước 1: Kiểm tra xem có ảnh mới được upload lên không
        let query = "";
        const request = pool.request()
            .input('id', sql.Int, id)
            .input('title', sql.NVarChar, title)
            .input('summary', sql.NVarChar, summary)
            .input('content', sql.NVarChar, content);

        if (req.file) {
            // Nếu có ảnh mới -> Cập nhật cả ảnh
            const imagePath = `/images/${req.file.filename}`;
            request.input('image', sql.NVarChar, imagePath);
            query = "UPDATE news SET title = @title, summary = @summary, content = @content, image = @image WHERE news_id = @id";
        } else {
            // Nếu không chọn ảnh mới -> Giữ nguyên ảnh cũ trong DB
            query = "UPDATE news SET title = @title, summary = @summary, content = @content WHERE news_id = @id";
        }

        await request.query(query);
        res.json({ success: true, message: "Cập nhật bài viết thành công!" });
    } catch (err) {
        console.error("LỖI UPDATE NEWS:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});
// START SERVER

app.listen(3003, () => {
    console.log(' Backend đang chạy tại http://localhost:3003');
    console.log('Backend chạy thành công');
});
