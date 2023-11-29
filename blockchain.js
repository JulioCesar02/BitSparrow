const fs = require('fs/promises');  // Módulo para manipulação de arquivos assíncrona
const SHA256 = require('crypto-js/sha256');
const { createKeyPair, signTransaction, verifySignature } = require('./crypto');

class Transaction {
    // Construtor da transação
    constructor(sender, recipient, amount) {
        this.sender = sender;
        this.recipient = recipient;
        this.amount = amount;
        this.timestamp = Date.now();
        this.signature = null;
    }

    // Método para assinar a transação
    signTransaction(privateKey) {
        const transactionData = `${this.sender}${this.recipient}${this.amount}${this.timestamp}`;
        this.signature = signTransaction(transactionData, privateKey);
    }

    // Método para verificar se a transação é válida
    isValid() {
        if (!this.signature || !this.sender || !this.recipient || !this.amount || !this.timestamp) {
            return false;
        }

        const transactionData = `${this.sender}${this.recipient}${this.amount}${this.timestamp}`;
        return verifySignature(transactionData, this.signature, this.sender);
    }
}

class Block {
    // Construtor do bloco
    constructor(index, timestamp, transactions, previousHash = '') {
        this.index = index;
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.hash = this.calculateHash();
    }

    // Método para calcular o hash do bloco
    calculateHash() {
        return SHA256(this.index + this.timestamp + JSON.stringify(this.transactions) + this.previousHash).toString();
    }
}

class Blockchain {
    // Construtor da blockchain
    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.pendingTransactions = [];
        this.cryptoName = 'BitSparrow';  // Nome da criptomoeda
        this.filepath = 'blockchain.json';  // Caminho do arquivo para persistência de dados locais
    }

    // Método para criar o bloco gênesis
    createGenesisBlock() {
        return new Block(0, '01/01/2023', [], '0');
    }

    // Método para obter o bloco mais recente
    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    // Método para minerar transações pendentes e adicionar um novo bloco à blockchain
    minePendingTransactions(miningRewardAddress, miningRewardAmount) {
        const newBlock = new Block(
            this.chain.length,
            Date.now(),
            this.pendingTransactions,
            this.getLatestBlock().hash
        );
        this.pendingTransactions = [];
        this.addBlock(newBlock);

        // Recompensar o minerador
        this.createTransaction(
            null,
            miningRewardAddress,
            miningRewardAmount
        );

        // Salvar a blockchain no arquivo após cada mineração
        this.saveToFile();
    }

    // Método para criar uma transação
    createTransaction(sender, recipient, amount, privateKey) {
        const newTransaction = new Transaction(sender, recipient, amount);

        if (privateKey) {
            newTransaction.signTransaction(privateKey);

            if (newTransaction.isValid()) {
                this.pendingTransactions.push(newTransaction);
            } else {
                console.error('Invalid transaction! Discarding...');
                return;
            }
        } else {
            // Tratamento para transações sem assinatura (por exemplo, recompensa de mineração)
            this.pendingTransactions.push(newTransaction);
        }

        // Salvar a blockchain no arquivo após cada transação
        this.saveToFile();
    }

    // Método para obter o saldo de um endereço
    getBalanceOfAddress(address) {
        let balance = 0;

        for (const block of this.chain) {
            for (const transaction of block.transactions) {
                if (transaction.sender === address) {
                    balance -= transaction.amount;
                }
                if (transaction.recipient === address) {
                    balance += transaction.amount;
                }
            }
        }

        return balance;
    }

    // Método para adicionar um bloco à blockchain
    addBlock(newBlock) {
        newBlock.previousHash = this.getLatestBlock().hash;
        newBlock.hash = newBlock.calculateHash();
        this.chain.push(newBlock);
    }

    // Método para salvar a blockchain no arquivo
    async loadFromFile() {
        try {
            const data = await fs.readFile(this.filepath, 'utf-8');
            const parsedData = JSON.parse(data);
            this.chain = parsedData.chain;
            this.pendingTransactions = parsedData.pendingTransactions;
            console.log('Blockchain loaded from file:', this.filepath);
        } catch (error) {
            if (error.code === 'ENOENT') {
                // O arquivo não existe, crie uma nova blockchain
                console.log('Blockchain file not found. Creating a new one.');
                await this.saveToFile();
            } else {
                console.error('Error loading blockchain from file:', error);
            }
        }
    }

    async saveToFile() {
        try {
            const data = JSON.stringify({ chain: this.chain, pendingTransactions: this.pendingTransactions }, null, 2);
            await fs.writeFile(this.filepath, data);
            console.log('Blockchain saved to file:', this.filepath);
        } catch (error) {
            console.error('Error saving blockchain to file:', error);
        }
    }
}

module.exports = { Transaction, Block, Blockchain };

