import { body, param, query as checkQuery } from 'express-validator';
import { validationResult } from 'express-validator';

// Validation result handler
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// Auth validations
export const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

export const loginRules = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

export const forgotPasswordRules = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
];

export const resetPasswordRules = [
  param('token').notEmpty().withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

export const updateProfileRules = [
  body('name').optional().trim().isLength({ min: 1, max: 100 }),
  body('email').optional().isEmail().normalizeEmail(),
];

export const changePasswordRules = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters'),
];

// Item validations
export const createItemRules = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('category').optional().trim().isLength({ max: 50 }),
  body('brand').optional().trim().isLength({ max: 100 }),
  body('color').optional().trim().isLength({ max: 50 }),
  body('location_found').optional().trim().isLength({ max: 300 }),
  body('date_found').optional().isISO8601().toDate(),
  body('reward_info').optional().trim().isLength({ max: 500 }),
  body('phone').optional().trim().isLength({ max: 20 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('hide_contact').optional().isBoolean(),
];

export const updateItemRules = [
  param('id').isUUID().withMessage('Invalid item ID'),
  ...createItemRules.map(rule => rule.optional()),
];

// Comment validations
export const createCommentRules = [
  param('id').isUUID().withMessage('Invalid item ID'),
  body('content').trim().notEmpty().withMessage('Comment cannot be empty').isLength({ max: 1000 }),
  body('parent_id').optional().isUUID(),
];

// Claim validations
export const createClaimRules = [
  param('id').isUUID().withMessage('Invalid item ID'),
  body('reason').trim().notEmpty().withMessage('Reason is required').isLength({ max: 500 }),
  body('description').optional().trim().isLength({ max: 1000 }),
];

export const updateClaimRules = [
  param('id').isUUID().withMessage('Invalid claim ID'),
  body('status')
    .isIn(['accepted', 'rejected'])
    .withMessage('Status must be accepted or rejected'),
];

// Report validations
export const createReportRules = [
  param('id').isUUID().withMessage('Invalid item ID'),
  body('reason').trim().notEmpty().withMessage('Reason is required').isLength({ max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
];

// Message validations
export const sendMessageRules = [
  body('receiver_id').isUUID().withMessage('Invalid receiver ID'),
  body('content').trim().notEmpty().withMessage('Message cannot be empty').isLength({ max: 2000 }),
  body('item_id').optional().isUUID(),
];

// UUID param validation
export const uuidParam = (paramName = 'id') => [
  param(paramName).isUUID().withMessage(`Invalid ${paramName}`),
];
