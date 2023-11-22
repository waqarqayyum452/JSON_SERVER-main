// server.js
const jsonServer = require('json-server');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

server.use(middlewares);
server.use(jsonServer.bodyParser);

const SECRET_KEY = '2uQXTRJ6YzupWu7GNzTAg2C7fLW3EH7s'; // Replace with a secure secret key1

server.post('/register', (req, res) => {
  const { username, password } = req.body;

  // Check if the username already exists
  const existingUser = router.db.get('users').find({ username }).value();
  if (existingUser) {
    return res.status(400).json({ message: 'Username already exists' });
  }

  // Hash the password before storing it
  const hashedPassword = bcrypt.hashSync(password, 10);

  // Create the new user
  const newUser = {
    id: Date.now(), // Generate a unique ID (replace with a more robust method in a real application)
    username,
    password: hashedPassword,
  };

  // Add the new user to the 'users' collection
  router.db.get('users').push(newUser).write();

  res.status(201).json({ message: 'User created successfully' });
});
server.get('/check-user', (req, res) => {
    const { email } = req.query;
  
    // Check if the user with the provided email exists
    const existingUser = router.db.get('users').find({ username: email }).value();
  
    if (existingUser) {
      res.json({ exists: true, message: 'User found' });
    } else {
      res.json({ exists: false, message: 'User not found' });
    }
  });
// Login endpoint remains unchanged
server.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = router.db.get('users').find({ username }).value();

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  const token = jwt.sign({ sub: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });

  res.status(200).json({ token });
});
server.post('/reset-password', (req, res) => {
    const { username, resetToken, newPassword } = req.body;

    // Check if the resetToken matches the SECRET_KEY
    if (resetToken === SECRET_KEY) {
        // Find the user by username
        const user = router.db.get('users').find({ username }).value();

        // Check if the user exists
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        try {
            // Hash the new password
            const hashedPassword = bcrypt.hashSync(newPassword, 10); // You can adjust the number of rounds

            // Update the user's password in the database
            router.db.get('users').find({ username }).assign({ password: hashedPassword }).write();

            res.status(200).json({ message: 'Password reset successful' });
        } catch (error) {
            console.error('Hashing Error:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    } else {
        return res.status(401).json({ message: 'Invalid or expired reset token' });
    }
});
server.get('/products', (req, res) => {
    const products = router.db.get('products').value();
    res.json(products);
  });
  
  server.get('/products/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    const product = router.db.get('products').find({ id: productId }).value();
  
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  });
  
  server.post('/products', (req, res) => {
    const newProduct = req.body;
    console.log(req.body);
  
    // Add the new product to the database
    const products = router.db.get('products').value();
    const productId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    newProduct.id = productId;
  
    router.db.get('products').push(newProduct).write();
  
    res.status(201).json(newProduct);
  });
  
  server.put('/products/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    const updatedProduct = req.body;
  
    // Update the product in the database
    const existingProduct = router.db.get('products').find({ id: productId });
    if (existingProduct.value()) {
      existingProduct.assign(updatedProduct).write();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  });
  
  server.delete('/products/:id', (req, res) => {
    const productId = parseInt(req.params.id);
  
    // Delete the product from the database
    const removedProduct = router.db.get('products').remove({ id: productId }).write();
  
    if (removedProduct.length > 0) {
      res.json({ message: 'Product deleted successfully' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  });

server.use(router);

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`JSON Server is running on port ${PORT}`);
});
