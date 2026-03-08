export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Something went wrong';

  if (!err.isOperational) {
    console.error('Unexpected error:', err);
  }

  res.status(statusCode).json({
    success: false,
    data: null,
    error: message,
  });
}
