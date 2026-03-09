export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Something went wrong';

  if (!err.isOperational) {
    console.error('Unexpected error:', err);
    // #region agent log
    fetch('http://127.0.0.1:7298/ingest/84d36a48-c059-450f-bcf1-32d935b76100',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'5a833e'},body:JSON.stringify({sessionId:'5a833e',location:'errorHandler.js',message:'Unhandled 500 error',data:{url:req.originalUrl,method:req.method,error:err.message,stack:err.stack?.slice(0,800)},timestamp:Date.now(),hypothesisId:'H1-H4'})}).catch(()=>{});
    // #endregion
  }

  res.status(statusCode).json({
    success: false,
    data: null,
    error: message,
  });
}
