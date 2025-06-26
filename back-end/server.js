require('dotenv').config();

const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 后端服务已在 http://localhost:${PORT} 端口启动 (MetaMask 签名模式)`);
    console.log(`🌐 允许跨域访问的前端地址: ${process.env.FRONTEND_URL}`);
});