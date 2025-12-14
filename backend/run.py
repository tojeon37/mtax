"""
FastAPI 실행 스크립트
"""

import uvicorn
from pathlib import Path

if __name__ == "__main__":
    backend_dir = Path(__file__).parent
    app_dir = backend_dir / "app"

    config = uvicorn.Config(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_dirs=[str(app_dir)],
    )

    server = uvicorn.Server(config)
    server.run()
