const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Your_Password',
    database: 'blogDatabase'
  });

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL: ' + err.stack);
    return;
  }
  console.log('Connected to MySQL as id ' + connection.threadId);
});

// Middleware to check authentication
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
      return next();
  }
  res.redirect("/login");
}
  
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

// Routes
router.get('/', (req, res) => {
    const locals = {
        title: "BlogBuzz"
    };
    res.render('index', { username: req.session.user, layout: false });
});

router.get('/signup',(req,res) => {
    res.render('signup', { layout: false});
});

router.post('/signup', async(req, res) => {
  const { username, email, password, fullname } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      connection.query("INSERT INTO Users (username, email, password, full_name) VALUES (?, ?, ?, ?)",
          [username, email, hashedPassword, fullname],
          (err, result) => {
              if (err) {
                  return res.status(500).json({ error: "Error registering user" });
              }
              res.redirect("/login");
          }
      );
    } catch (error) {
      res.status(500).json({ error: "Server error" });
  }
});

router.get('/login', (req,res) => {
  res.render('login', { layout: false});
});

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  connection.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (err) {
        return res.status(500).json({ error: "Database error" });
    }
    if (results.length === 0) {
        return res.status(401).json({ error: "Invalid email or password" });
    }
    const user = results[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
        return res.status(401).json({ error: "Invalid email or password" });
    }
    req.session.user = {name: user.username, email: user.email };
    res.redirect("/index");
  });
});

router.get('/blog', isAuthenticated, (req, res) => {
  const email = req.user ? req.user.email : null;

  const postsQuery = `
    SELECT 
        Posts.title, 
        ANY_VALUE(Posts.content) AS content, 
        ANY_VALUE(Posts.author) AS author, 
        COUNT(PostLikes.email) AS likes
    FROM Posts
    LEFT JOIN PostLikes ON Posts.title = PostLikes.post_title
    GROUP BY Posts.title;
  `;

  connection.query(postsQuery, (postError, postResults) => {
    if (postError) {
      console.error('Error retrieving posts:', postError);
      return res.status(500).send('Error retrieving posts');
    }

    // Fetch all comments
    connection.query('SELECT * FROM Comments', (commentError, commentResults) => {
      if (commentError) {
        console.error('Error retrieving comments:', commentError);
        return res.status(500).send('Error retrieving comments');
      }

      // Associate comments with respective posts
      const combinedData = postResults.map(post => {
        const postComments = commentResults
          .filter(comment => comment.post_title === post.title)
          .map(comment => ({ 
            content: comment.comment_content, 
            author: comment.author 
          }));
        return { 
          ...post, 
          comments: postComments.length ? postComments : null 
        };
      });
      res.render('blog', { posts: combinedData, user: req.user || {}, layout: false });
    });
  });
});

// Like a post
router.post('/like', isAuthenticated, (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: "You must be logged in to like a post" });
  }

  const postTitle = req.body.postTitle;
  const email = req.session.user.email;

  if (!postTitle) {
    return res.status(400).json({ success: false, message: "Post title is required" });
  }

  // Check if the user has already liked the post
  const checkQuery = 'SELECT * FROM PostLikes WHERE post_title = ? AND email = ?';
  connection.query(checkQuery, [postTitle, email], (error, results) => {
    if (error) {
      console.error('Error checking like:', error);
      return res.status(500).json({ success: false, message: 'Error checking like' });
    }

    if (results.length > 0) {
      // User has already liked the post, so remove the like
      const deleteQuery = 'DELETE FROM PostLikes WHERE post_title = ? AND email = ?';
      connection.query(deleteQuery, [postTitle, email], (error) => {
        if (error) {
          console.error('Error removing like:', error);
          return res.status(500).json({ success: false, message: 'Error removing like' });
        }

        updatePostLikes(postTitle, res, `Post '${postTitle}' unliked by ${email}`);
      });
    } else {
      // Insert like if it doesn't exist
      const insertQuery = 'INSERT INTO PostLikes (post_title, email) VALUES (?, ?)';
      connection.query(insertQuery, [postTitle, email], (error) => {
        if (error) {
          console.error('Error inserting like:', error);
          return res.status(500).json({ success: false, message: 'Error inserting like' });
        }

        updatePostLikes(postTitle, res, `Post '${postTitle}' liked by ${email}`);
      });
    }
  });
});

// Function to update total likes in Posts table and fetch updated count
function updatePostLikes(postTitle, res, logMessage) {
  const updateCountQuery = `
    UPDATE Posts 
    SET likes = (SELECT COUNT(email) FROM PostLikes WHERE post_title = ?) 
    WHERE title = ?;
  `;
  connection.query(updateCountQuery, [postTitle, postTitle], (error) => {
    if (error) {
      console.error('Error updating like count:', error);
      return res.status(500).json({ success: false, message: 'Error updating like count' });
    }

    // Fetch updated like count
    const countQuery = 'SELECT likes FROM Posts WHERE title = ?';
    connection.query(countQuery, [postTitle], (error, results) => {
      if (error) {
        console.error('Error fetching like count:', error);
        return res.status(500).json({ success: false, message: 'Error fetching like count' });
      }

      const newLikeCount = results[0].likes;
      console.log(logMessage + `. Total likes: ${newLikeCount}`);

      return res.json({ success: true, message: logMessage, likes: newLikeCount });
    });
  });
}

// Comment on a post - Requires authentication
router.post('/comment', isAuthenticated, (req, res) => {
  const { commentContent, postTitle } = req.body;
  const author = req.session.user.name;

  if (!commentContent || !postTitle) {
    return res.status(400).json({ success: false, message: 'Comment content and post title are required' });
  }

  // Insert comment linked to post
  const query = 'INSERT INTO Comments (comment_content, post_title, author) VALUES (?, ?, ?)';
  connection.query(query, [commentContent, postTitle, author], (error) => {
    if (error) {
      console.error('Error inserting comment:', error);
      return res.status(500).json({ success: false, message: 'Error inserting comment' });
    }
    console.log(`Comment added by ${author} on post '${postTitle}'`);
    res.json({ success: true, message: 'Comment added successfully' });
  });
});

router.get('/posting', isAuthenticated, (req,res) => {
  res.render('posting', { layout: false, authorName: req.session.user.name});
});

router.post('/posting', isAuthenticated, (req, res) => {
  const { postTitle, postContent, authorName} = req.body;

  if (!postContent) {
      return res.status(400).send('Content cannot be empty');
  }
  // Insert the new post into the database
  const query = 'INSERT INTO Posts (title, content, author, likes) VALUES (?, ?, ?, 0)';
  connection.query(query, [postTitle, postContent, authorName], (error, results) => {
    if (error) {
      console.error('Error creating post:', error);
      return res.status(500).send('Error creating post');
    }
    console.log('Post created successfully');
    res.redirect('/blog');
  });
});

router.post('/search', isAuthenticated, (req, res) => {
  const searchQuery = `%${req.body.searchQuery}%`;
  const query = `SELECT * FROM Posts WHERE title LIKE ? OR author LIKE ?`;
  connection.query(query, [searchQuery, searchQuery], (error, results) => {
    if (error) {
      console.error('Error searching posts:', error);
      res.status(500).send('Error searching posts');
      return;
    }
    res.render('search-results', { results: results, layout: false });
  });
});

router.get('/aboutus', (req,res) => {
  res.render('aboutus', { layout: false});
});

router.get("/myprofile", isAuthenticated, (req, res) => {
  console.log("Session user object:", req.session.user);
  console.log("Fetching user details for:", req.session.user.email);
  console.log("Fetching posts for:", req.session.user.name);

  connection.query("SELECT * FROM Users WHERE email = ?", [req.session.user.email], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).send("Error fetching user details");
    }
    if (results.length === 0) {
      return res.status(404).send('404');
    }

    const user = results[0];

    connection.query("SELECT * FROM Posts WHERE author = ?", [user.username], (postErr, postResults) => {
      if (postErr) {
        return res.status(500).send("Error fetching posts");
      }
      res.render("myprofile", { user, posts: postResults, layout: false });
    });
  });
});

router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).send("Logout failed");
    }
    res.redirect('/login');
  });
});

module.exports = router;