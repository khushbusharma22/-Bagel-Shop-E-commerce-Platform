//#region MongoDB related
const productsDB = "BagelStation";
const productsCollection = db.get("products");
const cartCollection = db.get("cart");
const ordersCollection = db.get("orders");
const usersCollection = db.get("users");
var monk = require('monk');
var db = monk(`localhost:27017/${productsDB}`);
//#endregion

//#region Imports
var express = require('express');
const passport = require('passport');
var fs = require('fs');
const User = require('../models/user'); // User Model 
const connectEnsureLogin = require('connect-ensure-login');// authorization
//#endregion

var router = express.Router();
const filterOptions = ["Bagel", "Beverage"];
const filterValues = ["bagel", "beverage"];
const registerUser = { username: "", firstname: "", lastname: "", phonenumber: "", emailid: "", addresses: [], password: "", gender: "", dateofbirth: "", error: "" };
const defaultPageSize = 8;
/****************************************************************** */
/****************************************************************** */

var userProfile;//Holds the logged in User's data

/**
 * Default handler for Routing
 */
router.get('/', (req, res, next) => {
  res.redirect('/login');
});

/**
 * Handles routing for Login Module
 */
router.get('/login', (req, res) => {
  res.render('login');
});

/**
 * Handles routing in case of error while logging into the application
 */
router.get('/loginerror', (req, res) => {
  res.render('loginerror');
});

/**
 * Logs out of the session and redirects to default handler
 */
router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

/**
 * Authenticates the credentials entered using the Passport module
 * On successful authentication, this method redirects to the Home page
 * On failure, this method redirects to Login Error page
 */
router.post('/login', passport.authenticate('local', { failureRedirect: '/loginerror' }), (req, res) => {
  usersCollection.findOne({ username: req.user.username }, function (err, userData) {
    if (err) throw err;
    userProfile = userData;
    res.redirect('/home');
  });
});


/**
 * Handles the routing for register module
 */
router.get('/register', (req, res) => {
  res.render('register', registerUser);
});

/**
 * Handles fetching User details
 */
router.get('/user', (req, res) => {
  res.json(userProfile);
});

/**
 * Handles the registration/sign up of a User
 */
router.post('/register', (req, res) => {
  var body = req.body;
  var addresses = [];
  var types = typeof req.body["address[address1][addresstype]"] === "string" ? [req.body["address[address1][addresstype]"]] : typeof req.body["address[address1][addresstype]"] === "undefined" ? [] : req.body["address[address1][addresstype]"];
  var locations = typeof req.body["address[address1][location]"] === "string" ? [req.body["address[address1][location]"]] : typeof req.body["address[address1][location]"] === "undefined" ? [] : req.body["address[address1][location]"];
  var zipcodes = typeof req.body["address[address1][zipcode]"] === "string" ? [req.body["address[address1][zipcode]"]] : typeof req.body["address[address1][zipcode]"] === "undefined" ? [] : req.body["address[address1][zipcode]"];

  types.forEach((type, index) => {// To insert multiple addresses entered in the sign up form
    var address = {
      addresstype: type,
      location: locations[index],
      zipcode: zipcodes[index]
    }
    addresses.push(address);
  });
  body.addresses = addresses;

  User.register(new User({ firstname: req.body.firstname, lastname: req.body.lastname, username: req.body.username, dob: req.body.dateofbirth, gender: req.body.gender, emailid: req.body.emailid, phonenumber: req.body.phonenumber, addresses: addresses, role: 'user' }), req.body.password, function (err, user) {
    if (err) {
      body.error = err.message;
      return res.render("register", body);//If error, pass the error message in the body and display the same in the UI
    }
    else { //If success, display successful registration message
      return res.render('registersuccess', { name: req.body.firstname + ' ' + req.body.lastname });
    }
  });
});

/**
 * Handles routing to Home page
 */
router.get('/home', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  res.render('index',
    {
      currentPage: 0,
      skip: 0,
      results: [],
      category: "",
      userProfile: userProfile,
      productName: "",
      categoryFilter: "",
      filterOptions,
      filterValues,
      paginateCategory: ""
    });
});

//#region Product List and details related

/**
 * Ensures that the user is logged in and fetches the Beverages and Bagels data to display on the Menu page
 */
router.get('/menu', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  productsCollection.find(
    {
      category: { $in: ["beverage", "bagel"] },
      isdeleted: false
    },
    {
      limit: defaultPageSize,
      skip: 0,
      sort: { name: 1 }
    }, function (err, products) {
      if (err) throw err;
      res.render('index', {
        currentPage: 1,
        skip: 0,
        results: products,
        category: "Menu",
        userProfile: userProfile,
        productName: "",
        categoryFilter: "",
        filterOptions,
        filterValues,
        paginateCategory: ""
      });
    });
});

/**
 * Ensures that the user is logged in and fetches all the Beverages to display in the Menu when the category chosen is Beverages
 */
router.get('/beverages', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  productsCollection.find(
    {
      category: "beverage",
      isdeleted: false
    },
    {
      limit: defaultPageSize,
      skip: 0,
      sort: { name: 1 }
    }, function (err, products) {
      if (err) throw err;
      res.render('index',
        {
          currentPage: 1,
          skip: 0,
          results: products,
          category: "Beverages",
          userProfile: userProfile,
          productName: "",
          categoryFilter: "beverage",
          filterOptions: [filterOptions[1]],
          filterValues: [filterValues[1]],
          paginateCategory: "beverage"
        });
    });
});

/**
 * Ensures that the user is logged in and fetches count of the Products to be displayed for Pagination
 */
router.get('/products/count', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  var category = req.query.category ? [req.query.category] : ["beverage", "bagel"];

  productsCollection.count(
    {
      category: { $in: category },
      name: { "$regex": req.query.productName, "$options": "i" },
      isdeleted: false
    }, function (err, count) {
      if (err) throw err;
      res.json({ count });
    });
});

/**
 * Ensures that the user is logged in and handles Pagination for Menu Page
 */
router.post('/menu', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  handlePagination(req, res);
});

/**
 * Ensures that the user is logged in and handles Pagination for Bagels Page
 */
router.post('/bagels', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  handlePagination(req, res);
});

/**
 * Ensures that the user is logged in and handles Pagination for Beverages Page
 */
router.post('/beverages', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  handlePagination(req, res);
});

/**
 * Ensures that the user is logged in and fetches all the Bagels when the category chose in Bagels
 */
router.get('/bagels', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  productsCollection.find(
    {
      category: "bagel",
      isdeleted: false
    },
    {
      limit: defaultPageSize,
      skip: 0,
      sort: { name: 1 }
    }, function (err, products) {
      if (err) throw err;
      res.render('index',
        {
          currentPage: 1,
          skip: 0,
          results: products,
          category: "Bagels",
          userProfile: userProfile,
          productName: "",
          categoryFilter: "bagel",
          filterOptions: [filterOptions[0]],
          filterValues: [filterValues[0]],
          paginateCategory: "bagel"
        });
    });
});

/**
 * Ensures that the user is logged in and handles the search feature in the Menu page
 */
router.post('/menu/search', connectEnsureLogin.ensureLoggedIn(), (req, res) => {

  var filterOpts = req.body.activeSideMenu === "Bagels" ? [filterOptions[0]] : req.body.activeSideMenu === "Beverages" ? [filterOptions[1]] : filterOptions;
  var filterVals = req.body.activeSideMenu === "Bagels" ? [filterValues[0]] : req.body.activeSideMenu === "Beverages" ? [filterValues[1]] : filterValues;

  if (req.body.productName && !req.body.categoryFilter) {//If User has searched only by Product Name and no filtering by Category
    productsCollection.find(
      {
        name: { "$regex": req.body.productName, "$options": "i" },
        category: { $in: ["beverage", "bagel"] },
        isdeleted: false
      },
      {
        limit: defaultPageSize,
        skip: 0,
        sort: { name: 1 }
      }, function (err, products) {
        if (err) throw err;
        res.render('index',
          {
            currentPage: 1,
            skip: 0,
            results: products,
            category: req.body.activeSideMenu,
            userProfile: userProfile,
            productName: req.body.productName,
            categoryFilter: "",
            filterOptions: filterOpts,
            filterValues: filterVals,
            paginateCategory: ""
          });
      });
  }

  else if (req.body.categoryFilter && !req.body.productName) {//If User has filtered by a Category and hasn't searched for a Product
    productsCollection.find(
      {
        category: req.body.categoryFilter,
        isdeleted: false
      },
      {
        limit: defaultPageSize,
        skip: 0,
        sort: { name: 1 }
      }, function (err, products) {
        if (err) throw err;
        res.render('index',
          {
            currentPage: 1,
            skip: 0,
            results: products,
            category: req.body.activeSideMenu,
            userProfile: userProfile,
            productName: "",
            categoryFilter: req.body.categoryFilter,
            filterOptions: filterOpts,
            filterValues: filterVals,
            paginateCategory: req.body.categoryFilter
          });
      });
  }

  else if (req.body.productName && req.body.categoryFilter) {//If User has filtered by a Category as well as searched for a Product
    productsCollection.find(
      {
        name: { "$regex": req.body.productName, "$options": "i" },
        isdeleted: false,
        category: req.body.categoryFilter
      },
      {
        limit: defaultPageSize,
        skip: 0,
        sort: { name: 1 }
      }, function (err, products) {
        if (err) throw err;
        res.render('index', {
          currentPage: 1,
          skip: 0,
          results: products,
          category: req.body.activeSideMenu,
          userProfile: userProfile,
          productName: req.body.productName,
          categoryFilter: req.body.categoryFilter,
          filterOptions: filterOpts,
          filterValues: filterVals,
          paginateCategory: req.body.categoryFilter
        });
      });
  }
  else if (!req.body.productName && !req.body.categoryFilter) {//If user has not filtered by category and has not searched for a Product then redirect to Menu
    res.redirect("/menu");
  }
});

/**
 * Handles fetching of the Details of a particular product and the customization products 
 */
router.get('/productdetails/:id', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  productsCollection.findOne({ _id: req.params.id }, function (err, product) {
    if (err) throw err;
    var categories = ["spread", "sidetubs", "syrup"];
    productsCollection.find({ category: { $in: categories }, isdeleted: false }, function (err, customProducts) {
      var spreads = customProducts.filter(c => c.category === "spread");
      var syrups = customProducts.filter(c => c.category === "syrup");
      res.render('productdetails', { product: product, spreads: spreads, sidetubs: spreads, syrups: syrups });
    });
  });
});

//#endregion

//#region Cart Related Routes

/**
 * Handles the addition of Products to the cart
 */
router.post('/cart', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  var controlValues = req.body;
  var productIds = [];
  var quantity = 0;
  var productid = "";
  Object.keys(controlValues).forEach(key => {//Extract Quantity for each product added to the cart
    if (key) {
      if (key.includes("quantity_")) {
        productid = key.split("quantity_")[1];
        productIds.push(productid);
        quantity = controlValues[key];
      }
      else {
        productIds.push(key);
      }
    }
  });

  var dbCartData = {};
  var cartProduct;
  productsCollection.find({ _id: { $in: productIds } }, function (err, products) {//Get details of all the Products added in the Cart
    cartCollection.findOne({ userId: userProfile.username }, function (err, cartValues) {//Get existing Cart details for the logged in User
      if (err) throw err;

      if (cartValues) {//If Cart details for the User then assign the Cart details with the current Cart details
        dbCartData = cartValues;
      }
      else {//If no Cart details found then create a new entry for the User
        dbCartData = { userId: userProfile.username, products: [] };
      }

      if (products && products.length) {
        var mainProduct = products.find(p => p._id.toString() === productid);//Get the Product added to the Cart
        products = products.filter(p => p._id.toString() !== productid);//Remove the Product from the list of all Products fetched

        cartProduct = {
          cartid: monk.id(),//Create new Mongo id for the Cart Products
          productcategory: mainProduct.category,
          productname: mainProduct.name,
          productid: mainProduct._id,
          quantity: quantity,
          price: mainProduct.price,
          customizations: []
        }

        products.forEach(prod => {
          cartProduct.customizations.push({//Insert customization products for the Product added to the cart
            cartid: monk.id(),
            productcategory: prod.category,
            productname: prod.name,
            productid: prod._id,
            quantity: 1,
            price: prod.price
          });
        });
        dbCartData.products.push(cartProduct);

        cartCollection.update({ userId: userProfile.username },
          {
            $set: {
              products: dbCartData.products
            }
          }, { upsert: true }, function (err, data) {
            res.redirect("cart");
          });
      }
    });
  });
});

/**
 * Handles fetching the Products saved in cart for the logged in User
 */
router.get('/cart', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  cartCollection.findOne({ userId: userProfile.username }, function (err, cartValues) {
    if (err) throw err;
    var totalPrice = 0;
    if (cartValues && cartValues.products) {
      totalPrice = getTotalPrice(cartValues.products);//Calculate the Total Price
    }
    res.render('cart', { cartValues: cartValues ? cartValues.products : [], itemsCount: cartValues ? cartValues.products.length : 0, totalPrice });
  });
});

/**
 * Handled deletion of a particular product or the customization product from the cart
 */
router.delete('/cart/delete', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  var body = req.body;
  cartCollection.findOne({ userId: userProfile.username }, function (err, cartValue) {//Get the last saved Cart Data for the logged in User
    var cartData = cartValue;
    if (cartData && cartData.products) {
      var mainProduct = cartData.products.find(p => p.cartid.toString() === body.cartid);//Check whether its the main product that needs to be deleted
      if (mainProduct) {//If yes, remove the product from the list
        cartData.products = cartData.products.filter(p => p.cartid.toString() !== body.cartid);
      }
      else {//If not, iterate over all the main products and check whether the Product to be deleted is present in the customizations for the same
        cartData.products.forEach(prod => {
          if (prod.customizations) {
            var custProduct = prod.customizations.find(p => p.cartid.toString() === body.cartid);
            if (custProduct) {//If found in customizations then remove the product from the customizations
              prod.customizations = prod.customizations.filter(p => p.cartid.toString() !== body.cartid);
            }
          }
        });
      }
    }

    cartCollection.update({ userId: userProfile.username },
      {
        $set: {
          products: cartData.products
        }
      }, { upsert: true }, function (err, data) {
        res.send("Success");
      });
  });
});

/**
 * Handled the update of the quantity of a product or the customization product in the cart
 */
router.put('/cart/update', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  var body = req.body;

  cartCollection.findOne({ userId: userProfile.username }, function (err, cartValue) {
    var cartData = cartValue;
    if (cartData && cartData.products) {
      var mainProduct = cartData.products.find(p => p.cartid.toString() === body.cartid);
      if (mainProduct) {
        mainProduct.quantity = body.updatedVal;
      }
      else {
        cartData.products.forEach(prod => {
          if (prod.customizations) {
            var custProduct = prod.customizations.find(p => p.cartid.toString() === body.cartid);
            if (custProduct) {
              custProduct.quantity = body.updatedVal;
            }
          }
        })
      }

      cartCollection.update({ userId: userProfile.username },
        {
          $set: {
            products: cartData.products
          }
        }, { upsert: true }, function (err, data) {
          if (err) throw err;
          var totalPrice = 0;
          if (cartData && cartData.products) {
            totalPrice = getTotalPrice(cartData.products);
          }
          res.send(totalPrice.toString());
        });
    }
    else {
      res.sendStatus(500);
    }
  });
});
//#endregion


/**
 * Handles the stock validation of the Products in the cart
 * Decides which row/product has error
 */
router.post("/cart/validate", connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  cartCollection.findOne({ userId: userProfile.username }, function (err, cartValues) {
    if (err) throw err;
    var cartProductIds = [];
    var validationInfo = [];
    if (cartValues && cartValues.products) {
      cartValues.products.forEach(p => {
        cartProductIds.push(p.productid);
        validationInfo.push({
          cartid: p.cartid.toString(),
          cartQuantity: p.quantity,
          productid: p.productid.toString(),
          hasError: false//By default, no error
        });
        p.customizations.forEach(c => {
          cartProductIds.push(c.productid);
          validationInfo.push({
            cartid: c.cartid.toString(),
            cartQuantity: c.quantity,
            productid: c.productid.toString(),
            hasError: false
          });
        })
      });
    }
    productsCollection.find({ _id: { $in: cartProductIds } }, (err, products) => {
      if (err) throw err;
      if (products && products.length) {
        validationInfo.forEach(v => {
          var stockProd = products.find(p => p._id.toString() === v.productid);
          if (!stockProd) {//If product in the cart not found in the Products list then it is an error and the same is displayed in the UI using this bool
            v.hasError = true;
          }
          if (parseInt(stockProd.stockquantity) < parseInt(v.cartQuantity)) {//If the requested quantity is more than the stock then error
            v.hasError = true;
            v.stockQuantity = stockProd.stockquantity;
          }
          else {//If requested quantity exists, then reduce the same from the Products list
            stockProd.stockquantity -= parseInt(v.cartQuantity);
          }

        });
        res.send(validationInfo);
      }
    });
  });
});


/**
 * Handles ordering of products present in the Cart for a User
 */
router.post("/order", connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  cartCollection.findOne({ userId: userProfile.username }, function (err, cartValues) {
    var products = cartValues.products;

    var productIds = [];
    var orderId = "";
    products.forEach(p => {
      p.totalPrice = parseInt(p.quantity) * parseFloat(p.price);
      productIds.push(p.productid);
      delete p.cartid;
      delete p.price
      p.customizations.forEach(c => {
        c.totalPrice = parseInt(c.quantity) * parseFloat(c.price);
        productIds.push(c.productid);

        delete c.cartid;
        delete c.price
      })
    })

    var orderObject = {
      address: userProfile.addresses[0],
      userId: userProfile.username,
      products: products
    }
    ordersCollection.insert(orderObject, function (err, data) {
      if (err) throw err;
      orderId = data._id.toString();

      cartCollection.remove({ userId: userProfile.username }, function (err, data) {
        if (err) throw err;
        productsCollection.find({ _id: { $in: productIds } }, function (err, products) {
          productIds.forEach(p => {
            var dbProduct = products.find(f => f._id.toString() === p.toString());
            var orderProduct = orderObject.products.find(f => f.productid.toString() === p.toString());
            if (dbProduct && orderProduct) {
              dbProduct.stockquantity -= parseInt(orderProduct.quantity);
            }
            else {
              orderObject.products.forEach(d => {
                var dbCProduct = products.find(f => f._id.toString() === p.toString());
                var orderCProduct = d.customizations.find(f => f.productid.toString() === p.toString());
                if (dbCProduct && orderCProduct) {
                  dbCProduct.stockquantity -= parseInt(orderCProduct.quantity);
                }
              });
            }
          });

          var tracker = 0;
          var limit = products.length;
          products.forEach(p => {

            productsCollection.update({ _id: p._id },
              {
                $set: {
                  stockquantity: p.stockquantity
                }
              }, function (err, data) {
                if (err) throw err;

                tracker++
                if (tracker === limit) {
                  res.send("Order Successful!! \n Your Order Id is " + orderId);
                }
              });
          });
        });
      });

    });
  });
});


/**
 * Admin functionality - Displays the form required for creation of Items - Bagels/Beverages
 */
router.get('/item/create', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  res.render('createorupdateitem', { product: getItemFormBody() });
});

/**
 * Admin functionality - Handles the creation of Items - Bagels/Beverages
 */
router.post('/item/create', (req, res) => {

  if (req.files) {
    var file = req.files.image;
    var fileName = file.name;
    file.mv('./public/images/' + fileName, function (err) {
      if (err) throw err;
      productsCollection.insert({
        "name": req.body.name,
        "description": req.body.description,
        "stockquantity": req.body.quantity,
        "price": req.body.price,
        "category": req.body.category,
        "image": fileName,
        "isdeleted": false
      }, function (err, dat) {
        if (err) throw err;
        var route = req.body.category === "bagel" ? "bagels" : req.body.category === "beverage" ? "beverages" : "menu";
        if (route)
          res.redirect('/' + route);
      });
    })
  }
});

/**
 * Admin functionality - Handles the display of information of a Product for updation
 */
router.get('/item/update/:id', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  var status = req.query && req.query.status ? req.query.status : "";
  productsCollection.findOne({ _id: req.params.id }, function (err, product) {
    if (err) throw err;
    var formBody = {
      "id": product._id.toString(),
      "name": product.name,
      "description": product.description,
      "quantity": product.stockquantity,
      "price": product.price,
      "category": product.category,
      "image": product.image,
      "status": status
    }
    res.render('createorupdateitem', { product: formBody });
  });
});

/**
 * Admin functionality - Handles updation of a Product
 */
router.post('/item/update', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  if (req.files) {
    var file = req.files.image;
    var fileName = file.name;
    file.mv('./public/images/' + fileName, function (err) {

      if (req.body.uploadedImage) {
        fs.unlink('./public/images/' + req.body.uploadedImage, (err) => {
          if (err) throw err;

          updateProduct(req.body, fileName, res);
        })
      }
      else {
        updateProduct(req.body, fileName, res);
      }
    });
  }
  else {
    updateProduct(req.body, "", res)
  }
});

/**
 * Admin functionality - Handles deletion of a Product
 */
router.delete('/item/delete', connectEnsureLogin.ensureLoggedIn(), function (req, res) {
  productsCollection.update({ _id: req.body.id }, {
    $set: {
      isdeleted: true
    }
  }, function (err, resp) {
    if (err) throw err;
    res.send("Item deleted successfully!");
  });
});

/**
 * Handles display of Order History for the logged in User
 */
router.get('/order/history', connectEnsureLogin.ensureLoggedIn(), function (req, res) {

  ordersCollection.find({ userId: userProfile.username }, function (err, data) {
    data.forEach(d => {
      var orderValue = 0;
      d.products.forEach(p => {
        orderValue += p.totalPrice;
        p.customizations.forEach(c => {
          orderValue += c.totalPrice;
        });
      });
      d.orderValue = orderValue;
    });
    res.render('orderhistory', { orderHistory: data ? data : [] });
  });
});


//#region Helper Methods
/**
 * Calculates the total price of the products in the cart
 * called while loading the Cart and when updating the quantity
 * @param {*} products 
 * @returns 
 */
function getTotalPrice(products) {
  var totalPrice = 0;
  products.forEach(p => {
    totalPrice += (parseFloat(p.price) * parseInt(p.quantity));
    p.customizations.forEach(c => {
      totalPrice += (parseFloat(c.price) * parseInt(c.quantity));
    })
  });
  return totalPrice;
}

/**
 * Prepares the Form body required for displaying Product details in case of Update or for creating a new Item
 * @param {*} product 
 * @returns 
 */
function getItemFormBody(product) {
  return {
    "name": product ? product.name : "",
    "description": product ? product.description : "",
    "quantity": product ? product.quantity : "",
    "price": product ? product.price : "",
    "category": product ? product.category : "",
    "image": product ? product.image : "",
    "isdeleted": false,
    "status": ""
  }
}

/**
 * Handles updation of a Product
 * @param {*} body 
 * @param {*} fileName 
 * @param {*} res 
 */
function updateProduct(body, fileName, res) {
  var data = fileName ? {
    "name": body.name,
    "description": body.description,
    "stockquantity": body.quantity,
    "price": body.price,
    "category": body.category,
    "image": fileName,
  } : {
    "name": body.name,
    "description": body.description,
    "stockquantity": body.quantity,
    "price": body.price,
    "category": body.category
  };
  productsCollection.update({ _id: body.id },
    {
      $set: data
    }, function (err, data) {
      if (err) throw err;
      var path = "/item/update/" + body.id + "/?status=success";
      res.redirect(path);
    });
}

/**
 * Common method to handle Pagination for Menu, Bagels and Beverages page
 * @param {*} req 
 * @param {*} res 
 */
function handlePagination(req, res) {
  var skip = parseInt(req.body.skip);
  var nextPage = parseInt(req.body.currentPage);
  var categoryTitle = req.body.asm;
  var category = req.body.category === "" ? ["bagel", "beverage"] : [req.body.category];

  var filterOpts = categoryTitle === "Menu" ? filterOptions : categoryTitle === "Bagels" ? [filterOptions[0]] : categoryTitle === "Beverages" ? [filterOptions[1]] : filterOptions;
  var filterVals = categoryTitle === "Menu" ? filterValues : categoryTitle === "Bagels" ? [filterValues[0]] : categoryTitle === "Beverages" ? [filterValues[1]] : filterValues;

  productsCollection.find({ category: { $in: category }, isdeleted: false }, { limit: defaultPageSize, skip: skip, sort: { name: 1 } }, function (err, products) {
    if (err) throw err;
    res.render('index', { currentPage: nextPage, skip: skip, results: products, category: categoryTitle, userProfile: userProfile, productName: "", categoryFilter: req.body.category, filterOptions: filterOpts, filterValues: filterVals, paginateCategory: req.body.category });
  });
}

//#endregion

module.exports = router;
