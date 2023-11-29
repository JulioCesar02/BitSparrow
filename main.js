const express = require('express');
const { Blockchain } = require('./blockchain');

const app = express();
app.use(express.json());

const port = 3000;

const myCoin = new Blockchain();

const miningRewardAddress = '397ffa57237b4075104e3d587b6744c62ce085b2f02dbbc4d80eeb9671f26d4f';
const miningRewardAmount = 10;

(async () => {
    await myCoin.loadFromFile(); // Carrega dados do arquivo ao iniciar

    // Endpoint para visualizar o blockchain
    app.get('/blocks', (req, res) => {
        res.json(myCoin.chain);
        console.log('GET /blocks completed');
    });

    const { createKeyPair } = require('./crypto');

    // Endpoint para criar uma transação
    app.post('/transactions', (req, res) => {
        const { sender, recipient, amount } = req.body;
        myCoin.createTransaction(sender, recipient, amount);
        res.json({ message: 'Transaction created successfully' });
    });

    // Endpoint para minerar blocos
    app.post('/mine', (req, res) => {
        const newBlock = myCoin.minePendingTransactions(miningRewardAddress, miningRewardAmount);
        res.json({ message: 'Block mined successfully', block: newBlock });
    });

    // Endpoint para visualizar o saldo de um endereço
    app.get('/balance/:address', (req, res) => {
        const balance = myCoin.getBalanceOfAddress(req.params.address);
        res.json({ balance });
    });

    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
})();
