const { pool } = require('../config/database');

// Get all orders
const getOrders = async (req, res) => {
  try {
    const query = `
      SELECT 
        o.id,
        o.order_id,
        o.status,
        o.total_amount,
        o.order_date,
        o.notes,
        s.name as student_name,
        s.email as student_email,
        s.department,
        s.year,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN students s ON o.student_id = s.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id, s.id
      ORDER BY o.created_at DESC
    `;
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

// Get single order with items
const getOrderById = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Get order details
    const orderQuery = `
      SELECT 
        o.*,
        s.name as student_name,
        s.email as student_email,
        s.phone as student_phone,
        s.student_id,
        s.department,
        s.year,
        s.course
      FROM orders o
      LEFT JOIN students s ON o.student_id = s.id
      WHERE o.id = $1
    `;
    
    const orderResult = await pool.query(orderQuery, [id]);
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Get order items
    const itemsQuery = `
      SELECT 
        oi.*,
        p.name as product_name,
        p.description as product_description,
        p.category as product_category
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
    `;
    
    const itemsResult = await pool.query(itemsQuery, [id]);
    
    const order = {
      ...orderResult.rows[0],
      items: itemsResult.rows
    };
    
    res.json(order);
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

// Create new order
const createOrder = async (req, res) => {
  const { student, products, notes } = req.body;
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Create or find student
    let studentResult = await client.query(
      'SELECT id FROM students WHERE email = $1',
      [student.email]
    );
    
    let studentId;
    
    if (studentResult.rows.length === 0) {
      // Create new student
      const insertStudent = await client.query(`
        INSERT INTO students (name, email, phone, student_id, department, year, course)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [student.name, student.email, student.phone, student.studentId, student.department, student.year, student.course]);
      
      studentId = insertStudent.rows[0].id;
    } else {
      studentId = studentResult.rows[0].id;
    }
    
    // Calculate total amount
    const totalAmount = products.reduce((sum, product) => sum + (product.price * product.quantity), 0);
    
    // Generate order ID
    const orderIdResult = await client.query('SELECT COUNT(*) FROM orders');
    const orderNumber = parseInt(orderIdResult.rows[0].count) + 1;
    const orderId = `ORD${orderNumber.toString().padStart(3, '0')}`;
    
    // Create order
    const orderResult = await client.query(`
      INSERT INTO orders (order_id, student_id, status, total_amount, notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [orderId, studentId, 'pending', totalAmount, notes]);
    
    const newOrderId = orderResult.rows[0].id;
    
    // Create order items
    for (const product of products) {
      await client.query(`
        INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
        VALUES ($1, $2, $3, $4, $5)
      `, [newOrderId, product.id, product.quantity, product.price, product.price * product.quantity]);
    }
    
    await client.query('COMMIT');
    
    res.status(201).json({
      message: 'Order created successfully',
      orderId: orderId,
      orderDbId: newOrderId
    });
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating order:', err);
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    client.release();
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  try {
    const result = await pool.query(
      'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating order:', err);
    res.status(500).json({ error: 'Failed to update order' });
  }
};

// Delete order
const deleteOrder = async (req, res) => {
  const { id } = req.params;
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Delete order items first
    await client.query('DELETE FROM order_items WHERE order_id = $1', [id]);
    
    // Delete order
    const result = await client.query('DELETE FROM orders WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Order not found' });
    }
    
    await client.query('COMMIT');
    
    res.json({ message: 'Order deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error deleting order:', err);
    res.status(500).json({ error: 'Failed to delete order' });
  } finally {
    client.release();
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  deleteOrder
};
