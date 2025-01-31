const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const { isAuthenticated } = require('../middleware/auth');
const Post = require('../models/Post');

const adminLayout = '../views/layouts/admin';

// Sign in page route
router.get('/signin', (req, res) => {
    const locals = {
        title: "Sign In",
        description: "User authentication"
    }
    res.render('admin/signin', { 
        locals,
        layout: adminLayout,
        currentRoute: '/signin'
    });
});

// Register page route
router.get('/register', (req, res) => {
    const locals = {
        title: "Register",
        description: "Create a new account"
    }
    res.render('admin/register', {
        locals,
        layout: adminLayout,
        currentRoute: '/register'
    });
});

// Handle register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const user = new User({
            name,
            email,
            password: hashedPassword
        });

        await user.save();
        res.redirect('/signin');
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Handle sign in
router.post('/signin', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Set session
        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email
        };

        res.redirect('/dashboard');
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Dashboard route
router.get('/dashboard', isAuthenticated, async (req, res) => {
    try {
        const locals = {
            title: "Dashboard",
            description: "User Dashboard"
        }

        const data = await Post.find();
        
        res.render('admin/dashboard', {
            locals,
            layout: adminLayout,
            data,
            currentRoute: '/dashboard',
            user: req.session.user
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add Post Page
router.get('/add-post', isAuthenticated, async (req, res) => {
    try {
        const locals = {
            title: 'Add Post',
            description: 'Add a new blog post'
        }

        res.render('admin/add-post', {
            locals,
            layout: adminLayout,
            currentRoute: '/add-post',
            user: req.session.user
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create New Post
router.post('/add-post', isAuthenticated, async (req, res) => {
    try {
        const newPost = new Post({
            title: req.body.title,
            body: req.body.body
        });

        await Post.create(newPost);
        res.redirect('/dashboard');
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Edit Post Page
router.get('/edit-post/:id', isAuthenticated, async (req, res) => {
    try {
        const locals = {
            title: "Edit Post",
            description: "Edit your blog post"
        };

        const data = await Post.findOne({ _id: req.params.id });
        
        res.render('admin/edit-post', {
            locals,
            layout: adminLayout,
            data,
            currentRoute: '/edit-post',
            user: req.session.user
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update Post
router.put('/edit-post/:id', isAuthenticated, async (req, res) => {
    try {
        await Post.findByIdAndUpdate(req.params.id, {
            title: req.body.title,
            body: req.body.body,
            updatedAt: Date.now()
        });

        res.redirect('/dashboard');
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete Post
router.delete('/delete-post/:id', isAuthenticated, async (req, res) => {
    try {
        await Post.deleteOne({ _id: req.params.id });
        res.redirect('/dashboard');
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/signin');
});

module.exports = router;
