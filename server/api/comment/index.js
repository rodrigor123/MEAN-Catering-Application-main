'use strict';

var express = require('express');
var controller = require('./comment.controller');

var router = express.Router();

router.get('/', controller.index);
router.get('/:id', controller.show);
router.get('/thread/:id', controller.thread);
router.post('/new', controller.newComments);
router.post('/', controller.index);
router.post('/add', controller.create);
//router.post('/addChild', controller.addChild);
router.put('/:id', controller.update);
router.post('/:id', controller.update);
router.patch('/:id', controller.update);
router.delete('/:id', controller.destroy);

module.exports = router;
