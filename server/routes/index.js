const express = require('express');
const router = express.Router();

router.get('/', function(req, res) {

    res.json({response: "Still Alive"}).status(200);
});

module.exports = router;