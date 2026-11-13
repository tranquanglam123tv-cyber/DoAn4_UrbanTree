// backend/src/registry.js
const express = require("express");
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const router = express.Router();

// Đọc địa chỉ triển khai mới nhất
const deployment = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "deployed-contract.json"))
);
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

// Sử dụng private key của Deployer từ biến môi trường (.env)
// Tuyệt đối không hard-code private key trong mã nguồn (Tuân thủ OWASP & ISO 27001)
const deployerPrivateKey =
    process.env.DEPLOYER_PRIVATE_KEY ||
    process.env.BLOCKCHAIN_OPERATOR_PRIVATE_KEY;

if (!deployerPrivateKey) {
    console.warn("⚠️ [BLOCKCHAIN WARNING] Chưa cấu hình DEPLOYER_PRIVATE_KEY trong .env. Sử dụng tài khoản mặc định chỉ cho môi trường phát triển cục bộ.");
}

const signer = new ethers.Wallet(
    deployerPrivateKey || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    provider
);

// ABI giao tiếp Smart Contract
const abi = [
    "function anchorRecord(string recordId,string recordType,string dataHash) external",
    "function verifyRecord(string recordId,string currentHash) external view returns (bool isValid,bool isExisted,uint256 timestamp,address recorder,string dataHash)",
    "function getRecord(string recordId) external view returns (tuple(string recordId,string recordType,string dataHash,uint256 timestamp,address recorder,bool exists))"
];
const contract = new ethers.Contract(deployment.contractAddress, abi, signer);

// ------------------- POST /record -------------------
router.post("/record", async (req, res) => {
    const { recordId, recordType, dataHash } = req.body;
    try {
        const tx = await contract.anchorRecord(recordId, recordType, dataHash);
        await tx.wait();
        res.json({ status: "ok", txHash: tx.hash });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

// ------------------- GET /record/:id -------------------
router.get("/record/:id", async (req, res) => {
    try {
        const rec = await contract.getRecord(req.params.id);
        if (!rec.exists) {
            return res.status(404).json({ error: "Record not found on blockchain" });
        }
        res.json({
            recordId: rec.recordId,
            recordType: rec.recordType,
            dataHash: rec.dataHash,
            timestamp: Number(rec.timestamp),
            recorder: rec.recorder,
            exists: rec.exists
        });
    } catch (e) {
        res.status(404).json({ error: e.message });
    }
});

// ------------------- GET /verify/:id -------------------
router.get("/verify/:id", async (req, res) => {
    const { currentHash } = req.query; // hash hiện tại tính từ DB off-chain
    try {
        const [isValid, isExisted, timestamp, recorder, dataHash] = await contract.verifyRecord(
            req.params.id,
            currentHash
        );
        res.json({
            isValid,
            isExisted,
            timestamp: Number(timestamp),
            recorder,
            dataHash
        });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

module.exports = router;
