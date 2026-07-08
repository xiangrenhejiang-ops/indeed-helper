const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

// 第一周的基础测试接口
app.get('/api/status', (req, res) => {
    res.json({ message: "Week 1 后端服务器运行正常！" });
});

app.listen(PORT, () => {
    console.log(`服务器已成功启动：http://localhost:${PORT}`);
});