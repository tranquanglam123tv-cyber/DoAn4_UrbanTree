#!/bin/bash

echo "[1/3] Bat Backend (Port 5001)..."
(cd backend && npm start) &

echo "[2/3] Bat Frontend (Port 3000)..."
npm run dev &

echo "[3/3] Doi he thong san sang trong 4 giay..."
sleep 4

echo "DANG KET NOI VA TAO LINK TRUY CAP TRUC TUYEN..."
echo "(Tim dong chu https://...trycloudflare.com ben duoi)"
cloudflared tunnel --url http://127.0.0.1:3000 --http-host-header localhost:3000
