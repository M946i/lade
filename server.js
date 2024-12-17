import express from 'express';
import fetch from 'node-fetch';
import {exec} from 'child_process';

const app = express();
const port = 3000;

// 获取 IP 信息的路由
app.get('/', async (req, res) => {
    try {
        const response = await fetch('https://ipinfo.io/json');
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch IP info' });
    }
});

// 获取系统信息（uname -a）的路由，返回 JSON 格式
app.get('/uname', (req, res) => {
    exec('uname -a', (err, stdout, stderr) => {
        if (err) {
            console.error('Error executing uname -a:', err);
            return res.status(500).json({ error: 'Failed to execute uname -a' });
        }

        const systemInfo = parseSystemInfo(stdout);
        res.json(systemInfo);
    });
});

// 解析 uname -a 输出的函数，返回一个结构化的 JSON 对象
function parseSystemInfo(output) {
    const parts = output.split(' ');

    // 提取 uname 输出中的各项信息
    return {
        kernel: parts[2], // 内核版本
        hostname: parts[1], // 主机名
        os: parts[0], // 操作系统（Linux）
        kernelVersion: parts[3], // 内核版本号
        architecture: parts[4], // 系统架构
        date: parts.slice(5).join(' ') // 内核构建的日期信息
    };
}

// 获取内存信息（free -m）的路由
app.get('/mem', (req, res) => {
    exec('free -m', (err, stdout, stderr) => {
        if (err) {
            console.error('Error executing free -m:', err);
            return res.status(500).json({ error: 'Failed to execute free -m' });
        }

        // 解析 free -m 命令的输出
        const lines = stdout.split('\n');
        const memLine = lines[1].split(/\s+/);  // Mem 行
        const swapLine = lines[2].split(/\s+/); // Swap 行

        const memoryData = {
            total: memLine[1] + ' MB',
            used: memLine[2] + ' MB',
            free: memLine[3] + ' MB',
            shared: memLine[4] + ' MB',
            buff_cache: memLine[5] + ' MB',
            available: memLine[6] + ' MB',
        };

        const swapData = {
            total: swapLine[1] + ' MB',
            used: swapLine[2] + ' MB',
            free: swapLine[3] + ' MB',
        };

        res.json({
            memory: memoryData,
            swap: swapData,
        });
    });
});

// 获取磁盘信息（lsblk）的路由
app.get('/disk', (req, res) => {
    exec('lsblk -o NAME,SIZE,TYPE,MOUNTPOINT', (err, stdout, stderr) => {
        if (err) {
            console.error('Error executing lsblk:', err);
            return res.status(500).json({ error: 'Failed to execute lsblk' });
        }

        // 解析 lsblk 输出
        const lines = stdout.split('\n');
        const disks = [];

        lines.forEach((line, index) => {
            // 跳过标题行
            if (index === 0) return;

            const columns = line.trim().split(/\s+/);
            if (columns.length >= 4) {
                const disk = {
                    name: columns[0],
                    size: columns[1],
                    type: columns[2],
                    mountpoint: columns[3] || 'N/A', // 如果没有挂载点，设置为 N/A
                };
                disks.push(disk);
            }
        });

        res.json(disks);
    });
});

// 启动服务器
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
