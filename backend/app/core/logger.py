import logging
import os

# Ensure logs directory exists
os.makedirs("logs", exist_ok=True)

# Create logger
logger = logging.getLogger("healthbridge")
logger.setLevel(logging.INFO)

# Avoid duplicate handlers on reload
if not logger.handlers:

    file_handler = logging.FileHandler(
        "logs/healthbridge.log",
        encoding="utf-8"
    )

    formatter = logging.Formatter(
        "%(asctime)s - %(levelname)s - %(message)s"
    )

    file_handler.setFormatter(formatter)

    logger.addHandler(file_handler)