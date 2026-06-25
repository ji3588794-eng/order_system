const express = require('express');
const bankAccountRoutes = require('../modules/bankAccounts/bankAccounts.routes');
const inquiryRoutes = require('../modules/inquiries/inquiries.routes');
const itemRoutes = require('../modules/items/items.routes');
const machineRoutes = require('../modules/machines/machines.routes');
const orderRoutes = require('../modules/orders/orders.routes');
const storeOwnerRoutes = require('../modules/storeOwners/storeOwners.routes');
const storeRoutes = require('../modules/stores/stores.routes');
const healthRoutes = require('./health.routes');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/bank-accounts', bankAccountRoutes);
router.use('/stores', storeRoutes);
router.use('/store-owners', storeOwnerRoutes);
router.use('/items', itemRoutes);
router.use('/machines', machineRoutes);
router.use('/inquiries', inquiryRoutes);
router.use('/orders', orderRoutes);

module.exports = router;
