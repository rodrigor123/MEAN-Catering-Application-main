'use strict';

var express = require('express');
var controller = require('./event.controller');

var router = express.Router();

router.get('/', controller.index);
router.get('/:id', controller.show);
router.post('/', controller.index);
router.post('/dataset', controller.dataset);
router.post('/adminEvents', controller.adminEvents);
router.post('/payments', controller.payments);
router.post('/new', controller.create);
router.put('/:id', controller.update);
router.post('/:id', controller.update);
router.post('/:id/state', controller.getState);
router.post('/:id/isUpdated', controller.isUpdated);
router.post('/:id/isSentTo', controller.isSentTo);
router.post('/:id/decline', controller.update);
router.post('/:id/cancel', controller.update);
router.patch('/:id', controller.update);
router.delete('/:id', controller.deleteEvent);
//router.delete('/:id', controller.destroy);

module.exports = router;
