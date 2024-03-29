var express = require('express')

const { createProxyMiddleware } = require('http-proxy-middleware');

var app = express()

app.use('/api', createProxyMiddleware({ target: 'http://127.0.0.1:9339', changeOrigin: true }))
app.use('/', createProxyMiddleware('/', { target: 'http://127.0.0.1:9338', changeOrigin: true }))

app.listen(9337, function () {
  console.log('Dev-proxy listening on port 9337')
})
