import express from 'express';
import { exec } from 'child_process';

const app = express();
const port = 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Interactive Linux Terminal</title>
      <style>
        body {
          font-family: monospace;
          background-color: #282828;
          color: #f5f5f5;
          padding: 20px;
        }
        #output {
          white-space: pre-wrap;
          word-wrap: break-word;
          margin-bottom: 20px;
        }
        input {
          width: 100%;
          padding: 10px;
          background-color: #333;
          color: #f5f5f5;
          border: none;
          margin-top: 10px;
        }
      </style>
    </head>
    <body>
      <h1>Interactive Linux Terminal</h1>
      <div id="output"></div>
      <input type="password" id="password" placeholder="Type your password here...">
      <input type="text" id="command" placeholder="Type your command here..." />

      <script>
        const outputDiv = document.getElementById('output');
        const getPassword = document.getElementById('password');
        const inputField = document.getElementById('command');

        inputField.addEventListener('keydown', async (event) => {
          if (event.key === 'Enter') {
            const command = inputField.value;
            const password = getPassword.value;
            inputField.value = '';
            outputDiv.textContent = 'Executing command...';

            const response = await fetch('/execute', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ command,password}),
            });

            const result = await response.json();
            outputDiv.textContent = result.output;
          }
        });
      </script>
    </body>
    </html>
  `);
});


app.post('/execute', (req, res) => {
    const { command,password} = req.body;
    if (!password||password!=="@debian11@"){
        return res.status(400).json({error:'Password is wrong'})
    }
    if (!command) {
        return res.status(400).json({ error: 'No command provided' });
    }

    let options = { timeout: 180000 };

    exec(command, { timeout: options.timeout }, (error, stdout, stderr) => {
        if (error) {
            return res.json({ output: `Error: ${error.message}` });
        }
        if (stderr) {
            return res.json({ output: `stderr: ${stderr}` });
        }


        if (stdout) {
            return res.json({ output: stdout });
        }


        return res.json({ output: ' ' });
    });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
