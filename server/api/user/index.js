'use strict';

import {Router} from 'express';
import * as controller from './user.controller';
import * as auth from '../../auth/auth.service';

var router = new Router();

router.get('/', auth.hasRole('admin'), controller.index);
//router.delete('/:id', auth.hasRole('admin'), controller.destroy);
router.delete('/:id', auth.hasRole('admin'), controller.deleteUser);
router.get('/me', auth.isAuthenticated(), controller.me);
router.get('/verify/:id', controller.verify);
router.put('/:id/password', auth.isAuthenticated(), controller.changePassword);
router.get('/caterers', controller.caterers);
router.post('/reset', controller.reset);
router.get('/:id', controller.show);
router.post('/:id', controller.update);
router.post('/', controller.createTemp);
//router.post('/', controller.create);
//router.get('/:id', auth.isAuthenticated(), controller.show);

module.exports = router;
