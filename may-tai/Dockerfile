FROM python:3.12-slim
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
RUN pip install --no-cache-dir -U yt-dlp
COPY app.py .
# mỗi lần máy khởi động lại thì cập nhật yt-dlp (YouTube, Facebook đổi cách chặn thường xuyên)
CMD sh -c "pip install -q --no-cache-dir -U yt-dlp || true; python app.py"
