const crypto = require('crypto');

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
        if (!this.signature || !this.recipient || !this.amount || !this.timestamp) {
            return false;
        }

        if (this.sender) {
            const transactionData = `${this.sender}${this.recipient}${this.amount}${this.timestamp}`;
            return verifySignature(transactionData, this.signature, this.sender);
        } else {
            // Transação sem remetente, considerada válida
            return true;
        }
    }
}

function createKeyPair() {
    // Gera um par de chaves público-privado usando o algoritmo RSA
    return crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
}

function signTransaction(data, privateKey) {
    // Assina dados usando uma chave privada e retorna a assinatura
    const sign = crypto.createSign('SHA256');
    sign.write(data);
    sign.end();
    return sign.sign(privateKey, 'base64');
}

function verifySignature(data, signature, publicKey) {
    // Verifica se a assinatura é válida para os dados fornecidos e a chave pública
    const verify = crypto.createVerify('SHA256');
    verify.write(data);
    verify.end();
    return verify.verify(publicKey, signature, 'base64');
}

module.exports = { createKeyPair, signTransaction, verifySignature, Transaction };




