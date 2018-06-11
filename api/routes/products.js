const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function(req, file, cb) {
    cb(null, new Date().toISOString().replace(/:/g, '-') + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  //reject a file
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(null, false);
  }
}
const upload = multer({
  storage: storage,
  limits: {
  fileSize: 1024 * 1024 * 5
  },
  fileFilter: fileFilter
});

const Product = require('../models/product');

router.get('/', (req, res, next) => {
  Product.find()
  .select("name price_id productImage")
  .exec()
  .then(docs => {
    const response = {
      count: docs.lenggth,
      products: docs.map(doc => {
        return {
          name: doc.name,
          price: doc.price,
          productImage: doc.productImage,
          _id: doc._id,
          request: {
            type: "GET",
            url: "https://localhost:3000/products/" + doc._id
          }
        };
      })
    };
    res.status(201).json(response);
  }).catch(err => {
    console.log(err);
    res.status(500).json({
      error: err
    });
  })
});

router.post('/', upload.single('productImage'), (req, res, next) => {
  const product = new Product({
    _id: new mongoose.Types.ObjectId(),
    name: req.body.name,
    price: req.body.price,
    productImage: req.file.path
  });
  product.save().then(result => {
    res.status(201).json({
      message: "Handling POST requests to /products",
      createdProducts: result
    });
  }).catch(err => {
            console.log(err);
            res.status(500).json({
              error: err
            })
        });
});


router.get("/:productId", (req, res, next) => {
  const id = req.params.productId;
  Product.findById(id)
  .select("name price_id productImage")
    .exec()
    .then(doc => {
      console.log("From database", doc);
      if (doc) {
        res.status(200).json(doc);
      } else {
        res.status(404).json({
          message: "No valid entry found"
        });
      }
    }).catch(err => console.log(err));
});


router.patch('/:productId', (req, res, next) => {
  const id =  req.params.productId;
  const updateOps = {};
  for (const ops of req.body) {
    updateOps[ops.propName] = ops.value;
  }
  Product.update({
    _id: id
  }, { $set: updateOps }).exec().then(result => {
    console.log(result);
    res.status(200).json(result);
  }).catch(err => {
    console.log(err);
    res.status(500).json({
      error: err
    })
  });
});

router.delete('/:productId', (req, res, next) => {
  const id = req.params.productId;
  Product.remove({
    _id: id
    }).exec().then(result => {
    res.status(200).json(result);
}).catch(err => {
  console.log(err);
  res.status(500).json({
    error: err
  });
  });
});
module.exports = router;
