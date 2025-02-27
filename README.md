# **BlogBuzz - A Dynamic Blogging Platform**  

**BlogBuzz** is a dynamic and user-friendly blogging platform that allows users to create, explore, and interact with blogs seamlessly. Designed with a modern UI and secure authentication, BlogBuzz provides a smooth blogging experience while fostering an engaging community.  

## **Key Features**  

### **1. User Authentication & Profile Management** 
- **Sign Up & Login**: Users can create an account and log in securely.  
- **Profile Management**: Users can view their details and published blogs.  
- **Role-Based Navigation**: Logged-in users can post content, while guests can only browse and read.
- **Session Management** using express-session to keep users logged in securely.
- **Bcryptjs** is used to securely hash and store user passwords. 

### **2. Blogging Features**  
- **Post Creation**: Users can write, edit, and publish blog posts.
- **Like & Comment System**: Readers can interact with posts by liking and commenting.

### **3. Search & Explore**  
- **Blog Search**: Users can search blogs by title, content, author, or tags.
- **Recent Posts**: Displays the latest published articles on the top.

### **4. Responsive & Intuitive UI**  
- Fully **responsive design**, optimized for both desktop and mobile. 
- **Clean and Minimalist UI** for enhanced readability and navigation.  

## Screenshots & Preview  

### Homepage  
![Home Page](https://raw.githubusercontent.com/TanmayJain24/BlogBuzz/public/images/Home_Page.png)  
![Home Page](https://raw.githubusercontent.com/TanmayJain24/BlogBuzz/public/images/Home_Page1.png) 

### Blog Page (Explore Section)  
![Home Page](https://raw.githubusercontent.com/TanmayJain24/BlogBuzz/public/images/Blog_Page.png)  

### Post Page (Create a New Blog)  
![Home Page](https://raw.githubusercontent.com/TanmayJain24/BlogBuzz/public/images/Create_Page.png)   

### Search Results 
![Home Page](https://raw.githubusercontent.com/TanmayJain24/BlogBuzz/public/images/Search_Results.png)   

### Profile Page  
![Profile Page](https://raw.githubusercontent.com/TanmayJain24/BlogBuzz/main/images/Profile_Page.png)  


## **Tech Stack**  
- **Backend**: Node.js, Express.js  
- **Frontend**: HTML, CSS, JavaScript, EJS  
- **Database**: MySQL
- **Password Hashing**: Bcryptjs  
- **Styling**: Bootstrap, CSS  
- **Version Control**: Git, GitHub  

## **Installation & Setup**  
### **1. Clone the Repository**  
```bash
git clone https://github.com/TanmayJain24/BlogBuzz.git
cd BlogBuzz
```

### **2. Install Dependencies**  
```bash
npm install
```

### **3. Set Up Environment Variables**  
Create a `.env` file in the root directory and add:  
```
PORT=5000
SESSION_SECRET=your_secret_key
```

### **4. Run the Application**  
```bash
npm start
```
The application will be available at `http://localhost:5000`.
