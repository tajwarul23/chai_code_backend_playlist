//taking function as a parameter
const asyncHandler = (func) => async (req, res, next) => {
  try {
    await func(req, res, next);
  } catch (error) {
    res
      .status(error.statusCode || 500 || error.status)
      .json({ success: false, message: error.message });
  }
};

export default asyncHandler;
