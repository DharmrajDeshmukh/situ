const Joi = require('joi');

// --- 1. Middleware Helper ---
const formatError = (error) => {
  return error.details.map((detail) => detail.message).join(', ');
};

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: formatError(error)
      });
    }
    next();
  };
};

// --- 2. Auth Schemas ---
const requestPhoneOtpSchema = Joi.object({
  phone: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).required().messages({ 'string.pattern.base': 'Phone must be in E.164 format (+91...)' }),
  country_code: Joi.string().optional()
});

const verifyPhoneOtpSchema = Joi.object({
  phone: Joi.string().required(),
  otp: Joi.string().length(6).required(),
  device_info: Joi.string().optional(),
  device_id: Joi.string().optional()
});

const requestEmailVerificationSchema = Joi.object({
  email: Joi.string().email().required(),
  send_method: Joi.string().valid('code', 'link').default('code')
});

const verifyEmailSchema = Joi.object({
  email: Joi.string().email(),
  code: Joi.string(),
  token: Joi.string(),
  device_info: Joi.string().optional()
}).xor('code', 'token').when('code', { is: Joi.exist(), then: Joi.object({ email: Joi.required() }) });

const refreshTokenSchema = Joi.object({
  refresh_token: Joi.string().required(),
  device_id: Joi.string().optional()
});

const logoutSchema = Joi.object({
  refresh_token: Joi.string().required()
});

const resendSchema = Joi.object({
  type: Joi.string().valid('otp', 'email').required(),
  phone: Joi.string().when('type', { is: 'otp', then: Joi.required() }),
  email: Joi.string().email().when('type', { is: 'email', then: Joi.required() })
});

// --- 3. Profile Schemas ---
const editProfileSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional(),
  username: Joi.string().pattern(/^[a-z0-9_]{3,20}$/).optional(),
  bio: Joi.string().max(200).allow('').optional(),
  college: Joi.string().min(2).max(100).pattern(/^[a-zA-Z0-9\s,\-]+$/).optional(),
  skills: Joi.array().items(Joi.string()).optional(),
  interests: Joi.array().items(Joi.string()).optional()
});

const updateNameSchema = Joi.object({
  name: Joi.string().min(2).max(50).required()
});

const updateUsernameSchema = Joi.object({
  username: Joi.string().pattern(/^[a-z0-9_]{3,20}$/).required()
});

const updateBioSchema = Joi.object({
  bio: Joi.string().max(200).allow('').required()
});

const updateCollegeSchema = Joi.object({
  college: Joi.string().min(2).max(100).pattern(/^[a-zA-Z0-9\s,\-]+$/).required()
});

const manageSkillSchema = Joi.object({
  skill: Joi.string().min(1).required()
});

const manageInterestSchema = Joi.object({
  interest: Joi.string().min(2).max(30).pattern(/^[a-zA-Z0-9\- ]+$/).required()
});

// --- 4. Social Schemas ---
const connectionRequestSchema = Joi.object({
  to_user_id: Joi.string().hex().length(24).required()
});

const acceptRequestSchema = Joi.object({
  from_user_id: Joi.string().hex().length(24).required()
});

const cancelRequestSchema = Joi.object({
  to_user_id: Joi.string().hex().length(24).required()
});

const removeConnectionSchema = Joi.object({
  user_id: Joi.string().hex().length(24).required()
});

// --- 5. Pagination & IDs ---
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20)
});

const getIdeaDetailsSchema = Joi.object({
  idea_id: Joi.string().hex().length(24).required()
});

const getGroupDetailsSchema = Joi.object({
  group_id: Joi.string().hex().length(24).required()
});

// --- 6. EXPORT ---
module.exports = {
  validateRequest,
  schemas: {
    requestPhoneOtp: requestPhoneOtpSchema,
    verifyPhoneOtp: verifyPhoneOtpSchema,
    requestEmailVerification: requestEmailVerificationSchema,
    verifyEmail: verifyEmailSchema,
    refreshToken: refreshTokenSchema,
    logout: logoutSchema,
    resend: resendSchema,
    
    editProfile: editProfileSchema,
    updateName: updateNameSchema,
    updateUsername: updateUsernameSchema,
    updateBio: updateBioSchema,
    updateCollege: updateCollegeSchema,
    manageSkill: manageSkillSchema,
    manageInterest: manageInterestSchema,
    
    connectionRequest: connectionRequestSchema,
    acceptRequest: acceptRequestSchema,
    cancelRequest: cancelRequestSchema,
    removeConnection: removeConnectionSchema,
    
    pagination: paginationSchema,
    getIdeaDetails: getIdeaDetailsSchema,
    getGroupDetails: getGroupDetailsSchema
  }
};