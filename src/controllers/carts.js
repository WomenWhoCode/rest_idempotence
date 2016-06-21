var Cart = require('../models/cart');
var cartView = require('../views/cart');

exports.param = function(req, res, next, cartId) {
  try {
    var cart = Cart.get(cartId);
  }
  catch (e) {
    res.status(404).send('cart_id ' + cartId + ' not found');
    return;
  }
  req.cart = cart;
  next();
}

exports.create = function(req, res) {
  var cart = new Cart();
  res.set(cartView.header(cart));
  res.send(cartView.body(cart));
};

exports.read = function(req, res) {
  res.set(cartView.header(req.cart));
  res.send(cartView.body(req.cart));
};

var compareAndExecute = function(req, res, next) {
  var itemsEtag = req.headers['if-match'];
  if (!itemsEtag) {
    res.status(400).send('invalid header: missing Items-ETag');
    return;
  }
  if (req.cart.itemsHash() != itemsEtag) {
    res.status(400).send('invalid header: non matching Items-ETag');
    return;
  }
  next(req, res);
}

exports.createItems = function(req, res) {
  compareAndExecute(req, res, function(req, res) {
    var productId = req.body.productId;
    var quantity = req.body.quantity;
    if (!productId) {
      res.status(400).send('invalid body: missing productId');
      return;
    }
    if (typeof(productId) != 'string') {
      res.status(400).send('invalid body: productId must be string');
      return;
    }
    if (!quantity) {
      res.status(400).send('invalid body: missing quantity');
      return;
    }
    if (typeof(quantity) != 'number') {
      res.status(400).send('invalid body: quantity must be number');
      return;
    }
    req.cart.addItems(productId, quantity);
    res.set(cartView.itemsHeader(req.cart));
    res.send(cartView.itemsBody(req.cart));
  });
};

exports.updateItems = function(req, res) {
  compareAndExecute(req, res, function(req, res) {
    try {
      req.cart.setItems(req.body);
    }
    catch (e) {
      res.status(400).send('invalid body: ' + e.message);
      return;
    }
    res.set(cartView.itemsHeader(req.cart));
    res.send(cartView.itemsBody(req.cart));
  });
};

exports.updatePurchase = function(req, res) {
  if (req.cart.purchase) {
    res.status(400).send('invalid request: purchase already true');
    return;
  }
  req.cart.purchase = true;
  res.set(cartView.header(req.cart));
  res.send(cartView.body(req.cart));
};
