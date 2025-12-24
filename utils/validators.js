// const Joi = require('joi');

// // --- 1. Middleware Helper ---
// const formatError = (error) => {
//   return error.details.map((detail) => detail.message).join(', ');
// };

// const validateRequest = (schema) => {
//   return (req, res, next) => {
//     const { error } = schema.validate(req.body, { abortEarly: false });
//     if (error) {
//       return res.status(400).json({
//         success: false,
//         message: 'Validation Error',
//         errors: formatError(error)
//       });
//     }
//     next();
//   };
// };

// // --- 2. Auth Schemas ---
// const requestPhoneOtpSchema = Joi.object({
//   phone: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).required().messages({ 'string.pattern.base': 'Phone must be in E.164 format (+91...)' }),
//   country_code: Joi.string().optional()
// });

// const verifyPhoneOtpSchema = Joi.object({
//   phone: Joi.string().required(),
//   otp: Joi.string().length(6).required(),
//   device_info: Joi.string().optional(),
//   device_id: Joi.string().optional()
// });

// const requestEmailVerificationSchema = Joi.object({
//   email: Joi.string().email().required(),
//   send_method: Joi.string().valid('code', 'link').default('code')
// });

// const verifyEmailSchema = Joi.object({
//   email: Joi.string().email(),
//   code: Joi.string(),
//   token: Joi.string(),
//   device_info: Joi.string().optional()
// }).xor('code', 'token').when('code', { is: Joi.exist(), then: Joi.object({ email: Joi.required() }) });

// const refreshTokenSchema = Joi.object({
//   refresh_token: Joi.string().required(),
//   device_id: Joi.string().optional()
// });

// const logoutSchema = Joi.object({
//   refresh_token: Joi.string().required()
// });

// const resendSchema = Joi.object({
//   type: Joi.string().valid('otp', 'email').required(),
//   phone: Joi.string().when('type', { is: 'otp', then: Joi.required() }),
//   email: Joi.string().email().when('type', { is: 'email', then: Joi.required() })
// });

// // --- 3. Profile Schemas ---
// const editProfileSchema = Joi.object({
//   name: Joi.string().min(2).max(50).optional(),
//   username: Joi.string().pattern(/^[a-z0-9_]{3,20}$/).optional(),
//   bio: Joi.string().max(200).allow('').optional(),
//   college: Joi.string().min(2).max(100).pattern(/^[a-zA-Z0-9\s,\-]+$/).optional(),
//   skills: Joi.array().items(Joi.string()).optional(),
//   interests: Joi.array().items(Joi.string()).optional()
// });

// const updateNameSchema = Joi.object({
//   name: Joi.string().min(2).max(50).required()
// });

// const updateUsernameSchema = Joi.object({
//   username: Joi.string().pattern(/^[a-z0-9_]{3,20}$/).required()
// });

// const updateBioSchema = Joi.object({
//   bio: Joi.string().max(200).allow('').required()
// });

// const updateCollegeSchema = Joi.object({
//   college: Joi.string().min(2).max(100).pattern(/^[a-zA-Z0-9\s,\-]+$/).required()
// });

// const manageSkillSchema = Joi.object({
//   skill: Joi.string().min(1).required()
// });

// const manageInterestSchema = Joi.object({
//   interest: Joi.string().min(2).max(30).pattern(/^[a-zA-Z0-9\- ]+$/).required()
// });

// // --- 4. Social Schemas ---
// const connectionRequestSchema = Joi.object({
//   to_user_id: Joi.string().hex().length(24).required()
// });

// const acceptRequestSchema = Joi.object({
//   from_user_id: Joi.string().hex().length(24).required()
// });

// const cancelRequestSchema = Joi.object({
//   to_user_id: Joi.string().hex().length(24).required()
// });

// const removeConnectionSchema = Joi.object({
//   user_id: Joi.string().hex().length(24).required()
// });

// // --- 5. Pagination & IDs ---
// const paginationSchema = Joi.object({
//   page: Joi.number().integer().min(1).default(1),
//   limit: Joi.number().integer().min(1).max(50).default(20)
// });

// const getIdeaDetailsSchema = Joi.object({
//   idea_id: Joi.string().hex().length(24).required()
// });

// const getGroupDetailsSchema = Joi.object({
//   group_id: Joi.string().hex().length(24).required()
// });

// // --- 6. EXPORT ---
// module.exports = {
//   validateRequest,
//   schemas: {
//     requestPhoneOtp: requestPhoneOtpSchema,
//     verifyPhoneOtp: verifyPhoneOtpSchema,
//     requestEmailVerification: requestEmailVerificationSchema,
//     verifyEmail: verifyEmailSchema,
//     refreshToken: refreshTokenSchema,
//     logout: logoutSchema,
//     resend: resendSchema,
    
//     editProfile: editProfileSchema,
//     updateName: updateNameSchema,
//     updateUsername: updateUsernameSchema,
//     updateBio: updateBioSchema,
//     updateCollege: updateCollegeSchema,
//     manageSkill: manageSkillSchema,
//     manageInterest: manageInterestSchema,
    
//     connectionRequest: connectionRequestSchema,
//     acceptRequest: acceptRequestSchema,
//     cancelRequest: cancelRequestSchema,
//     removeConnection: removeConnectionSchema,
    
//     pagination: paginationSchema,
//     getIdeaDetails: getIdeaDetailsSchema,
//     getGroupDetails: getGroupDetailsSchema
//   }
// };
final 
utils/validators.js
const Joi = require('joi');

// Helper to format error messages
const formatError = (error) => {
  return error.details.map((detail) => detail.message).join(', ');
};

// Middleware Wrapper with LOGGING
const validateRequest = (schema) => {
  return (req, res, next) => {
    // allowUnknown: true ensures we don't fail if the app sends extra random fields
    const { error } = schema.validate(req.body, { abortEarly: false, allowUnknown: true });
    
    if (error) {
      console.log("❌ [Validation Failed] Endpoint:", req.originalUrl);
      console.log("   👉 Incoming Data:", req.body);
      console.log("   👉 Error Details:", formatError(error));
      
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: formatError(error)
      });
    }
    next();
  };
};

// --- SCHEMAS ---

const schemas = {
  // 1. Request OTP (First Screen) - RELAXED
  requestPhoneOtp: Joi.object({
    phone: Joi.string().required(), // Accepts "9876543210" or "+919876543210"
    country_code: Joi.string().optional().allow(null, '') 
  }),

  // 2. Verify OTP (Login) - RELAXED
  verifyPhoneOtp: Joi.object({
    phone: Joi.string().required(),
    otp: Joi.string().required(),
    device_info: Joi.string().optional().allow(null, ''),
    device_id: Joi.string().optional().allow(null, '')
  }),

  // 3. Email Flows
  requestEmailVerification: Joi.object({
    email: Joi.string().required() // Removed strict .email() check just in case
  }),
  verifyEmail: Joi.object({
    email: Joi.string().required(),
    code: Joi.string().optional().allow(null, ''),
    token: Joi.string().optional().allow(null, '')
  }),

  // 4. Tokens
  refreshToken: Joi.object({
    refresh_token: Joi.string().required(),
    device_id: Joi.string().optional().allow(null, '')
  }),
  logout: Joi.object({
    refresh_token: Joi.string().required()
  }),

  // 5. Resend Code
  resend: Joi.object({
    type: Joi.string().required(), // "otp" or "email"
    phone: Joi.string().optional().allow(null, ''),
    email: Joi.string().optional().allow(null, '')
  }),

  // 6. Profile & Others (Standard Permissive)
  editProfile: Joi.object({}).unknown(true), // Allow anything for edit profile
  updateName: Joi.object({ name: Joi.string().required() }),
  updateUsername: Joi.object({ username: Joi.string().required() }),
  updateBio: Joi.object({ bio: Joi.string().allow('', null) }),
  updateCollege: Joi.object({ college: Joi.string().allow('', null) }),
  
  // Social
  connectionRequest: Joi.object({
    targetId: Joi.string().required(),
    targetType: Joi.string().optional()
  }),
  acceptRequest: Joi.object({ requestId: Joi.string().required() }),
  
  // Engagement
  view: Joi.object({ targetId: Joi.string().required() }).unknown(true),
  like: Joi.object({ targetId: Joi.string().required() }).unknown(true),
  
  // Defaults for others
  pagination: Joi.object({
    page: Joi.number().optional(),
    limit: Joi.number().optional()
  }).unknown(true)
};

module.exports = {
  validateRequest,
  schemas: {
    // Mapping specific names used in routes
    requestPhoneOtp: schemas.requestPhoneOtp,
    verifyPhoneOtp: schemas.verifyPhoneOtp,
    requestEmailVerification: schemas.requestEmailVerification,
    verifyEmail: schemas.verifyEmail,
    refreshToken: schemas.refreshToken,
    logout: schemas.logout,
    resend: schemas.resend,
    
    // Profile
    editProfile: schemas.editProfile,
    updateName: schemas.updateName,
    updateUsername: schemas.updateUsername,
    updateBio: schemas.updateBio,
    updateCollege: schemas.updateCollege,
    manageSkill: Joi.object({ skill: Joi.string().required() }),
    manageInterest: Joi.object({ interest: Joi.string().required() }),
    
    // Social
    connectionRequest: schemas.connectionRequest,
    acceptRequest: schemas.acceptRequest,
    cancelRequest: Joi.object({ to_user_id: Joi.string().optional() }).unknown(true),
    removeConnection: Joi.object({ user_id: Joi.string().optional() }).unknown(true),
    
    // Misc
    getIdeaDetails: Joi.object({ idea_id: Joi.string().optional() }).unknown(true),
    getGroupDetails: Joi.object({ group_id: Joi.string().optional() }).unknown(true)
  }
};