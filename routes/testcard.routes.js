const express = require('express');
const router = express.Router();
const testCardController = require('../controllers/testcard.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.post('/', verifyToken, testCardController.createTestCard);
router.get('/', verifyToken, testCardController.getAllTestCards);
router.get('/:id', verifyToken, testCardController.getTestCard);
router.put('/:id', verifyToken, testCardController.updateTestCard);
router.delete('/:id', verifyToken, testCardController.deleteTestCard);

module.exports = router;