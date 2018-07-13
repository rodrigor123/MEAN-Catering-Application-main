'use strict';

var express = require('express');
var controller = require('./offer.controller');

var router = express.Router();

router.get('/', controller.index);
router.get('/:id', controller.show);
router.post('/', controller.index);
router.post('/cancelAll', controller.cancelAll);
router.post('/new', controller.create);
router.put('/:id', controller.update);
router.post('/:id/confirm', controller.update);
router.post('/:id', controller.update);
router.post('/:id/accept', controller.update);
router.post('/:id/cancel', controller.update);
router.post('/:id/decline', controller.update);
router.post('/total', controller.total);
router.patch('/:id', controller.update);
router.delete('/:id', controller.destroy);
router.post('/filtered', controller.filteredList);
router.post('/:id/state', controller.getState);
router.post('/:id/isUpdated', controller.isUpdated);

module.exports = router;
