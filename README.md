# Bagel-Shop-E-commerce-Platform

Bagel Station is a Retail Application that enables Users to Order their favorite Bagels along with their respective Customizations and Beverages at the comfort of their home. This application has a range of features and two modes of access namely User mode and Admin mode. The User mode is the regular access mode which is open for all Users to get their favorite Bagels. The Admin mode is a super access mode which along with the regular access also enables to create, update or delete Bagels or Beverages.

## **Folder Structure**

### - **bin**
    Contains the www.js file that contains the startup scripts to start the express app as a web server. Default port to run the application can be defined here.

### - **models**
    Contains the models required to connect with mongoose. The schema for User model is defined here which is used in Passport module for Authentication. Any other schemas required to connect with mongoose can be added here.

### - **public**
    All static files such as images, CSS and JavaScript files that needs to be served to the client can be placed here. Using the built-in middleware function in Express as shown below, these files can be served:
   **app.use(express.static(path.join(__dirname, 'public')))**

### - **routes**
    All the application endpoints (URI) that responds to the client requests are defined here.
    In our application we have mainly three features
####    &nbsp;&nbsp;&nbsp; - Login
####    &nbsp;&nbsp;&nbsp; - View Products/Menu
####    &nbsp;&nbsp;&nbsp; - Cart and Order
    All the Routes pertaining to this are defined in the index.js file. Any new end point that needs to be defined or any new route file that needs to be added has to be done in this folder.

### - **views**
    This folder contains all the HTML files for the application. These are stored in the ejs format which is a simple templating language which is used to generate HTML markup with plain JavaScript. Even basic functionalities using JavaScript can be embedded to the HTML pages. Inside the views folder contains the
    partials folder which contains portions of HTML code that can be re-used or repeated HTML sections such as footers and headers. All new pages needs to be added here. Basic Functionalities for the existing views are as follows:
### - partials
### &nbsp;&nbsp;&nbsp; - footer.ejs
    Contains the footer portion of the entire application that is common across all the pages.
### &nbsp;&nbsp;&nbsp; - footersection.ejs
    Contains the content present in the region above the footer
### &nbsp;&nbsp;&nbsp; - header.ejs
    Contains the Header section of the application which is common across all the Pages.
    This includes the User Profile section as well.
    All scripts and links required for the application is defined here as this section contains the head tag.
### &nbsp;&nbsp;&nbsp; - home.ejs
    This contains all the content displayed in the landing/home page of the application post login.
    It contains all the information about Bagel Station.
### &nbsp;&nbsp;&nbsp; - leftmenu.ejs
    This partial contains the HTML for the Left Navigation menu which is common across pages.
    Any new Navigation link required needs to be updated here.
### - cart.ejs
    This contains the HTML for the Cart functionality.
    It includes increasing/decreasing the quantity of the Products added to the Cart, deleting Products present in the Cart and provision to Confirm and proceed with the Order.
### - createorupdateitem.ejs
    This contains the form to Create/Update the item. Any new fields that needs to be displayed or updated needs to be added here.
### - error.ejs
    This contains the general error content that is shown when an unexpected error occurs in the application.
    Any new information, for example showing a Create Ticket link, can be added here.
### - index.ejs
    This is the main HTML content file that includes the partials and navigations.
### - login.ejs
    This contains the login page content, any new information that needs to be displayed on the landing page of the application can be displayed here.
### - loginerror.ejs
    This contains the content displayed during login error.
### - orderhistory.ejs
    This contains the content displayed in the Order History Page.
### - productdetails.ejs
    This contains the content displayed when clicked on a Product. It lists all the details of the Product along with Customizations and price. You can increase the quantity and add the same to the cart.
### - register.ejs
    This contains the content required for signing up a User. Multiple validations such as password criteria, inclusion of address, email id format and duplicate User Id is handled here.
### - registersuccess.ejs
    This contains the content displayed on successful Sign Up/Registration of a User.

### - **app.js**
    This is the entry point to the Application. All the middlewares that are required in the application needs to be registered here. Features like Application level Sessions, Application level Error Handling, Registering the routes are handled here. Connections to database, in our case MongoDB is done here, for connecting to any other database, the connection needs to be defined here.
